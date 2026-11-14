import { z } from 'zod';

import { writeProgressStderr } from './progressStderr';

const cliTimingSchema = z
  .object({
    operation: z.enum([
      'supabase-version',
      'docker-context',
      'docker-info',
      'git-head',
      'git-common-dir',
      'environment-lock',
      'environment-inputs',
      'environment-preflight',
      'environment-start',
      'environment-inspect',
      'environment-catalog',
      'environment-cleanup-record',
      'environment-cleanup-plan',
      'environment-cleanup-remove',
      'environment-cleanup-remaining',
      'environment-release',
    ]),
    elapsedMs: z.number().int().nonnegative(),
    outcome: z.enum(['completed', 'failed']),
  })
  .strict();

/** 引数や例外本文を含めず、CLI事前検査と所有環境の各呼出区間を記録する。 */
export const measureCliStep = async <T>(
  operation: z.infer<typeof cliTimingSchema>['operation'],
  run: () => Promise<T>,
): Promise<T> => {
  let start: number | undefined;
  try {
    start = performance.now();
  } catch {
    // 診断用時計を読めなくても本来の処理は実行する。
  }
  let outcome: z.infer<typeof cliTimingSchema>['outcome'] = 'failed';
  try {
    const result = await run();
    outcome = 'completed';
    return result;
  } finally {
    try {
      if (
        start !== undefined &&
        (process.env.GITHUB_ACTIONS === 'true' ||
          process.env.E2E_CLI_TIMING === '1')
      ) {
        const timing = cliTimingSchema.parse({
          operation,
          elapsedMs: Math.max(0, Math.round(performance.now() - start)),
          outcome,
        });
        writeProgressStderr(`[cli-timing] ${JSON.stringify(timing)}\n`);
      }
    } catch {
      // 診断出力の失敗で検査結果や所有resourceの後始末を変えない。
    }
  }
};
