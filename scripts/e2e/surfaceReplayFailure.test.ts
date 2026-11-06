import { describe, expect, it } from 'vitest';

import {
  createSurfaceReplayDiagnosticError,
  readSurfaceReplayDiagnostic,
  surfaceReplayDiagnosticSchema,
} from './surfaceReplayFailure';

const diagnostic = { step: 'panda', processFailure: 'timeout' } as const;

describe('歴史再生の公開診断', () => {
  it('作成した診断だけを再検証し、安全な固定値のコピーを返す', () => {
    const error = createSurfaceReplayDiagnosticError(diagnostic);
    expect(error.message).toBe('歴史再生の処理に失敗しました: panda');
    expect(error).not.toHaveProperty('cause');
    expect(readSurfaceReplayDiagnostic(error)).toEqual(diagnostic);
    expect(readSurfaceReplayDiagnostic(error)).not.toBe(
      readSurfaceReplayDiagnostic(error),
    );
  });

  it('模倣オブジェクトや例外のcauseは診断として扱わない', () => {
    const error = createSurfaceReplayDiagnosticError(diagnostic);
    const mimic: unknown = Object.create(Object.getPrototypeOf(error));
    expect(readSurfaceReplayDiagnostic(mimic)).toBeUndefined();
    expect(readSurfaceReplayDiagnostic(diagnostic)).toBeUndefined();
    expect(
      readSurfaceReplayDiagnostic(new Error('private-token', { cause: error })),
    ).toBeUndefined();
  });

  it('任意の工程や失敗区分、追加プロパティを拒否する', () => {
    expect(
      surfaceReplayDiagnosticSchema.safeParse({
        ...diagnostic,
        step: 'private',
      }).success,
    ).toBe(false);
    expect(
      surfaceReplayDiagnosticSchema.safeParse({
        ...diagnostic,
        processFailure: 'private',
      }).success,
    ).toBe(false);
    const extra = { ...diagnostic, path: 'private' };
    expect(() => createSurfaceReplayDiagnosticError(extra)).toThrow();
  });
});
