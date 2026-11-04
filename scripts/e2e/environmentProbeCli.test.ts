import { isNil } from 'ramda';
import { describe, expect, it, vi } from 'vitest';

import { runLocalCommand } from './environmentCommands';
import { prepareEnvironmentInputs } from './environmentInputs';
import { acquireEnvironmentLock } from './environmentLock';
import { probeEnvironment, runEnvironmentProbeCli } from './environmentProbe';
import {
  probeState,
  release,
  root,
  workdir,
} from './fixtures/environment/probe';

import { mkdir } from 'node:fs/promises';
import { join } from 'node:path';

import type { EnvironmentProbeProgress } from './environmentProbe';

vi.mock('./environmentCommands', async (original) => ({
  ...(await original<typeof import('./environmentCommands')>()),
  runLocalCommand: vi.fn(),
}));
vi.mock('./environmentDocker', () => ({ createDockerDriver: vi.fn() }));
vi.mock('./environmentInputs', () => ({ prepareEnvironmentInputs: vi.fn() }));
vi.mock('./environmentLock', () => ({ acquireEnvironmentLock: vi.fn() }));

const captureCli = () => {
  const stdout = vi
    .spyOn(process.stdout, 'write')
    .mockImplementation(() => true);
  const stderr = vi
    .spyOn(process.stderr, 'write')
    .mockImplementation(() => true);
  return {
    stdout,
    messages: () => stderr.mock.calls.map(([value]) => String(value)),
  };
};

describe('probeEnvironmentのCLI表示と進捗', () => {
  it('長いstartの完了前に安全な段階と保存先を通知する', async () => {
    const events: EnvironmentProbeProgress[] = [];
    let resumeStart = () => {};
    let announceStart = () => {};
    const gate = new Promise<void>((resolve) => {
      resumeStart = resolve;
    });
    const started = new Promise<void>((resolve) => {
      announceStart = resolve;
    });
    const run = vi.mocked(runLocalCommand).getMockImplementation();
    if (isNil(run)) throw new Error('fixtureが未初期化です。');
    vi.mocked(runLocalCommand).mockImplementation(
      async (tool, args, options) => {
        if (tool === 'supabase' && args[0] === 'start') {
          announceStart();
          await gate;
        }
        return run(tool, args, options);
      },
    );
    const result = probeEnvironment(root, undefined, (event) =>
      events.push(event),
    );
    await started;
    expect(events.at(-1)).toMatchObject({
      phase: 'starting',
      runId: expect.stringMatching(/^[a-f0-9]{12}$/),
      workdir,
    });
    resumeStart();
    expect((await result).migrationReplayPassed).toBe(true);
    expect(events.map(({ phase }) => phase)).toEqual([
      'checking-cli',
      'locking',
      'preparing-inputs',
      'preparing-inputs',
      'starting',
      'inspecting',
      'cleanup',
    ]);
    for (const event of events)
      expect(
        Object.keys(event).every((key) =>
          ['phase', 'runId', 'workdir'].includes(key),
        ),
      ).toBe(true);
  });

  it('進捗callbackの例外で起動やcleanupを妨げない', async () => {
    const report = await probeEnvironment(root, undefined, () => {
      throw new Error('display failure');
    });
    expect(report.migrationReplayPassed).toBe(true);
    expect(report.cleanup?.status).toBe('complete');
    expect(release).toHaveBeenCalledTimes(1);
  });

  it('CLI成功は結果JSONだけをstdoutへ出し段階をstderrへ出す', async () => {
    const output = captureCli();
    expect(await runEnvironmentProbeCli(root)).toBe(0);
    expect(output.stdout).toHaveBeenCalledTimes(1);
    expect(JSON.parse(String(output.stdout.mock.calls[0]?.[0]))).toMatchObject({
      migrationReplayPassed: true,
      catalogStatus: 'collected-unverified',
    });
    expect(
      output.messages().some((line) => line.includes('"phase":"starting"')),
    ).toBe(true);
    expect(output.messages().at(-1)).toContain('"phase":"cleanup"');
  });

  it('CLIのreplay失敗はcleanup結果を返してexit 1とする', async () => {
    probeState.shouldFailStart = true;
    const output = captureCli();
    expect(await runEnvironmentProbeCli(root)).toBe(1);
    expect(JSON.parse(String(output.stdout.mock.calls[0]?.[0]))).toMatchObject({
      migrationReplayPassed: false,
      catalogStatus: 'not-reached',
      cleanup: { status: 'complete' },
    });
  });

  it('CLIの版不一致では存在しないartifactを案内せず検査段階を示す', async () => {
    probeState.version = '2.74.0';
    const output = captureCli();
    expect(await runEnvironmentProbeCli(root)).toBe(1);
    expect(output.stdout).not.toHaveBeenCalled();
    const failure = output.messages().at(-1) ?? '';
    expect(failure).toContain('"status":"failed"');
    expect(failure).toContain('"phase":"checking-cli"');
    expect(failure).not.toMatch(/workdir|manifest|log/);
  });

  it('CLIのlock競合と入力不備を段階で区別しraw errorを公開しない', async () => {
    const output = captureCli();
    const secret = 'private-fixture-error';
    vi.mocked(acquireEnvironmentLock).mockRejectedValueOnce(new Error(secret));
    expect(await runEnvironmentProbeCli(root)).toBe(1);
    expect(output.messages().at(-1)).toContain('"phase":"locking"');
    vi.mocked(prepareEnvironmentInputs).mockRejectedValueOnce(
      new Error(secret),
    );
    expect(await runEnvironmentProbeCli(root)).toBe(1);
    expect(output.messages().at(-1)).toContain('"phase":"preparing-inputs"');
    expect(output.messages().join('')).not.toContain(secret);
    expect(output.messages().at(-1)).not.toMatch(/workdir|manifest|log/);
    expect(release).toHaveBeenCalledTimes(1);
  });

  it('CLIのowner書込失敗では存在するworkdirだけを案内する', async () => {
    const prepare = vi.mocked(prepareEnvironmentInputs).getMockImplementation();
    if (isNil(prepare)) throw new Error('fixtureが未初期化です。');
    vi.mocked(prepareEnvironmentInputs).mockImplementationOnce(
      async (...args) => {
        const prepared = await prepare(...args);
        await mkdir(join(prepared.workdir, 'owner.json'));
        return prepared;
      },
    );
    const output = captureCli();
    expect(await runEnvironmentProbeCli(root)).toBe(1);
    const failure = output.messages().at(-1) ?? '';
    expect(failure).toContain(JSON.stringify(workdir));
    expect(failure).toContain('"phase":"preparing-inputs"');
    expect(failure).not.toMatch(/manifest|log/);
    expect(release).toHaveBeenCalledTimes(1);
  });
});
