import type { BrowserContext } from '@playwright/test';

/** 一部の終了が失敗しても、全contextの終了を待ってから失敗を伝える。 */
export const closeActorContexts = async (
  contexts: readonly Pick<BrowserContext, 'close'>[],
) => {
  const results = await Promise.allSettled(
    contexts.map(async (context) => context.close()),
  );
  const failures: unknown[] = results.flatMap((result) =>
    result.status === 'rejected' ? [result.reason] : [],
  );
  if (failures.length > 0)
    throw new AggregateError(failures, 'actor contextの終了に失敗しました。');
};
