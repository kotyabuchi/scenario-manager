import { isNil } from 'ramda';
import { describe, expect, it, vi } from 'vitest';

import { ENVIRONMENT_CATALOG_QUERY } from './environmentCatalog';
import { EXPECTED_ENVIRONMENT_CATALOG } from './environmentCatalogExpected';
import { runLocalCommand } from './environmentCommands';
import { createDockerDriver } from './environmentDocker';
import { prepareEnvironmentInputs } from './environmentInputs';
import { acquireEnvironmentLock } from './environmentLock';
import { probeEnvironment } from './environmentProbe';
import {
  empty,
  interrupt,
  probeState,
  release,
  remove,
  root,
  startCalls,
  workdir,
} from './fixtures/environment/probe';

import { getEventListeners } from 'node:events';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';

vi.mock('./environmentCommands', async (original) => ({
  ...(await original<typeof import('./environmentCommands')>()),
  runLocalCommand: vi.fn(),
}));
vi.mock('./environmentDocker', () => ({ createDockerDriver: vi.fn() }));
vi.mock('./environmentInputs', () => ({ prepareEnvironmentInputs: vi.fn() }));
vi.mock('./environmentLock', () => ({ acquireEnvironmentLock: vi.fn() }));

describe('probeEnvironmentの診断と中断境界', () => {
  it('replay成功・catalog一致・認可未検証を区別して記録する', async () => {
    const report = await probeEnvironment(root);
    expect(report.migrationReplayPassed).toBe(true);
    expect(report.schemaParityPassed).toBe(true);
    expect(report.catalogStatus).toBe('verified');
    expect(report.authorizationStatus).toBe('not-verified');
    expect(report.fingerprint).toMatch(/^[a-f0-9]{64}$/);
    expect(report.passed).toBe(true);
    expect(report).not.toHaveProperty('catalogVerified');
    expect(report.cleanup?.status).toBe('complete');
    expect(
      JSON.parse(await readFile(join(workdir, 'replay.json'), 'utf8')),
    ).toEqual(report);
    expect(await readFile(join(workdir, 'catalog.json'), 'utf8')).toBe(
      probeState.catalogText,
    );
    expect(
      JSON.parse(await readFile(join(workdir, 'catalog-check.json'), 'utf8')),
    ).toMatchObject({
      schemaParityPassed: true,
      authorizationStatus: 'not-verified',
      fingerprint: report.fingerprint,
      issues: [],
    });
    const query = vi
      .mocked(runLocalCommand)
      .mock.calls.find(
        ([tool, args]) => tool === 'docker' && args[0] === 'exec',
      );
    expect(query?.[1]).toContain(ENVIRONMENT_CATALOG_QUERY);
    expect(remove).toHaveBeenCalledTimes(1);
    expect(release).toHaveBeenCalledTimes(1);
  });

  it('migration起動失敗はnot-reachedとし部分resourceを片付ける', async () => {
    probeState.shouldFailStart = true;
    const report = await probeEnvironment(root);
    expect(report.migrationReplayPassed).toBe(false);
    expect(report.catalogStatus).toBe('not-reached');
    expect(report.schemaParityPassed).toBe(false);
    expect(report.fingerprint).toBeNull();
    expect(report.passed).toBe(false);
    expect(report.failurePhase).toBe('start');
    expect(report.cleanup?.remaining).toEqual(empty());
    expect(remove).toHaveBeenCalledTimes(1);
    expect(release).toHaveBeenCalledTimes(1);
  });

  it.each([
    'CLEANUP_INCOMPLETE',
    'CLEANUP_UNVERIFIED',
  ] as const)('%sでも先に失敗した起動段階を保持する', async (code) => {
    probeState.shouldFailStart = true;
    if (code === 'CLEANUP_INCOMPLETE') remove.mockResolvedValueOnce([]);
    else remove.mockRejectedValueOnce(new Error('synthetic cleanup failure'));

    const report = await probeEnvironment(root);
    expect(report).toMatchObject({
      passed: false,
      failurePhase: 'start',
      cleanup: code === 'CLEANUP_INCOMPLETE' ? { status: 'incomplete' } : null,
    });
    const manifest = JSON.parse(
      await readFile(join(workdir, 'manifest.json'), 'utf8'),
    );
    expect(manifest.failure).toMatchObject({ code });
    expect(manifest.failure).not.toHaveProperty('phase');
    expect(remove).toHaveBeenCalledTimes(1);
    expect(release).not.toHaveBeenCalled();
  });

  it('CLI版不一致でlockを取得せずsignal監視を解放する', async () => {
    probeState.version = '2.74.0';
    await expect(probeEnvironment(root)).rejects.toThrow('2.75.0');
    expect(acquireEnvironmentLock).not.toHaveBeenCalled();
    expect(release).not.toHaveBeenCalled();
    expect(startCalls()).toHaveLength(0);
  });

  it('所有workdirのcache衝突では既存内容を残しstart前に失敗する', async () => {
    const prepare = vi.mocked(prepareEnvironmentInputs).getMockImplementation();
    if (isNil(prepare)) throw new Error('fixtureが未初期化です。');
    vi.mocked(prepareEnvironmentInputs).mockImplementationOnce(
      async (...args) => {
        const prepared = await prepare(...args);
        await mkdir(join(prepared.workdir, 'supabase/.temp'));
        await writeFile(
          join(prepared.workdir, 'supabase/.temp/cli-latest'),
          'existing',
        );
        return prepared;
      },
    );
    const report = await probeEnvironment(root);
    expect(report.passed).toBe(false);
    expect(report.failurePhase).toBe('start');
    expect(report.cleanup?.status).toBe('complete');
    expect(startCalls()).toHaveLength(0);
    expect(release).toHaveBeenCalledTimes(1);
    expect(
      await readFile(join(workdir, 'supabase/.temp/cli-latest'), 'utf8'),
    ).toBe('existing');
  });

  it('lock取得失敗で入力作成も起動も行わない', async () => {
    vi.mocked(acquireEnvironmentLock).mockRejectedValueOnce(
      new Error('lock conflict'),
    );
    await expect(probeEnvironment(root)).rejects.toThrow('lock conflict');
    expect(prepareEnvironmentInputs).not.toHaveBeenCalled();
    expect(startCalls()).toHaveLength(0);
  });

  it('入力作成失敗で取得済みlockを解放する', async () => {
    vi.mocked(prepareEnvironmentInputs).mockRejectedValueOnce(
      new Error('input failure'),
    );
    await expect(probeEnvironment(root)).rejects.toThrow('input failure');
    expect(release).toHaveBeenCalledTimes(1);
    expect(startCalls()).toHaveLength(0);
  });

  it.each([
    'owner.json',
    'runtime.json',
  ])('%s書込み失敗でもlockを解放する', async (file) => {
    const prepare = vi.mocked(prepareEnvironmentInputs).getMockImplementation();
    if (isNil(prepare)) throw new Error('fixtureが未初期化です。');
    vi.mocked(prepareEnvironmentInputs).mockImplementationOnce(
      async (...args) => {
        const prepared = await prepare(...args);
        await mkdir(join(prepared.workdir, file));
        return prepared;
      },
    );
    await expect(probeEnvironment(root)).rejects.toThrow();
    expect(release).toHaveBeenCalledTimes(1);
    expect(startCalls()).toHaveLength(0);
  });

  it('lock取得中の中断は取得完了後に解放し、入力作成へ進まない', async () => {
    const acquire = vi.mocked(acquireEnvironmentLock).getMockImplementation();
    if (isNil(acquire)) throw new Error('fixtureが未初期化です。');
    vi.mocked(acquireEnvironmentLock).mockImplementationOnce(
      async (...args) => {
        interrupt('SIGTERM');
        return acquire(...args);
      },
    );
    await expect(probeEnvironment(root)).rejects.toThrow();
    expect(prepareEnvironmentInputs).not.toHaveBeenCalled();
    expect(release).toHaveBeenCalledTimes(1);
    expect(startCalls()).toHaveLength(0);
  });

  it.each([
    'SIGINT',
    'SIGTERM',
  ] as const)('初期化中の%sで起動せずlockを解放する', async (event) => {
    const prepare = vi.mocked(prepareEnvironmentInputs).getMockImplementation();
    if (isNil(prepare)) throw new Error('fixtureが未初期化です。');
    vi.mocked(prepareEnvironmentInputs).mockImplementationOnce(
      async (...args) => {
        interrupt(event);
        return prepare(...args);
      },
    );
    await expect(probeEnvironment(root)).rejects.toThrow();
    expect(startCalls()).toHaveLength(0);
    expect(release).toHaveBeenCalledTimes(1);
  });

  it('初回command以前からsignalを監視し、中断後にlock取得しない', async () => {
    vi.mocked(runLocalCommand).mockImplementationOnce(
      async (_tool, _args, options) => {
        expect(options.signal?.aborted).toBe(false);
        interrupt('SIGTERM');
        expect(options.signal?.aborted).toBe(true);
        return 'npipe:////./pipe/docker_engine';
      },
    );
    await expect(probeEnvironment(root)).rejects.toThrow();
    expect(acquireEnvironmentLock).not.toHaveBeenCalled();
    expect(startCalls()).toHaveLength(0);
  });

  it('起動中断のsignalをcleanup用runnerへ渡さない', async () => {
    probeState.shouldInterruptStart = true;
    const report = await probeEnvironment(root);
    expect(report.migrationReplayPassed).toBe(false);
    expect(startCalls()[0]?.[2].signal?.aborted).toBe(true);
    expect(report.cleanup?.status).toBe('complete');
    expect(release).toHaveBeenCalledTimes(1);
    const runner = vi.mocked(createDockerDriver).mock.calls[0]?.[0];
    if (isNil(runner)) throw new Error('cleanup runnerがありません。');
    await runner(['info']);
    expect(vi.mocked(runLocalCommand).mock.lastCall?.[2]).not.toHaveProperty(
      'signal',
    );
  });

  it('事前abortを転送しcommandやlock取得より前に停止する', async () => {
    const source = new AbortController();
    const reason = new Error('事前中断');
    source.abort(reason);
    await expect(probeEnvironment(root, source.signal)).rejects.toBe(reason);
    expect(runLocalCommand).not.toHaveBeenCalled();
    expect(acquireEnvironmentLock).not.toHaveBeenCalled();
    expect(getEventListeners(source.signal, 'abort')).toHaveLength(0);
  });

  it('外部signalによる入力初期化中断で起動せずlockを解放する', async () => {
    const source = new AbortController();
    const prepare = vi.mocked(prepareEnvironmentInputs).getMockImplementation();
    if (isNil(prepare)) throw new Error('fixtureが未初期化です。');
    vi.mocked(prepareEnvironmentInputs).mockImplementationOnce(
      async (...args) => {
        source.abort();
        return prepare(...args);
      },
    );
    await expect(probeEnvironment(root, source.signal)).rejects.toThrow();
    expect(startCalls()).toHaveLength(0);
    expect(release).toHaveBeenCalledTimes(1);
    expect(getEventListeners(source.signal, 'abort')).toHaveLength(0);
  });

  it('外部abortを起動commandへ転送し独立したcleanupを完了する', async () => {
    const source = new AbortController();
    const reason = new Error('協調中断');
    const run = vi.mocked(runLocalCommand).getMockImplementation();
    if (isNil(run)) throw new Error('fixtureが未初期化です。');
    vi.mocked(runLocalCommand).mockImplementation(
      async (tool, args, options) => {
        if (tool === 'supabase' && args[0] === 'start') {
          probeState.isResourcePresent = true;
          source.abort(reason);
          expect(options.signal?.aborted).toBe(true);
          expect(options.signal?.reason).toBe(reason);
          options.signal?.throwIfAborted();
        }
        return run(tool, args, options);
      },
    );
    const report = await probeEnvironment(root, source.signal);
    expect(report.migrationReplayPassed).toBe(false);
    expect(report.catalogStatus).toBe('not-reached');
    expect(report.cleanup?.status).toBe('complete');
    expect(remove).toHaveBeenCalledTimes(1);
    expect(release).toHaveBeenCalledTimes(1);
    expect(getEventListeners(source.signal, 'abort')).toHaveLength(0);
  });

  it('正常終了で外部abort listenerを除去し呼出元のlistenerは保持する', async () => {
    const source = new AbortController();
    const caller = vi.fn();
    source.signal.addEventListener('abort', caller);
    const report = await probeEnvironment(root, source.signal);
    expect(report.migrationReplayPassed).toBe(true);
    expect(getEventListeners(source.signal, 'abort')).toEqual([caller]);
    source.abort();
    expect(caller).toHaveBeenCalledTimes(1);
    expect(release).toHaveBeenCalledTimes(1);
  });

  it('版検査の失敗時にも外部abort listenerを除去する', async () => {
    const source = new AbortController();
    probeState.version = '2.74.0';
    await expect(probeEnvironment(root, source.signal)).rejects.toThrow(
      '2.75.0',
    );
    expect(getEventListeners(source.signal, 'abort')).toHaveLength(0);
    expect(acquireEnvironmentLock).not.toHaveBeenCalled();
  });

  it('lock解放失敗をreplay・catalogの成功と区別し全体を失敗にする', async () => {
    release.mockRejectedValueOnce(new Error('release failed'));
    const report = await probeEnvironment(root);
    expect(report.catalogStatus).toBe('verified');
    expect(report.migrationReplayPassed).toBe(true);
    expect(report.schemaParityPassed).toBe(true);
    expect(report.passed).toBe(false);
  });

  it('catalog不一致でもreplay完了を保持し検査失敗とcleanupを記録する', async () => {
    const catalog = structuredClone(EXPECTED_ENVIRONMENT_CATALOG);
    catalog.columns = catalog.columns.filter(
      ({ name }) => name !== 'comment_count',
    );
    probeState.catalogText = JSON.stringify(catalog);
    const report = await probeEnvironment(root);
    expect(report).toMatchObject({
      migrationReplayPassed: true,
      schemaParityPassed: false,
      catalogStatus: 'mismatch',
      authorizationStatus: 'not-verified',
      passed: false,
      cleanup: { status: 'complete' },
    });
    expect(report.catalogIssues).toContainEqual(
      expect.objectContaining({
        code: 'CATALOG_MISSING',
        subject: 'columns:feedbacks.comment_count.integer',
      }),
    );
    expect(report.failurePhase).toBe('verify');
    expect(
      JSON.parse(await readFile(join(workdir, 'catalog-check.json'), 'utf8')),
    ).toMatchObject({
      schemaParityPassed: false,
      issues: report.catalogIssues,
    });
    expect(remove).toHaveBeenCalledTimes(1);
    expect(release).toHaveBeenCalledTimes(1);
  });

  it.each([
    '{private-invalid-json',
    '{"schemaVersion":1}',
  ])('JSON/構造不正を安全な失敗証跡に変換しcleanupする: %s', async (catalog) => {
    probeState.catalogText = catalog;
    const report = await probeEnvironment(root);
    expect(report).toMatchObject({
      migrationReplayPassed: true,
      schemaParityPassed: false,
      fingerprint: null,
      catalogStatus: 'mismatch',
      authorizationStatus: 'not-verified',
      passed: false,
      cleanup: { status: 'complete' },
    });
    expect(report.catalogIssues).toEqual([
      {
        code: 'CATALOG_INVALID',
        subject: 'catalog.json',
        message: expect.any(String),
      },
    ]);
    const check = await readFile(join(workdir, 'catalog-check.json'), 'utf8');
    expect(JSON.parse(check)).toMatchObject({
      schemaParityPassed: false,
      fingerprint: null,
      authorizationStatus: 'not-verified',
    });
    expect(check).not.toContain(catalog);
    expect(await readFile(join(workdir, 'catalog.json'), 'utf8')).toBe(catalog);
    expect(remove).toHaveBeenCalledTimes(1);
    expect(release).toHaveBeenCalledTimes(1);
  });

  it('catalog取得失敗では未到達を返し起動済みresourceを片付ける', async () => {
    const run = vi.mocked(runLocalCommand).getMockImplementation();
    if (isNil(run)) throw new Error('fixtureが未初期化です。');
    vi.mocked(runLocalCommand).mockImplementation(
      async (tool, args, options) => {
        if (tool === 'docker' && args[0] === 'exec')
          throw new Error('query failure');
        return run(tool, args, options);
      },
    );
    const report = await probeEnvironment(root);
    expect(report).toMatchObject({
      migrationReplayPassed: true,
      schemaParityPassed: false,
      catalogStatus: 'not-reached',
      fingerprint: null,
      passed: false,
      cleanup: { status: 'complete' },
    });
    expect(remove).toHaveBeenCalledTimes(1);
    expect(release).toHaveBeenCalledTimes(1);
  });

  it('cleanup失敗でもreplayとcatalogの成功を改変せず全体を失敗にする', async () => {
    remove.mockRejectedValueOnce(new Error('cleanup failure'));
    const report = await probeEnvironment(root);
    expect(report).toMatchObject({
      migrationReplayPassed: true,
      schemaParityPassed: true,
      catalogStatus: 'verified',
      passed: false,
      cleanup: null,
    });
    expect(release).not.toHaveBeenCalled();
  });
});
