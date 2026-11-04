import { describe, expect, it, vi } from 'vitest';

import { closeActorContexts } from '../../e2e/fixtures/closeActorContexts';

describe('closeActorContexts', () => {
  it('一部が失敗しても他contextの終了を待って全失敗を伝える', async () => {
    const firstError = new Error('first close failed');
    const secondError = new Error('second close failed');
    const delayed = Promise.withResolvers<void>();
    const first = { close: vi.fn().mockRejectedValue(firstError) };
    const second = { close: vi.fn(() => delayed.promise) };
    let hasSettled = false;
    const result = closeActorContexts([first, second]).then(
      () => {
        hasSettled = true;
        return undefined;
      },
      (error: unknown) => {
        hasSettled = true;
        return error;
      },
    );
    await vi.waitFor(() => {
      expect(first.close).toHaveBeenCalledOnce();
      expect(second.close).toHaveBeenCalledOnce();
    });
    expect(hasSettled).toBe(false);
    delayed.reject(secondError);
    const error = await result;
    expect(error).toBeInstanceOf(AggregateError);
    if (!(error instanceof AggregateError))
      throw new Error('終了失敗が集約されていません。');
    expect(error.errors).toEqual([firstError, secondError]);
  });
});
