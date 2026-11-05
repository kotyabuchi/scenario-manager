import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { captureInputs } from './fingerprint';
import { verificationFixture } from './fixtures/verification';
import { prepareVerification } from './prepareVerification';
import { runVerification } from './run';
import { runVerificationStages } from './runVerificationStages';

import { createHash } from 'node:crypto';
import {
  mkdir,
  mkdtemp,
  readFile,
  realpath,
  rm,
  unlink,
  writeFile,
} from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { dirname, join, relative, resolve, sep } from 'node:path';

vi.mock('./prepareVerification', () => ({ prepareVerification: vi.fn() }));
vi.mock('./runVerificationStages', () => ({ runVerificationStages: vi.fn() }));
vi.mock('./fingerprint', async (original) => ({
  ...(await original<typeof import('./fingerprint')>()),
  captureInputs: vi.fn(),
}));

const roots: string[] = [];
let root = '';
const capture = vi.mocked(captureInputs);
const prepare = vi.mocked(prepareVerification);
const stages = vi.mocked(runVerificationStages);
const seed = 'export const input = 1;\n';
const base = verificationFixture();
type StageInput = Parameters<typeof runVerificationStages>[0];
const stageResult = (input: StageInput, shouldUseOldContext = false) => {
  const context = { ...input.context, stageId: 'app-desktop' };
  return {
    stages: [
      {
        ...structuredClone(base.stage),
        context,
        report: {
          ...structuredClone(base.report),
          context: shouldUseOldContext ? base.report.context : context,
        },
        evidence: { ...structuredClone(base.stage.evidence), context },
      },
    ],
    runs: [{ stageId: 'app-desktop', runId: null, status: 'passed' }],
  };
};
const latest = () => join(root, 'test-results/quality/verification.json');
const readJson = async (path: string): Promise<unknown> =>
  JSON.parse(await readFile(path, 'utf8'));
const deferred = () => {
  let release: () => void = () => {
    throw new Error('deferred未初期化');
  };
  const promise = new Promise<void>((done) => {
    release = done;
  });
  return { promise, release: () => release() };
};

beforeEach(async () => {
  vi.resetAllMocks();
  root = await realpath(await mkdtemp(join(tmpdir(), 'e2e-verification-run-')));
  roots.push(root);
  await mkdir(join(root, 'src'));
  await writeFile(join(root, 'src/input.ts'), seed);
  const actual =
    await vi.importActual<typeof import('./fingerprint')>('./fingerprint');
  capture.mockImplementation(actual.captureInputs);
  prepare.mockImplementation(async (target) => ({
    plan: base.plan,
    inputs: await captureInputs(target),
    scheduleExpected: [],
    integrationExpected: [],
  }));
  stages.mockImplementation(async (input) => stageResult(input));
});
afterEach(async () => {
  vi.restoreAllMocks();
  for (const target of roots.splice(0)) {
    const child = relative(resolve(tmpdir()), resolve(target));
    if (
      !child ||
      child === '..' ||
      child.startsWith(`..${sep}`) ||
      !child.startsWith('e2e-verification-run-')
    )
      throw new Error('fixture cleanup pathが不正です');
    await rm(target, { recursive: true, force: true });
  }
});

describe('runVerification入口', () => {
  it('旧latestをrunningへ更新し、開始前capture失敗ではrunnerを起動しない', async () => {
    await mkdir(dirname(latest()), { recursive: true });
    await writeFile(
      latest(),
      JSON.stringify({ status: 'passed', verificationId: 'old-run' }),
    );
    let receiptDuringCapture: unknown;
    capture.mockImplementationOnce(async () => {
      receiptDuringCapture = await readJson(latest());
      throw new Error('private-capture-error');
    });
    const state = await runVerification(root);
    // 本体catchにassertionを吸収させないよう、観測後にtest側で評価する。
    expect(receiptDuringCapture).toMatchObject({
      status: 'running',
      phase: 'preparation',
      verification: null,
    });
    expect(state.status).toBe('failed');
    expect(state.failure).toBe('VERIFICATION_FAILED');
    expect(state.inputDigestBefore).toBeNull();
    expect(stages).not.toHaveBeenCalled();
    expect(await readJson(latest())).toEqual(state);
    expect(JSON.stringify(state)).not.toContain('private-capture-error');
  });

  it('同一rootの全入力・固定plan・context・root receiptと最終checkerを接続する', async () => {
    const state = await runVerification(root);
    expect(state.status).toBe('passed');
    expect(state.phase).toBe('complete');
    expect(state.inputDigestAfter).toBe(state.inputDigestBefore);
    expect(state.verification?.issues).toEqual([]);
    expect(state.verification?.counts).toMatchObject({
      required: base.plan.requirements.length,
      passed: base.plan.requirements.length,
    });
    expect(stages).toHaveBeenCalledOnce();
    expect(stages.mock.calls[0]?.[0]).toMatchObject({
      root,
      context: {
        verificationId: state.verificationId,
        selectionDigest: state.selectionDigest,
        inputDigest: state.inputDigestBefore,
      },
    });
    const directory = join(
      root,
      'test-results/verification',
      state.verificationId,
    );
    expect(await readJson(join(directory, 'plan.json'))).toEqual(base.plan);
    expect(
      createHash('sha256')
        .update(await readFile(join(directory, 'plan.json')))
        .digest('hex'),
    ).toBe(state.selectionDigest);
    expect(await readJson(join(directory, 'inputs-start.json'))).toMatchObject({
      digest: state.inputDigestBefore,
      files: expect.arrayContaining([
        expect.objectContaining({ path: 'src/input.ts' }),
      ]),
    });
    expect(await readJson(join(directory, 'inputs-end.json'))).toMatchObject({
      digest: state.inputDigestAfter,
    });
    expect(await readJson(join(directory, 'receipt.json'))).toEqual(state);
    expect(await readJson(latest())).toEqual(state);
  });

  it('古いreport contextを最終checkerが拒否する', async () => {
    stages.mockImplementation(async (input) => stageResult(input, true));
    const state = await runVerification(root);
    expect(state.status).toBe('failed');
    expect(state.verification?.issues).toContainEqual({
      code: 'REPORT_CONTEXT_MISMATCH',
      subject: 'app-desktop',
    });
  });

  it.each([
    'added',
    'removed',
    'changed',
  ] as const)('終了fingerprintの%sを最終checkerで拒否する', async (change) => {
    stages.mockImplementation(async (input) => {
      if (change === 'added')
        await writeFile(join(root, 'src/new.ts'), 'new\n');
      else if (change === 'removed') await unlink(join(root, 'src/input.ts'));
      else await writeFile(join(root, 'src/input.ts'), 'changed\n');
      return stageResult(input);
    });
    const state = await runVerification(root);
    expect(state.status).toBe('failed');
    expect(state.inputDigestAfter).not.toBe(state.inputDigestBefore);
    expect(state.verification?.issues).toContainEqual({
      code: 'INPUT_CHANGED',
      subject: 'verification',
    });
  });

  it('一度変更後に復元してもcheckpoint履歴から不合格にする', async () => {
    stages.mockImplementation(async (input) => {
      await writeFile(join(root, 'src/input.ts'), 'changed\n');
      await expect(input.checkpoint('middle-changed')).rejects.toThrow(
        '入力が変化',
      );
      await writeFile(join(root, 'src/input.ts'), seed);
      await input.checkpoint('middle-restored');
      return stageResult(input);
    });
    const state = await runVerification(root);
    expect(state.inputDigestAfter).toBe(state.inputDigestBefore);
    expect(state.verification?.issues).toEqual([]);
    expect(state.status).toBe('failed');
    expect(state.checkpoints).toContainEqual(
      expect.objectContaining({
        phase: 'middle-changed',
        changes: { added: [], removed: [], changed: ['src/input.ts'] },
      }),
    );
    expect(state.checkpoints).toContainEqual(
      expect.objectContaining({
        phase: 'middle-restored',
        changes: { added: [], removed: [], changed: [] },
      }),
    );
    expect(await readJson(latest())).toEqual(state);
  });

  it('途中capture失敗でもstage finally完了を待ってfailed receiptを保存する', async () => {
    const cleanup = deferred();
    const cleaning = deferred();
    let cleaned = false;
    stages.mockImplementation(async (input) => {
      capture.mockRejectedValueOnce(new Error('private-checkpoint-error'));
      try {
        await input.checkpoint('middle');
      } finally {
        cleaning.release();
        await cleanup.promise;
        cleaned = true;
      }
      return stageResult(input);
    });
    let settled = false;
    const execution = runVerification(root).then((state) => {
      settled = true;
      return state;
    });
    await cleaning.promise;
    expect(cleaned).toBe(false);
    expect(settled).toBe(false);
    cleanup.release();
    const state = await execution;
    expect(cleaned).toBe(true);
    expect(state.status).toBe('failed');
    expect(state.failure).toBe('VERIFICATION_FAILED');
    expect(await readJson(latest())).toEqual(state);
    expect(JSON.stringify(state)).not.toContain('private-checkpoint-error');
  });

  it('SIGINT後もstage finallyを待ちlistenerを外してINTERRUPTEDを保存する', async () => {
    const started = deferred();
    const cleanup = deferred();
    const cleaning = deferred();
    const beforeListeners = process.listenerCount('SIGINT');
    let cleaned = false;
    stages.mockImplementation(async (input) => {
      started.release();
      try {
        await new Promise<void>((done) =>
          input.signal.addEventListener('abort', () => done(), { once: true }),
        );
        input.signal.throwIfAborted();
      } finally {
        cleaning.release();
        await cleanup.promise;
        cleaned = true;
      }
      return stageResult(input);
    });
    let settled = false;
    const execution = runVerification(root).then((state) => {
      settled = true;
      return state;
    });
    await started.promise;
    process.emit('SIGINT');
    await cleaning.promise;
    expect(cleaned).toBe(false);
    expect(settled).toBe(false);
    cleanup.release();
    const state = await execution;
    expect(cleaned).toBe(true);
    expect(state.status).toBe('failed');
    expect(state.failure).toBe('INTERRUPTED');
    expect(process.listenerCount('SIGINT')).toBe(beforeListeners);
    expect(await readJson(latest())).toEqual(state);
  });
});
