import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import {
  localCommandEnvironment,
  runLocalCommand,
} from './environmentCommands';
import { captureInputs } from './fingerprint';
import { resolveStorybookVerificationCli } from './storybookVerificationCli';
import { runStorybookVerificationServer } from './storybookVerificationServer';
import { readStorybookVerificationWorkspace } from './storybookVerificationWorkspace';
import {
  prepareVerificationDirectory,
  prepareVerificationStage,
  verificationEnvironment,
} from './verificationContext';

import { execFile } from 'node:child_process';
import { mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { join, resolve } from 'node:path';
import { promisify } from 'node:util';

vi.mock('./environmentCommands', async (original) => ({
  ...(await original<typeof import('./environmentCommands')>()),
  runLocalCommand: vi.fn(),
}));
vi.mock('./fingerprint', () => ({ captureInputs: vi.fn() }));
const roots: string[] = [];
const context = {
  verificationId: '123456abcdef',
  stageId: 'storybook',
  selectionDigest: 'a'.repeat(64),
  inputDigest: 'b'.repeat(64),
};
const gate = () => {
  let release = () => {};
  const promise = new Promise<void>((resolveGate) => {
    release = resolveGate;
  });
  return { promise, release };
};
const setup = async () => {
  await mkdir(resolve('test-results'), { recursive: true });
  const root = await mkdtemp(resolve('test-results/storybook-server-'));
  roots.push(root);
  await writeFile(join(root, 'package.json'), '{"type":"module"}');
  await writeFile(
    join(root, '.env.production'),
    'STORYBOOK_SENTINEL=private-fixture\nVITE_SENTINEL=private-fixture\nPRIVATE_SENTINEL=private-fixture\n',
  );
  prepareVerificationDirectory(root, context.verificationId);
  prepareVerificationStage(root, context);
  for (const [key, value] of Object.entries(verificationEnvironment(context)))
    vi.stubEnv(key, value);
  vi.stubEnv('SUPABASE_SERVICE_ROLE_KEY', 'private-parent');
  vi.mocked(captureInputs, { partial: true }).mockResolvedValue({
    digest: context.inputDigest,
  });
  vi.mocked(runLocalCommand).mockResolvedValue('');
  return { root, controller: new AbortController() };
};
beforeEach(() => vi.resetAllMocks());
afterEach(async () => {
  vi.unstubAllEnvs();
  for (const root of roots.splice(0))
    await rm(root, { recursive: true, force: true });
});

describe('Storybook環境fileの所有境界', () => {
  it('空cwdから絶対config/outputでbuildし、変更照合後に所有previewだけを起動する', async () => {
    const { root, controller } = await setup();
    await runStorybookVerificationServer(root, controller.signal);
    const workspace = readStorybookVerificationWorkspace(root, context);
    const calls = vi.mocked(runLocalCommand).mock.calls;
    expect(calls).toHaveLength(2);
    expect(calls[0]?.[1]).toEqual([
      resolveStorybookVerificationCli(root, 'storybook'),
      'build',
      '--config-dir',
      join(root, '.storybook'),
      '--output-dir',
      workspace.outputDir,
      '--disable-telemetry',
    ]);
    expect(calls[1]?.[1]).toEqual([
      resolveStorybookVerificationCli(root, 'vite'),
      'preview',
      '--config',
      workspace.previewConfig,
      '--outDir',
      workspace.outputDir,
      '--host',
      '127.0.0.1',
      '--port',
      '6007',
      '--strictPort',
    ]);
    for (const call of calls) {
      expect(call[0]).toBe('node');
      expect(call[2].cwd).toBe(workspace.cwd);
      expect(call[2].signal).toBe(controller.signal);
      expect(call[2].env).toMatchObject({
        STORYBOOK_PROJECT_ROOT: root,
        __NEXT_PROCESSED_ENV: 'true',
        SCENARIO_E2E_VERIFICATION_ID: context.verificationId,
      });
      expect(call[2].env).not.toHaveProperty('SUPABASE_SERVICE_ROLE_KEY');
    }
    expect(calls[1]?.[2].shouldAllowAbort).toBe(true);
    expect(captureInputs).toHaveBeenCalledExactlyOnceWith(root);
    expect(await readFile(join(root, '.env.production'), 'utf8')).toContain(
      'private-fixture',
    );
    await expect(
      runStorybookVerificationServer(root, controller.signal),
    ).rejects.toThrow();
    expect(runLocalCommand).toHaveBeenCalledTimes(2);
  });

  it.each([
    'build-fail',
    'changed-input',
    'aborted-before',
    'aborted-build',
  ])('%s後にpreviewを起動しない', async (fault) => {
    const { root, controller } = await setup();
    if (fault === 'aborted-before') controller.abort();
    if (fault === 'changed-input')
      vi.mocked(captureInputs, { partial: true }).mockResolvedValue({
        digest: 'c'.repeat(64),
      });
    vi.mocked(runLocalCommand).mockImplementation(async () => {
      if (fault === 'build-fail') throw new Error('private-build');
      if (fault === 'aborted-build') controller.abort();
      return '';
    });
    await expect(
      runStorybookVerificationServer(root, controller.signal),
    ).rejects.toThrow();
    expect(runLocalCommand).toHaveBeenCalledTimes(
      fault === 'aborted-before' ? 0 : 1,
    );
  });

  it('buildとpreviewのclose待機を飛ばさず、abort通知だけでwrapperを終了しない', async () => {
    const { root, controller } = await setup();
    const build = { started: gate(), closed: gate() };
    const preview = { started: gate(), closed: gate() };
    vi.mocked(runLocalCommand).mockImplementation(async (_tool, args) => {
      const phase = args[1] === 'build' ? build : preview;
      phase.started.release();
      await phase.closed.promise;
      return '';
    });
    let settled = false;
    const running = runStorybookVerificationServer(
      root,
      controller.signal,
    ).finally(() => {
      settled = true;
    });
    try {
      await build.started.promise;
      expect(captureInputs).not.toHaveBeenCalled();
      expect(runLocalCommand).toHaveBeenCalledTimes(1);
      build.closed.release();
      await preview.started.promise;
      expect(captureInputs).toHaveBeenCalledOnce();
      controller.abort();
      await Promise.resolve();
      expect(settled).toBe(false);
      preview.closed.release();
      await running;
    } finally {
      build.closed.release();
      preview.closed.release();
      await running;
    }
  });

  it('installed Storybook/Vite loaderがrootのsynthetic.envを読まず非公開値もprocessへ入れない', async () => {
    const { root, controller } = await setup();
    await runStorybookVerificationServer(root, controller.signal);
    const workspace = readStorybookVerificationWorkspace(root, context);
    const script = `
      const {loadEnvs} = await import('storybook/internal/common');
      const story = await loadEnvs({production:true});
      const {resolveConfig} = await import('vite');
      const vite = await resolveConfig({root:${JSON.stringify(root)},configFile:false,envDir:${JSON.stringify(workspace.envDir)},logLevel:'silent'},'build','production');
      process.stdout.write(JSON.stringify({story:story.raw.STORYBOOK_SENTINEL===undefined,vite:vite.env.VITE_SENTINEL===undefined,private:process.env.PRIVATE_SENTINEL===undefined}));
    `;
    const result = await promisify(execFile)(
      process.execPath,
      ['--input-type=module', '-e', script],
      {
        cwd: workspace.cwd,
        env: {
          ...localCommandEnvironment(process.env),
          STORYBOOK_PROJECT_ROOT: root,
          NODE_ENV: 'production',
          __NEXT_PROCESSED_ENV: 'true',
        },
        windowsHide: true,
        timeout: 20_000,
      },
    );
    expect(JSON.parse(result.stdout)).toEqual({
      story: true,
      vite: true,
      private: true,
    });
    const previewConfig = await readFile(workspace.previewConfig, 'utf8');
    expect(previewConfig).toContain(JSON.stringify(workspace.envDir));
    expect(previewConfig).toContain(JSON.stringify(workspace.cwd));
  }, 30_000);
});
