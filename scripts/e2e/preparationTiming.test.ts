import { describe, expect, it, vi } from 'vitest';

import {
  measurePreparation,
  measurePreparationSync,
  writePreparationTiming,
} from './preparationTiming';

const span = { phase: 'selection', operation: 'decision' } as const;

describe('preparation timing', () => {
  it('同期処理の結果と例外を保持し、observerの失敗でcleanupを妨げない', () => {
    const result = { selected: true };
    const failure = new Error('private-original-failure');
    const observer = vi.fn(() => {
      throw new Error('private-observer-failure');
    });
    expect(measurePreparationSync(span, observer, () => result)).toBe(result);

    let cleaned = false;
    let thrown: unknown;
    try {
      measurePreparationSync(span, observer, () => {
        try {
          throw failure;
        } finally {
          cleaned = true;
        }
      });
    } catch (error) {
      thrown = error;
    }
    expect(thrown).toBe(failure);
    expect(cleaned).toBe(true);
    expect(observer).toHaveBeenCalledWith(
      expect.objectContaining({ ...span, outcome: 'failed' }),
    );
  });

  it('非同期処理の完了前は成功を通知せず、結果と失敗のidentityを保つ', async () => {
    const result = { collected: true };
    let resolve: ((value: typeof result) => void) | undefined;
    const pending = new Promise<typeof result>((finish) => {
      resolve = finish;
    });
    const observer = vi.fn();
    const measured = measurePreparation(span, observer, () => pending);
    expect(observer).not.toHaveBeenCalled();
    resolve?.(result);
    await expect(measured).resolves.toBe(result);
    expect(observer).toHaveBeenCalledWith(
      expect.objectContaining({ ...span, outcome: 'completed' }),
    );

    const failure = new Error('private-async-failure');
    let cleaned = false;
    const failing = measurePreparation(
      span,
      () => {
        throw new Error('private-observer-failure');
      },
      async () => {
        try {
          throw failure;
        } finally {
          cleaned = true;
        }
      },
    );
    await expect(failing).rejects.toBe(failure);
    expect(cleaned).toBe(true);
  });

  it('公開writerは固定schemaだけを出し、path・例外本文・未知ラベルを捨てる', () => {
    const stderr = vi.spyOn(process.stderr, 'write').mockReturnValue(true);
    try {
      const valid = {
        ...span,
        revision: 'working',
        reused: false,
        elapsedMs: 17,
        outcome: 'completed',
      } as const;
      writePreparationTiming(valid);
      for (const invalid of [
        { ...valid, path: 'private-path' },
        { ...valid, error: 'private-error' },
        { ...valid, operation: 'private-operation' },
        { ...valid, revision: 'private-revision' },
        { ...valid, elapsedMs: Number.NaN },
      ])
        writePreparationTiming(invalid);

      expect(stderr).toHaveBeenCalledTimes(1);
      const output = String(stderr.mock.calls[0]?.[0]);
      expect(output).toBe(`[preparation-timing] ${JSON.stringify(valid)}\n`);
      expect(output).not.toContain('private-');
      expect(output).not.toContain('[ci-timing]');
    } finally {
      stderr.mockRestore();
    }
  });
});
