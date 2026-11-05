import { beforeEach, describe, expect, it, vi } from 'vitest';

import { captureInputs, type InputFingerprint } from './fingerprint';
import {
  impactFixture,
  scenariosFile,
  snapshotFixture,
} from './fixtures/selection';
import { captureGitSnapshot, readSnapshotFile } from './gitSnapshot';
import { writeArtifact } from './ledgerArtifacts';
import { IMPACT_RULES_PATH } from './loadImpactRules';
import { type PandaProvenance, provePandaOutputs } from './pandaProvenance';
import { PlaywrightSelectionRepresentationError } from './playwrightTestList';
import { prepareChangedVerification } from './prepareChangedVerification';
import { prepareVerificationDetails } from './prepareVerification';
import { selectedPreparation } from './selectedPreparation';
import { buildSnapshotInventories } from './snapshotInventory';
import {
  baselineDigest,
  checkStaticState,
  collectStaticState,
} from './staticGate';
import { resolveRevisions } from './trustedRevision';

import { createHash } from 'node:crypto';
import { resolve } from 'node:path';

vi.mock('./fingerprint', async (original) => ({
  ...(await original<typeof import('./fingerprint')>()),
  captureInputs: vi.fn(),
}));
vi.mock('./gitSnapshot', () => ({
  captureGitSnapshot: vi.fn(),
  readSnapshotFile: vi.fn(),
}));
vi.mock('./ledgerArtifacts', () => ({ writeArtifact: vi.fn() }));
vi.mock('./pandaProvenance', () => ({ provePandaOutputs: vi.fn() }));
vi.mock('./prepareVerification', () => ({
  prepareVerificationDetails: vi.fn(),
}));
vi.mock('./selectedPreparation', () => ({ selectedPreparation: vi.fn() }));
vi.mock('./snapshotInventory', () => ({ buildSnapshotInventories: vi.fn() }));
vi.mock('./staticGate', () => ({
  collectStaticState: vi.fn(),
  checkStaticState: vi.fn(),
  baselineDigest: vi.fn(),
}));
vi.mock('./trustedRevision', () => ({ resolveRevisions: vi.fn() }));

const root = resolve('prepare-changed-verification-fixture');
const prefix = 'test-results/quality/changed-fixture';
const env = { ...process.env, CI: '', E2E_LEDGER_BOOTSTRAP_APPROVAL: '' };
const readme = 'README.md';
const generated = 'styled-system/css/index.mjs';
const handwritten = 'src/ignored.ts';
const artifacts = new Map<string, string>();
const selection = impactFixture();
const snapshot = snapshotFixture([
  { origin: 'unstaged', status: 'M', newPath: readme },
]);
const revisions = {
  base: snapshot.base,
  head: snapshot.head,
  mode: snapshot.mode,
};
const digest = (value: string) =>
  createHash('sha256').update(value).digest('hex');
const fingerprint = (
  entries: [string, string][] = [[readme, 'docs']],
): InputFingerprint => {
  const files = entries
    .toSorted(([left], [right]) => (left < right ? -1 : left === right ? 0 : 1))
    .map(([path, contents]) => ({
      path,
      kind: 'raw' as const,
      size: Buffer.byteLength(contents),
      sha256: digest(contents),
    }));
  return {
    schemaVersion: 1,
    algorithm: 'sha256',
    root,
    rules: 'fixed-input-scope-v1-next16-template-v1',
    files,
    digest: digest(JSON.stringify(files)),
  };
};
const prepare = (forceFull = false) =>
  prepareChangedVerification({
    root,
    prefix,
    env,
    base: revisions.base,
    forceFull,
  });
const receipt = (name: string): unknown => {
  const contents = artifacts.get(`${prefix}/${name}.json`);
  if (contents === undefined) throw new Error(`receiptがありません: ${name}`);
  return JSON.parse(contents);
};
const configureRuntimeInputs = (inputs: InputFingerprint) => {
  vi.mocked(captureInputs).mockResolvedValue(inputs);
  vi.mocked(prepareVerificationDetails).mockResolvedValue({
    plan: selection.fullPlan,
    inputs,
    scheduleExpected: [],
    integrationExpected: [],
    ledger: selection.ledger,
    discoveries: [],
    legacy: selection.legacy,
    integrationCollection: {
      schemaVersion: 1,
      runner: {
        name: 'vitest',
        version: '3.2.4',
        project: 'integration',
        pool: 'threads',
        fileParallelism: false,
        maxWorkers: 1,
        includeTaskLocation: true,
      },
      config: 'vitest.integration.collect.config.ts',
      registrations: [],
      discovery: {
        schemaVersion: 1,
        profile: 'integration',
        projects: [],
        errors: [],
        tests: [],
      },
    },
  });
};
const proof = (
  status: PandaProvenance['status'],
  inputs = fingerprint(),
): PandaProvenance => ({
  schemaVersion: 1,
  status,
  reason: status === 'proven' ? 'REPLAY_MATCHED' : 'OUTPUT_MISMATCH',
  paths: [generated],
  snapshotDigest: snapshot.digest,
  inputDigest: inputs.digest,
  generatorDigest: digest('generator'),
  outputDigest: status === 'proven' ? digest('output') : null,
  toolchain: {
    panda: '1.8.1',
    node: process.version,
    platform: process.platform,
    arch: process.arch,
    installedLockDigest: digest('lock'),
    cliDigest: digest('cli'),
  },
});
const requiredKeys = selection.fullPlan.requirements
  .map(({ key }) => key)
  .sort();
const expectFull = (
  result: Awaited<ReturnType<typeof prepare>>,
  code: string,
) => {
  expect(result.decision).toMatchObject({
    mode: 'full-required',
    requestedRequiredKeys: requiredKeys,
  });
  expect(result.decision.reasons).toContainEqual(
    expect.objectContaining({ code }),
  );
  expect(result.effective?.effectiveRequiredKeys).toEqual(requiredKeys);
  expect(receipt('decision')).toEqual(result.decision);
};

const configurePartialSelection = () => {
  const inputs = fingerprint([[scenariosFile, 'changed Storybook test']]);
  configureRuntimeInputs(inputs);
  vi.mocked(captureGitSnapshot).mockReturnValue({
    snapshot: snapshotFixture([
      { origin: 'unstaged', status: 'M', newPath: scenariosFile },
    ]),
  });
};

beforeEach(() => {
  vi.resetAllMocks();
  artifacts.clear();
  configureRuntimeInputs(fingerprint());
  vi.mocked(writeArtifact).mockImplementation((target, file, contents) => {
    expect(target).toBe(root);
    artifacts.set(file, contents);
  });
  vi.mocked(resolveRevisions).mockResolvedValue(revisions);
  vi.mocked(collectStaticState).mockResolvedValue({
    inventory: selection.inventories.working,
    ledger: selection.ledger,
    baseline: selection.baseline,
    legacy: selection.legacy,
    registrations: selection.fullPlan.requirements.length,
  });
  vi.mocked(checkStaticState).mockResolvedValue({
    issues: [],
    policyDeltas: [],
    isBootstrap: false,
  });
  vi.mocked(baselineDigest).mockReturnValue(digest('baseline'));
  vi.mocked(captureGitSnapshot).mockReturnValue({ snapshot });
  vi.mocked(readSnapshotFile).mockImplementation((_capture, _revision, path) =>
    path === IMPACT_RULES_PATH ? Buffer.from(selection.rawRules) : undefined,
  );
  vi.mocked(provePandaOutputs).mockResolvedValue(proof('unproven'));
  vi.mocked(buildSnapshotInventories).mockReturnValue(selection.inventories);
});

describe('変更選択の準備境界', () => {
  it('M1の失敗を保存し、docs-only候補でも全登録収集と選択へ進まない', async () => {
    const issues = [
      { code: 'STALE_ARTIFACT', subject: 'inventory', message: '保存物が古い' },
    ];
    vi.mocked(checkStaticState).mockImplementationOnce(async () => {
      expect(receipt('static')).toEqual({ status: 'running', ...revisions });
      return { issues, policyDeltas: [], isBootstrap: false };
    });
    await expect(prepare()).rejects.toThrow('全体静的検査');
    expect(receipt('static')).toMatchObject({
      status: 'failed',
      issues,
      ...revisions,
    });
    expect(vi.mocked(prepareVerificationDetails)).not.toHaveBeenCalled();
    expect(vi.mocked(captureGitSnapshot)).not.toHaveBeenCalled();
    expect(artifacts.has(`${prefix}/decision.json`)).toBe(false);
  });

  it('全体静的検査前後で実入力が変わった場合はGit選択を始めない', async () => {
    const original = fingerprint();
    configureRuntimeInputs(fingerprint([[readme, 'changed during M1']]));
    vi.mocked(captureInputs).mockResolvedValueOnce(original);
    await expect(prepare()).rejects.toThrow('静的検査中に実行入力が変化');
    expect(receipt('static')).toMatchObject({ status: 'passed' });
    expect(vi.mocked(captureGitSnapshot)).not.toHaveBeenCalled();
    expect(artifacts.has(`${prefix}/decision.json`)).toBe(false);
  });

  it('比較元commitを解決できなければ選択結果や静的成功receiptを作らない', async () => {
    vi.mocked(resolveRevisions).mockRejectedValueOnce(
      new Error('比較元commitがありません'),
    );
    await expect(prepare()).rejects.toThrow('比較元commit');
    expect(vi.mocked(collectStaticState)).not.toHaveBeenCalled();
    expect([...artifacts.keys()]).toEqual([]);
  });

  it('固定Git snapshotを読めなければdocs-onlyへ落とさない', async () => {
    vi.mocked(captureGitSnapshot).mockImplementationOnce(() => {
      throw new Error('baseのGit objectがありません');
    });
    await expect(prepare()).rejects.toThrow('Git object');
    expect([...artifacts.keys()]).toEqual([`${prefix}/static.json`]);
  });

  it('現行規則が欠けている場合は固定Git receiptを残して停止する', async () => {
    vi.mocked(readSnapshotFile).mockReturnValueOnce(undefined);
    await expect(prepare()).rejects.toThrow('変更影響規則がありません');
    expect(receipt('git-start')).toEqual(snapshot);
    expect(artifacts.has(`${prefix}/decision.json`)).toBe(false);
  });

  it('現行規則が読めてもbase規則がなければ全必須へ戻る', async () => {
    vi.mocked(readSnapshotFile).mockImplementation((_capture, revision) =>
      revision === 'working' ? Buffer.from(selection.rawRules) : undefined,
    );
    expectFull(await prepare(), 'MISSING_BASE_RULES');
  });

  it('旧graphの再構築に失敗した場合は全必須を保存する', async () => {
    vi.mocked(buildSnapshotInventories).mockImplementation(() => {
      throw new Error('internal graph failure');
    });
    const result = await prepare();
    expectFull(result, 'GRAPH_UNAVAILABLE');
    expect(result.graph.isUnavailable).toBe(true);
    expect(JSON.stringify(receipt('decision'))).not.toContain(
      'internal graph failure',
    );
  });

  it.each([
    { status: 'proven', extra: false, mode: 'docs-only', ignored: [] },
    {
      status: 'proven',
      extra: true,
      mode: 'full-required',
      ignored: [handwritten],
    },
    {
      status: 'unproven',
      extra: false,
      mode: 'full-required',
      ignored: [generated],
    },
  ] as const)('Pandaが$statusで別の未追跡入力=$extraの場合は$modeを選ぶ', async ({
    status,
    extra,
    mode,
    ignored,
  }) => {
    const paths = extra ? [handwritten, generated] : [generated];
    const inputs = fingerprint([
      [readme, 'docs'],
      ...paths.map((path): [string, string] => [path, 'ignored']),
    ]);
    configureRuntimeInputs(inputs);
    const capture = {
      snapshot: {
        ...snapshot,
        reasons: [{ code: 'UNVERSIONED_RUNTIME_INPUT' as const, paths }],
      },
    };
    vi.mocked(captureGitSnapshot).mockReturnValue(capture);
    vi.mocked(provePandaOutputs).mockResolvedValue(proof(status, inputs));
    const result = await prepare();
    expect(result.decision.mode).toBe(mode);
    expect(vi.mocked(buildSnapshotInventories)).toHaveBeenCalledExactlyOnceWith(
      capture,
      status === 'proven' ? [generated] : [],
    );
    expect(
      result.decision.reasons
        .filter(({ code }) => code === 'UNVERSIONED_RUNTIME_INPUT')
        .flatMap(({ changedPaths }) => changedPaths),
    ).toEqual(ignored);
    expect(receipt('generated-inputs')).toEqual(proof(status, inputs));
    expect(receipt('decision')).toEqual(result.decision);
    if (mode === 'docs-only') expect(result.effective).toBeNull();
  });

  it('強制全件ではPanda再生成を始めず、全必須の根拠を保存する', async () => {
    expectFull(await prepare(true), 'FORCED_FULL');
    expect(vi.mocked(provePandaOutputs)).not.toHaveBeenCalled();
    expect(vi.mocked(selectedPreparation)).not.toHaveBeenCalled();
    expect(receipt('generated-inputs')).toBeNull();
  });

  it('Playwrightの表現不能だけを全件に拡大し、元の全件planと理由を保存する', async () => {
    configurePartialSelection();
    vi.mocked(selectedPreparation).mockImplementationOnce(() => {
      throw new PlaywrightSelectionRepresentationError('test-listの表現不能');
    });
    const result = await prepare();
    expect(vi.mocked(selectedPreparation)).toHaveBeenCalledExactlyOnceWith(
      expect.objectContaining({ plan: selection.fullPlan }),
      expect.objectContaining({
        effectiveRequiredKeys: [
          'preview-base',
          'preview-setup',
          'scenario',
          'scenario-repeat',
        ],
      }),
    );
    expectFull(result, 'RUNNER_SELECTION_UNREPRESENTABLE');
    expect(result.effective?.plan).toEqual(selection.fullPlan);
    expect(result.effective?.selectionDigest).toBe(
      result.decision.fullPlanDigest,
    );
    expect(receipt('effective-selection')).toEqual(result.effective);
  });

  it('通常の登録identityエラーは部分選択の失敗として伝播し、全件planを保存しない', async () => {
    configurePartialSelection();
    const mismatch = new Error('runnerの選択と登録identityが一致しません。');
    vi.mocked(selectedPreparation).mockImplementationOnce(() => {
      throw mismatch;
    });
    await expect(prepare()).rejects.toBe(mismatch);
    expect(vi.mocked(selectedPreparation)).toHaveBeenCalledOnce();
    expect(artifacts.has(`${prefix}/decision.json`)).toBe(false);
    expect(artifacts.has(`${prefix}/effective-selection.json`)).toBe(false);
  });

  it('同一の入力・Git digestを再照合してphase付きreceiptを更新する', async () => {
    const result = await prepare();
    expect(result.decision.mode).toBe('docs-only');
    expect(receipt('git-end')).toEqual({
      phase: 'selection-ready',
      ...snapshot,
    });
    await expect(result.checkpoint('before-run')).resolves.toEqual(snapshot);
    expect(receipt('git-end')).toEqual({ phase: 'before-run', ...snapshot });
    expect(
      vi
        .mocked(captureGitSnapshot)
        .mock.calls.map(([options]) => options.runtimeInputPaths),
    ).toEqual([[readme], [readme], [readme]]);
  });

  it('Git digestだけの変化でも実行前のcheckpointを拒否する', async () => {
    const result = await prepare();
    const after = { ...snapshot, digest: digest('new index') };
    vi.mocked(captureGitSnapshot).mockReturnValueOnce({ snapshot: after });
    await expect(result.checkpoint('before-run')).rejects.toThrow(
      'Git snapshotが変化',
    );
    expect(receipt('git-start')).toEqual(snapshot);
    expect(receipt('git-end')).toEqual({ phase: 'before-run', ...after });
  });

  it('checkpointで新たな実行入力が見つかった場合は同一Git digestでも拒否する', async () => {
    const result = await prepare();
    vi.mocked(captureInputs).mockResolvedValueOnce(
      fingerprint([
        [readme, 'docs'],
        [handwritten, 'new file'],
      ]),
    );
    await expect(result.checkpoint('before-run')).rejects.toThrow(
      '変更選択後に実行入力が変化',
    );
    expect(vi.mocked(captureGitSnapshot)).toHaveBeenCalledTimes(2);
    expect(receipt('git-end')).toEqual({
      phase: 'selection-ready',
      ...snapshot,
    });
  });
});
