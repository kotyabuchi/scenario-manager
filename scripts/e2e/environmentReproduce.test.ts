import { isNil } from 'ramda';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { renderEnvironmentConfig } from './environmentInputs';
import {
  createEnvironmentPlan,
  transitionEnvironment,
} from './environmentOwnership';
import { probeEnvironment } from './environmentProbe';
import {
  compareEnvironmentProofs,
  reproduceEnvironment,
} from './environmentReproduce';
import { at, empty, request } from './fixtures/environment/ownership';
import { parseArtifact, readArtifact, writeArtifact } from './ledgerArtifacts';

import { createHash, randomUUID } from 'node:crypto';
import { mkdtempSync, realpathSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, relative } from 'node:path';

import type { EnvironmentProof } from './environmentReproduce';

vi.mock('./environmentProbe', () => ({ probeEnvironment: vi.fn() }));
const receiptFile = 'test-results/quality/environment-reproduction.json';
const roots: string[] = [];
const rootFor = () => {
  const root = realpathSync(mkdtempSync(join(tmpdir(), 'e2e-reproduce-')));
  roots.push(root);
  return root;
};
const configFor = (proof: EnvironmentProof) =>
  renderEnvironmentConfig({
    runId: proof.manifest.runId,
    ports: proof.manifest.ports,
  });
const synchronize = (proof: EnvironmentProof) => {
  proof.manifest.inputHashes.config = createHash('sha256')
    .update(configFor(proof))
    .digest('hex');
  proof.report.inputHashes = { ...proof.manifest.inputHashes };
  proof.report.cleanup = structuredClone(proof.manifest.cleanup);
};
const proofFor = (root: string, runId = '012345abcdef'): EnvironmentProof => {
  let manifest = createEnvironmentPlan({
    ...request(),
    runId,
    ownerNonce: randomUUID(),
    worktreeRoot: root,
    repoRoot: root,
  });
  manifest = transitionEnvironment(manifest, {
    type: 'preflight',
    at: at(1),
    existingResourceCount: 0,
  });
  manifest = transitionEnvironment(manifest, {
    type: 'resources-recorded',
    at: at(3),
    resources: {
      ...empty(),
      containers: ['db', 'rest', 'kong', 'storage', 'auth'].map(
        (service, index) => ({
          id: String(index + 1).repeat(64),
          name: `supabase_${service}_${manifest.projectId}`,
          projectLabel: manifest.projectId,
          createdAt: at(2),
          imageId: `sha256:${String(index + 2).repeat(64)}`,
        }),
      ),
    },
  });
  manifest = transitionEnvironment(manifest, { type: 'running', at: at(4) });
  manifest = transitionEnvironment(manifest, { type: 'stopping', at: at(5) });
  manifest = transitionEnvironment(manifest, {
    type: 'cleanup-recorded',
    at: at(6),
    cleanup: { at: at(6), status: 'complete', remaining: empty(), issues: [] },
  });
  const proof: EnvironmentProof = {
    manifest,
    report: {
      runId,
      workdir: manifest.workdir,
      cliVersion: manifest.cliVersion,
      inputHashes: manifest.inputHashes,
      migrationReplayPassed: true,
      schemaParityPassed: true,
      catalogStatus: 'verified',
      authorizationStatus: 'not-verified',
      fingerprint: 'f'.repeat(64),
      catalogIssues: [],
      knownAuthorizationGaps: ['認可は未検証'],
      passed: true,
      cleanup: manifest.cleanup,
    },
  };
  synchronize(proof);
  return proof;
};
const persist = (root: string, proof: EnvironmentProof) => {
  const folder = relative(root, proof.manifest.workdir);
  writeArtifact(
    root,
    join(folder, 'manifest.json'),
    JSON.stringify(proof.manifest),
  );
  writeArtifact(
    root,
    join(folder, 'supabase', 'config.toml'),
    configFor(proof),
  );
};
const receiptFor = (root: string) =>
  parseArtifact(readArtifact(root, receiptFile), receiptFile);

beforeEach(() => vi.resetAllMocks());
afterEach(() => {
  for (const root of roots.splice(0)) {
    if (!root.startsWith(join(realpathSync(tmpdir()), 'e2e-reproduce-')))
      throw new Error('テスト一時ディレクトリ以外は削除しません。');
    rmSync(root, { recursive: true, force: true });
  }
});

describe('compareEnvironmentProofs', () => {
  it('run別config hashの違いを許容し、認可未検証の成功証跡を比較する', () => {
    const root = rootFor();
    const first = proofFor(root);
    const second = proofFor(root, 'abcdef012345');
    expect(first.manifest.inputHashes.config).not.toBe(
      second.manifest.inputHashes.config,
    );
    expect(compareEnvironmentProofs(first, second)).toEqual([]);
  });

  it.each([
    'commit',
    'repoRoot',
    'migrations',
    'seed',
    'catalog',
    'images',
    'ports',
  ] as const)('%sの変化を不一致として検出する', (field) => {
    const root = rootFor();
    const first = proofFor(root);
    const second = proofFor(root, 'abcdef012345');
    if (field === 'commit') second.manifest.commit = 'b'.repeat(40);
    else if (field === 'repoRoot')
      second.manifest.repoRoot = join(root, 'other');
    else if (field === 'migrations' || field === 'seed')
      second.manifest.inputHashes[field] = 'e'.repeat(64);
    else if (field === 'catalog') second.report.fingerprint = 'e'.repeat(64);
    else if (field === 'images') {
      for (const resource of second.manifest.resources.containers)
        resource.imageId = `sha256:${'e'.repeat(64)}`;
    } else {
      second.manifest.ports.api += 10;
      second.manifest.apiUrl = `http://127.0.0.1:${second.manifest.ports.api}`;
    }
    synchronize(second);
    expect(compareEnvironmentProofs(first, second)).toContainEqual(
      expect.objectContaining({
        code: 'REPRODUCTION_MISMATCH',
        subject: field,
      }),
    );
  });

  it('同じrunの再使用と異なるworktreeを拒否する', () => {
    const root = rootFor();
    const first = proofFor(root);
    expect(
      compareEnvironmentProofs(first, structuredClone(first)),
    ).toContainEqual(expect.objectContaining({ code: 'RUN_REUSED' }));
    expect(
      compareEnvironmentProofs(first, proofFor(rootFor(), 'abcdef012345')),
    ).toContainEqual(
      expect.objectContaining({
        code: 'REPRODUCTION_MISMATCH',
        subject: 'worktreeRoot',
      }),
    );
  });

  it.each([
    'passed',
    'migrationReplayPassed',
    'schemaParityPassed',
  ] as const)('reportの%sがfalseなら成功にしない', (field) => {
    const first = proofFor(rootFor());
    const second = structuredClone(first);
    second.report[field] = false;
    expect(compareEnvironmentProofs(first, second)).toContainEqual(
      expect.objectContaining({ code: 'PROOF_FAILED' }),
    );
  });

  it('catalog未到達・指紋欠落・認可status偽装を拒否する', () => {
    const first = proofFor(rootFor());
    const second = structuredClone(first);
    second.report.catalogStatus = 'not-reached';
    second.report.fingerprint = null;
    Reflect.set(second.report, 'authorizationStatus', 'verified');
    expect(compareEnvironmentProofs(first, second)).toContainEqual(
      expect.objectContaining({ code: 'PROOF_FAILED' }),
    );
  });

  it('manifest構造不正、reportとのidentity不一致を拒否する', () => {
    const first = proofFor(rootFor());
    const second = structuredClone(first);
    Reflect.set(second.manifest, 'cliVersion', 'new-version');
    expect(compareEnvironmentProofs(first, second)).toContainEqual(
      expect.objectContaining({ code: 'PROOF_INVALID' }),
    );
    second.manifest = structuredClone(first.manifest);
    second.report.runId = 'abcdef012345';
    expect(compareEnvironmentProofs(first, second)).toContainEqual(
      expect.objectContaining({ code: 'PROOF_MISMATCH' }),
    );
  });

  it('必須サービス欠落・別projectのimage・同名重複を拒否する', () => {
    const first = proofFor(rootFor());
    const second = structuredClone(first);
    second.manifest.resources.containers.pop();
    expect(compareEnvironmentProofs(first, second)).toContainEqual(
      expect.objectContaining({ code: 'SERVICE_MISSING' }),
    );
    second.manifest = structuredClone(first.manifest);
    for (const resource of second.manifest.resources.containers)
      resource.projectLabel = 'unowned';
    expect(compareEnvironmentProofs(first, second)).toContainEqual(
      expect.objectContaining({ code: 'SERVICE_MISSING' }),
    );
    second.manifest = structuredClone(first.manifest);
    const database = second.manifest.resources.containers[0];
    if (isNil(database)) throw new Error('fixtureのDBがありません。');
    second.manifest.resources.containers.push({
      ...database,
      id: '9'.repeat(64),
    });
    expect(compareEnvironmentProofs(first, second)).toContainEqual(
      expect.objectContaining({ code: 'SERVICE_MISSING' }),
    );
  });

  it('reportが成功を主張してもmanifestのlifecycle失敗は独立して拒否する', () => {
    const first = proofFor(rootFor());
    const second = structuredClone(first);
    second.manifest.failure = { code: 'ENVIRONMENT_RUN_FAILED', at: at(4) };
    const issues = compareEnvironmentProofs(first, second);
    expect(issues).toContainEqual(
      expect.objectContaining({ code: 'RUN_FAILED' }),
    );
    expect(issues.some(({ code }) => code === 'CLEANUP_FAILED')).toBe(false);
  });

  it('cleanupの偽のcompleteとmanifestとの食違いを拒否する', () => {
    const first = proofFor(rootFor());
    const second = structuredClone(first);
    if (isNil(second.report.cleanup))
      throw new Error('fixtureのcleanupがありません。');
    second.report.cleanup.remaining = second.manifest.resources;
    expect(compareEnvironmentProofs(first, second)).toContainEqual(
      expect.objectContaining({ code: 'CLEANUP_FAILED' }),
    );
    second.report.cleanup = {
      at: at(7),
      status: 'complete',
      remaining: empty(),
      issues: [],
    };
    expect(compareEnvironmentProofs(first, second)).toContainEqual(
      expect.objectContaining({ code: 'CLEANUP_FAILED' }),
    );
  });
});

describe('reproduceEnvironment', () => {
  it('旧成功receiptを開始前にrunningへ更新し、2回直列のcleanup後にpassedを保存する', async () => {
    const root = rootFor();
    writeArtifact(
      root,
      receiptFile,
      JSON.stringify({ status: 'passed', stale: true }),
    );
    const first = proofFor(root);
    const second = proofFor(root, 'abcdef012345');
    persist(root, first);
    persist(root, second);
    vi.mocked(probeEnvironment)
      .mockImplementationOnce(async () => {
        expect(receiptFor(root)).toMatchObject({ status: 'running', runs: [] });
        return first.report;
      })
      .mockImplementationOnce(async () => {
        expect(receiptFor(root)).toMatchObject({
          status: 'running',
          runs: [expect.objectContaining({ runId: first.report.runId })],
        });
        return second.report;
      });
    const result = await reproduceEnvironment(root);
    expect(result).toMatchObject({
      status: 'passed',
      authorizationStatus: 'not-verified',
      issues: [],
    });
    expect(result.runs).toHaveLength(2);
    expect(receiptFor(root)).toEqual(result);
    expect(probeEnvironment).toHaveBeenCalledTimes(2);
  });

  it.each([
    'probe',
    'catalog',
    'cleanup',
    'config',
    'manifest',
    'workdir',
  ] as const)('初回%s失敗で2回目を起動せずfailedを保存する', async (failure) => {
    const root = rootFor();
    const first = proofFor(root);
    if (failure === 'catalog') {
      first.report.passed = false;
      first.report.schemaParityPassed = false;
      first.report.catalogStatus = 'mismatch';
      first.manifest.failure = { code: 'ENVIRONMENT_RUN_FAILED', at: at(4) };
    }
    if (failure === 'cleanup') {
      first.manifest.state = 'failed';
      first.manifest.failure = { code: 'CLEANUP_INCOMPLETE', at: at(6) };
      first.manifest.cleanup = {
        at: at(6),
        status: 'incomplete',
        remaining: first.manifest.resources,
        issues: [],
      };
      synchronize(first);
    }
    persist(root, first);
    if (failure === 'config')
      writeArtifact(
        root,
        relative(root, join(first.manifest.workdir, 'supabase/config.toml')),
        'project_id = "other"',
      );
    if (failure === 'manifest')
      writeArtifact(
        root,
        relative(root, join(first.manifest.workdir, 'manifest.json')),
        '{}',
      );
    if (failure === 'workdir') first.report.workdir = join(root, 'unexpected');
    if (failure === 'probe')
      vi.mocked(probeEnvironment).mockRejectedValueOnce(
        new Error('secret-token'),
      );
    else vi.mocked(probeEnvironment).mockResolvedValueOnce(first.report);
    const result = await reproduceEnvironment(root);
    expect(result.status).toBe('failed');
    expect(probeEnvironment).toHaveBeenCalledTimes(1);
    expect(receiptFor(root)).toEqual(result);
    expect(JSON.stringify(result)).not.toContain('secret-token');
    if (failure === 'catalog') {
      expect(result.issues).toContainEqual(
        expect.objectContaining({ code: 'RUN_FAILED' }),
      );
      expect(result.issues.some(({ code }) => code === 'CLEANUP_FAILED')).toBe(
        false,
      );
      expect(result.runs[0]).toMatchObject({
        cleanup: { status: 'complete' },
        lifecycleFailure: first.manifest.failure,
      });
    }
  });

  it('2回目の例外でも旧成功を残さず初回の証跡を保持する', async () => {
    const root = rootFor();
    const first = proofFor(root);
    persist(root, first);
    vi.mocked(probeEnvironment)
      .mockResolvedValueOnce(first.report)
      .mockRejectedValueOnce(new Error('secret'));
    const result = await reproduceEnvironment(root);
    expect(result).toMatchObject({
      status: 'failed',
      runs: [expect.objectContaining({ runId: first.report.runId })],
    });
    expect(receiptFor(root)).toEqual(result);
  });

  it('2回とも成功していても入力の相違をfailedとして記録する', async () => {
    const root = rootFor();
    const first = proofFor(root);
    const second = proofFor(root, 'abcdef012345');
    second.manifest.inputHashes.seed = 'e'.repeat(64);
    synchronize(second);
    persist(root, first);
    persist(root, second);
    vi.mocked(probeEnvironment)
      .mockResolvedValueOnce(first.report)
      .mockResolvedValueOnce(second.report);
    expect(await reproduceEnvironment(root)).toMatchObject({
      status: 'failed',
      issues: [expect.objectContaining({ subject: 'seed' })],
    });
  });

  it.each([
    false,
    true,
  ])('例外時は段階を残し、workdirは実在時だけ記録する: %s', async (hasWorkdir) => {
    const root = rootFor();
    const first = proofFor(root);
    if (hasWorkdir) persist(root, first);
    const progress = vi.fn(() => {
      throw new Error('表示先の失敗');
    });
    vi.mocked(probeEnvironment).mockImplementationOnce(
      async (_root, _signal, notify) => {
        notify?.({
          phase: 'preparing-inputs',
          runId: first.report.runId,
          workdir: first.report.workdir,
        });
        throw new Error('秘密の接続情報');
      },
    );
    const result = await reproduceEnvironment(root, undefined, progress);
    expect(progress).toHaveBeenCalledWith(
      expect.objectContaining({ run: 1, phase: 'preparing-inputs' }),
    );
    expect(result.failure).toMatchObject({
      run: 1,
      phase: 'preparing-inputs',
      runId: first.report.runId,
    });
    expect(result.failure?.workdir).toBe(
      hasWorkdir ? first.report.workdir : undefined,
    );
    expect(JSON.stringify(result)).not.toContain('秘密');
    expect(result.issues[0]?.message).toContain(
      hasWorkdir ? '診断記録' : '設定',
    );
  });

  it('中断signalとprogressをprobeへ渡し、中断済みなら開始せずfailedを記録する', async () => {
    const root = rootFor();
    const controller = new AbortController();
    const progress = vi.fn();
    vi.mocked(probeEnvironment).mockRejectedValueOnce(new Error('中断'));
    await reproduceEnvironment(root, controller.signal, progress);
    expect(probeEnvironment).toHaveBeenCalledWith(
      root,
      controller.signal,
      expect.any(Function),
    );
    vi.mocked(probeEnvironment).mockClear();
    controller.abort();
    expect(await reproduceEnvironment(root, controller.signal)).toMatchObject({
      status: 'failed',
    });
    expect(probeEnvironment).not.toHaveBeenCalled();
  });
});
