import { z } from 'zod';

import { writeProgressStderr } from './progressStderr';

/** 公開計時には固定ラベルと経過時間だけを許し、入力や例外本文を含めない。 */
export const preparationTimingSchema = z
  .object({
    phase: z.enum(['static-ledger', 'collection', 'selection']),
    operation: z.enum([
      'inputs',
      'revisions',
      'product-source',
      'story-source',
      'inventory',
      'inventory-proof',
      'ledger',
      'discover-app',
      'discover-isolated',
      'discover-storybook',
      'discover-integration',
      'discovery-wait',
      'bind-validate',
      'legacy',
      'plan',
      'static-check',
      'snapshot',
      'rules',
      'panda-proof',
      'revision-inputs',
      'inventory-digest',
      'package-check',
      'snapshot-inventories',
      'graph',
      'checkpoint-inputs',
      'checkpoint-snapshot',
      'decision',
      'checkpoint',
    ]),
    revision: z.enum(['base', 'head', 'index', 'working']).optional(),
    reused: z.boolean().optional(),
    elapsedMs: z.number().finite().nonnegative(),
    outcome: z.enum(['completed', 'failed']),
  })
  .strict();

type PreparationTiming = z.infer<typeof preparationTimingSchema>;
type PreparationSpan = Omit<PreparationTiming, 'elapsedMs' | 'outcome'>;
type PreparationTimingObserver = (timing: PreparationTiming) => void;

const publishTiming = (
  span: PreparationSpan,
  observer: PreparationTimingObserver | undefined,
  startedAt: number,
  outcome: PreparationTiming['outcome'],
) => {
  if (!observer) return;
  try {
    const timing = preparationTimingSchema.parse({
      ...span,
      elapsedMs: Math.max(0, Math.round(performance.now() - startedAt)),
      outcome,
    });
    observer(timing);
  } catch {
    // 計測の失敗で、本来の戻り値・例外・cleanupを変えない。
  }
};

/** 同期区間を計測する。結果と例外のidentityを保つ。 */
export const measurePreparationSync = <T>(
  span: PreparationSpan,
  observer: PreparationTimingObserver | undefined,
  operation: () => T,
): T => {
  const startedAt = performance.now();
  let outcome: PreparationTiming['outcome'] = 'failed';
  try {
    const result = operation();
    outcome = 'completed';
    return result;
  } finally {
    publishTiming(span, observer, startedAt, outcome);
  }
};

/** 非同期区間の完了までを計測する。並行区間の時間は合計wallではない。 */
export const measurePreparation = async <T>(
  span: PreparationSpan,
  observer: PreparationTimingObserver | undefined,
  operation: () => Promise<T>,
): Promise<T> => {
  const startedAt = performance.now();
  let outcome: PreparationTiming['outcome'] = 'failed';
  try {
    const result = await operation();
    outcome = 'completed';
    return result;
  } finally {
    publishTiming(span, observer, startedAt, outcome);
  }
};

/** CIの粗いphaseログと区別して、検証済みの診断値だけを出力する。 */
export const writePreparationTiming = (value: unknown) => {
  const result = preparationTimingSchema.safeParse(value);
  if (result.success)
    writeProgressStderr(
      `[preparation-timing] ${JSON.stringify(result.data)}\n`,
    );
};

export type { PreparationSpan, PreparationTiming, PreparationTimingObserver };
