import { z } from 'zod';

import { ciShardIdSchema, ciWorkflowSchema } from './ciPartitionSchema';
import { surfaceReplayDiagnosticSchema } from './surfaceReplayFailure';
import { verificationContextSchema } from './verificationSchema';

export const ciJobSchema = z.enum([
  'plan',
  ...ciShardIdSchema.options,
  'aggregate',
]);
const ciPhaseSchema = z.enum([
  'arguments',
  'context',
  'inputs',
  'quality',
  'static-ledger',
  'selection',
  'manifest',
  'collection',
  'execution',
  'receipt',
  'aggregate',
  'artifacts',
]);
const qualityCheckSchema = z.enum([
  'check:ci',
  'typecheck',
  'test:unit',
  'test:e2e-tools',
]);
const ciProgressSchema = z.strictObject({
  phase: ciPhaseSchema,
  qualityCheck: qualityCheckSchema.optional(),
  verificationId: verificationContextSchema.shape.verificationId.optional(),
  issueCount: z.number().int().nonnegative().optional(),
  // 確認できた場合だけcompleteとする。unknownは回収漏れの断定を含まない。
  cleanup: z.enum(['complete', 'unknown']).optional(),
});

type CiJob = z.infer<typeof ciJobSchema>;
type CiProgressUpdate = z.infer<typeof ciProgressSchema>;
type CiProgress = (update: CiProgressUpdate) => void;

const phaseFailure = {
  arguments: ['CI_ARGUMENTS_INVALID', 'CIコマンドの引数を確認してください。'],
  context: [
    'CI_CONTEXT_INVALID',
    'CIイベント、checkout、依存jobの結果を確認してください。',
  ],
  inputs: [
    'CI_INPUTS_INVALID',
    '固定入力とGit snapshotの一致を確認してください。',
  ],
  quality: [
    'CI_QUALITY_CHECK_FAILED',
    '失敗した品質チェックを確認してください。',
  ],
  'static-ledger': [
    'CI_STATIC_LEDGER_FAILED',
    '静的台帳と全登録の照合に失敗しました。',
  ],
  selection: [
    'CI_SELECTION_FAILED',
    '変更選択と実行対象の照合に失敗しました。',
  ],
  manifest: [
    'CI_MANIFEST_INVALID',
    '同じrun attemptの分割manifestを確認してください。',
  ],
  collection: [
    'CI_COLLECTION_FAILED',
    'runnerの登録とplannerの収集結果を確認してください。',
  ],
  execution: ['CI_EXECUTION_FAILED', 'runnerの起動または実行に失敗しました。'],
  receipt: [
    'CI_RECEIPT_INVALID',
    'runner結果、保存した証拠、後始末を確認してください。',
  ],
  aggregate: [
    'CI_AGGREGATE_FAILED',
    '依存jobの結果と同じattemptの分割成果物を確認してください。',
  ],
  artifacts: ['CI_ARTIFACTS_FAILED', 'CI成果物の保存に失敗しました。'],
} as const satisfies Record<
  CiProgressUpdate['phase'],
  readonly [string, string]
>;

/** 許可済みフィールドだけを保持し、前の段階で判明したrunner IDと件数を引き継ぐ。 */
export const advanceCiProgress = (
  previous: CiProgressUpdate,
  rawUpdate: unknown,
): CiProgressUpdate => {
  const next = ciProgressSchema.safeParse(rawUpdate);
  if (!next.success) return previous;
  const { phase, qualityCheck, verificationId, issueCount, cleanup } =
    next.data;
  return {
    phase,
    ...(phase === 'quality' && qualityCheck ? { qualityCheck } : {}),
    verificationId: verificationId ?? previous.verificationId,
    issueCount: issueCount ?? previous.issueCount,
    cleanup: cleanup ?? previous.cleanup,
  };
};

/** 例外・子プロセス出力・イベントpayloadを含まない固定形式の公開診断を作る。 */
export const createCiFailure = (input: {
  job: CiJob | null;
  progress: CiProgressUpdate;
  env: NodeJS.ProcessEnv;
  interrupted: boolean;
  surfaceReplay?: unknown;
}) => {
  const { job, env, interrupted } = input;
  const progress = advanceCiProgress({ phase: 'context' }, input.progress);
  const surfaceReplay =
    job === 'plan' && progress.phase === 'static-ledger'
      ? surfaceReplayDiagnosticSchema.safeParse(input.surfaceReplay)
      : undefined;
  const [code, message] = interrupted
    ? (['CI_INTERRUPTED', 'CI検証は中断されました。'] as const)
    : phaseFailure[progress.phase];
  const attempt = env.GITHUB_RUN_ATTEMPT;
  const runId = env.GITHUB_RUN_ID;
  const workflow = ciWorkflowSchema.safeParse({
    runId: runId && /^[1-9][0-9]{0,19}$/u.test(runId) ? runId : undefined,
    attempt:
      attempt && /^[1-9][0-9]{0,15}$/u.test(attempt)
        ? Number(attempt)
        : undefined,
  });
  return {
    schemaVersion: 1 as const,
    status: 'failed' as const,
    job,
    code,
    message,
    ...progress,
    ...(surfaceReplay?.success ? { surfaceReplay: surfaceReplay.data } : {}),
    ...(workflow.success ? { workflow: workflow.data } : {}),
  };
};

export type { CiJob, CiProgress, CiProgressUpdate };
