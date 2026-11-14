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
    ]),
    elapsedMs: z.number().int().nonnegative(),
    outcome: z.enum(['completed', 'failed']),
  })
  .strict();

/** コマンドの引数や例外本文を含めず、事前検査の待ち時間だけを記録する。 */
export const measureCliStep = async <T>(
  operation: z.infer<typeof cliTimingSchema>['operation'],
  run: () => Promise<T>,
): Promise<T> => {
  const start = performance.now();
  let outcome: z.infer<typeof cliTimingSchema>['outcome'] = 'failed';
  try {
    const result = await run();
    outcome = 'completed';
    return result;
  } finally {
    try {
      if (
        process.env.GITHUB_ACTIONS === 'true' ||
        process.env.E2E_CLI_TIMING === '1'
      ) {
        const timing = cliTimingSchema.parse({
          operation,
          elapsedMs: Math.round(performance.now() - start),
          outcome,
        });
        writeProgressStderr(`[cli-timing] ${JSON.stringify(timing)}\n`);
      }
    } catch {
      // 診断出力の失敗で検査結果や所有resourceの後始末を変えない。
    }
  }
};
