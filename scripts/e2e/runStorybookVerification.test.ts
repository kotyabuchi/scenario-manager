import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { runLocalCommand } from './environmentCommands';
import { runStorybookVerification } from './runStorybookVerification';
import {
  prepareVerificationDirectory,
  prepareVerificationStage,
  verificationStagePath,
} from './verificationContext';

import { EventEmitter } from 'node:events';
import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises';
import { join, resolve } from 'node:path';

import type { VerificationStageHooks } from './verificationContext';

const network = vi.hoisted(() => ({ occupied: false, probes: 0, closes: 0 }));
vi.mock('./environmentCommands', async (original) => ({
  ...(await original<typeof import('./environmentCommands')>()),
  runLocalCommand: vi.fn(),
}));
vi.mock('./playwrightSourceMaps', () => ({
  playwrightSourceMapOptions: vi.fn(async () => ({
    args: ['--enable-source-maps', '--require', 'source-map-adapter.cjs'],
    env: { E2E_DISCOVERY_PLAYWRIGHT_PACKAGE: 'local-playwright-package' },
  })),
}));
vi.mock('node:net', () => ({
  createServer: () => {
    const emitter = new EventEmitter();
    return Object.assign(emitter, {
      listen(options: unknown, callback: () => void) {
        network.probes++;
        expect(options).toEqual({
          host: '127.0.0.1',
          port: 6007,
          exclusive: true,
        });
        if (network.occupied)
          queueMicrotask(() => emitter.emit('error', new Error('EADDRINUSE')));
        else queueMicrotask(callback);
      },
      close(callback: () => void) {
        network.closes++;
        callback();
      },
    });
  },
}));

const roots: string[] = [];
const setup = async () => {
  await mkdir(resolve('test-results'), { recursive: true });
  const root = await mkdtemp(resolve('test-results/storybook-lifecycle-'));
  roots.push(root);
  await writeFile(join(root, 'package.json'), '{"type":"module"}');
  const context = {
    verificationId: '123456abcdef',
    stageId: 'storybook',
    selectionDigest: 'a'.repeat(64),
    inputDigest: 'b'.repeat(64),
  };
  await prepareVerificationDirectory(root, context.verificationId);
  await prepareVerificationStage(root, context);
  const controller = new AbortController();
  const hooks: VerificationStageHooks = {
    context,
    signal: controller.signal,
    checkpoint: vi.fn(async () => {}),
    onExit: vi.fn(),
  };
  const report = {
    schemaVersion: 1,
    context: structuredClone(context),
    profile: 'storybook',
    runner: 'playwright',
    version: '1.57.0',
    status: 'passed',
    errorCount: 0,
    reporterErrorCount: 0,
    reporterCompleted: true,
    tests: [],
  };
  const reportPath = verificationStagePath(root, context, 'playwright.json');
  const save = () => writeFile(reportPath, JSON.stringify(report));
  return { root, hooks, controller, report, save };
};

beforeEach(() => {
  vi.resetAllMocks();
  network.occupied = false;
  network.probes = 0;
  network.closes = 0;
});
afterEach(async () => {
  vi.unstubAllEnvs();
  for (const root of roots.splice(0))
    await rm(root, { recursive: true, force: true });
});

describe('Storybook verification lifecycle', () => {
  it('sanitize済みenvで既存configを起動し、実closeとport解放後に完了する', async () => {
    const fixture = await setup();
    vi.stubEnv('SUPABASE_SERVICE_ROLE_KEY', 'PRIVATE_SECRET');
    vi.stubEnv('SCENARIO_E2E_VERIFICATION_ID', 'foreign');
    vi.mocked(runLocalCommand).mockImplementation(
      async (_tool, _args, options) => {
        await fixture.save();
        options.onClose?.({ exitCode: 0, signal: null });
        return '';
      },
    );
    expect(await runStorybookVerification(fixture.root, fixture.hooks)).toEqual(
      {
        status: 'passed',
        exitCode: 0,
        signal: null,
        processCleanup: { exited: true, errorCount: 0 },
      },
    );
    const call = vi.mocked(runLocalCommand).mock.calls[0];
    expect(call?.[0]).toBe('node');
    expect(call?.[1]).toEqual([
      '--enable-source-maps',
      '--require',
      'source-map-adapter.cjs',
      expect.any(String),
      'test',
      '--config',
      '.storybook/playwright.config.ts',
    ]);
    expect(call?.[2]).toMatchObject({
      cwd: fixture.root,
      signal: fixture.controller.signal,
      log: verificationStagePath(
        fixture.root,
        fixture.hooks.context,
        'runner-private.log',
      ),
      env: {
        SCENARIO_E2E_VERIFICATION_ID: '123456abcdef',
        SCENARIO_E2E_STAGE_ID: 'storybook',
        E2E_DISCOVERY_PLAYWRIGHT_PACKAGE: 'local-playwright-package',
      },
    });
    expect(call?.[2].env).not.toHaveProperty('SUPABASE_SERVICE_ROLE_KEY');
    expect(call?.[2].env).not.toHaveProperty('DOCKER_HOST');
    expect(fixture.hooks.onExit).toHaveBeenCalledWith({
      exitCode: 0,
      signal: null,
    });
    expect(vi.mocked(fixture.hooks.checkpoint).mock.calls.flat()).toEqual([
      'before-tests',
      'after-tests',
      'after-cleanup',
    ]);
    expect(network.probes).toBe(2);
    expect(network.closes).toBe(2);
  });

  it('abort通知だけではclose/cleanupを報告せず、closeを待つ', async () => {
    const fixture = await setup();
    let finish = () => {};
    let started = () => {};
    const ready = new Promise<void>((resolveReady) => {
      started = resolveReady;
    });
    vi.mocked(runLocalCommand).mockImplementation(
      (_tool, _args, options) =>
        new Promise((resolveCommand) => {
          finish = () => {
            options.onClose?.({ exitCode: null, signal: 'SIGTERM' });
            resolveCommand('');
          };
          started();
        }),
    );
    let settled = false;
    const result = runStorybookVerification(fixture.root, fixture.hooks).then(
      (value) => {
        settled = true;
        return value;
      },
    );
    await ready;
    fixture.controller.abort();
    await Promise.resolve();
    expect(settled).toBe(false);
    expect(network.probes).toBe(1);
    expect(fixture.hooks.onExit).not.toHaveBeenCalled();
    expect(vi.mocked(fixture.hooks.checkpoint).mock.calls.flat()).toEqual([
      'before-tests',
    ]);
    finish();
    expect(await result).toEqual({
      status: 'failed',
      exitCode: null,
      signal: 'SIGTERM',
      processCleanup: { exited: true, errorCount: 0 },
    });
    expect(network.probes).toBe(2);
  });

  it.each([
    'nonzero',
    'missing-report',
    'foreign-report',
    'checkpoint',
    'cleanup',
    'missing-close',
  ])('%sを成功へ変換しない', async (fault) => {
    const fixture = await setup();
    if (fault === 'checkpoint')
      vi.mocked(fixture.hooks.checkpoint).mockImplementation(async (phase) => {
        if (phase === 'after-tests') throw new Error('PRIVATE_CHECKPOINT');
      });
    vi.mocked(runLocalCommand).mockImplementation(
      async (_tool, _args, options) => {
        if (fault === 'foreign-report')
          fixture.report.context.inputDigest = 'c'.repeat(64);
        if (fault !== 'missing-report') await fixture.save();
        if (fault !== 'missing-close')
          options.onClose?.({
            exitCode: fault === 'nonzero' ? 7 : 0,
            signal: null,
          });
        if (fault === 'cleanup') network.occupied = true;
        if (fault === 'nonzero') throw new Error('PRIVATE_COMMAND');
        return '';
      },
    );
    const result = await runStorybookVerification(fixture.root, fixture.hooks);
    expect(result.status).toBe('failed');
    expect(result.exitCode).toBe(
      fault === 'nonzero' ? 7 : fault === 'missing-close' ? null : 0,
    );
    expect(result.processCleanup).toEqual({
      exited: fault !== 'missing-close',
      errorCount: ['cleanup', 'missing-close'].includes(fault) ? 1 : 0,
    });
  });

  it('既存6007 listenerを止めず、起動前に拒否する', async () => {
    const fixture = await setup();
    network.occupied = true;
    expect(
      await runStorybookVerification(fixture.root, fixture.hooks),
    ).toMatchObject({
      status: 'failed',
      processCleanup: { exited: true, errorCount: 0 },
    });
    expect(runLocalCommand).not.toHaveBeenCalled();
    expect(network.probes).toBe(1);
    expect(network.closes).toBe(0);
  });

  it.each([
    'aborted',
    'before-checkpoint',
    'after-cleanup',
  ])('%sでも失敗を保持する', async (fault) => {
    const fixture = await setup();
    if (fault === 'aborted') fixture.controller.abort();
    vi.mocked(fixture.hooks.checkpoint).mockImplementation(async (phase) => {
      if (phase === fault.replace('-checkpoint', '-tests'))
        throw new Error('PRIVATE_CHECKPOINT');
    });
    vi.mocked(runLocalCommand).mockImplementation(
      async (_tool, _args, options) => {
        await fixture.save();
        options.onClose?.({ exitCode: 0, signal: null });
        return '';
      },
    );
    expect(
      (await runStorybookVerification(fixture.root, fixture.hooks)).status,
    ).toBe('failed');
    if (fault !== 'after-cleanup')
      expect(runLocalCommand).not.toHaveBeenCalled();
  });
});
