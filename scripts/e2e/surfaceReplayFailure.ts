import { isNil } from 'ramda';
import { z } from 'zod';

export const surfaceReplayDiagnosticSchema = z.strictObject({
  step: z.enum([
    'init',
    'fetch',
    'checkout',
    'ancestor',
    'before-head',
    'before-status',
    'pnpm-version',
    'pnpm-install',
    'panda',
    'static-gate',
    'after-head',
    'after-status',
  ]),
  processFailure: z.enum([
    'spawn-error',
    'exit-failed',
    'descendants-remained',
    'group-unsettled',
    'timeout',
    'aborted',
  ]),
});

type SurfaceReplayDiagnostic = z.infer<typeof surfaceReplayDiagnosticSchema>;

class SurfaceReplayDiagnosticError extends Error {
  readonly #diagnostic: SurfaceReplayDiagnostic;

  constructor(diagnostic: SurfaceReplayDiagnostic) {
    const parsed = surfaceReplayDiagnosticSchema.parse(diagnostic);
    super(`歴史再生の処理に失敗しました: ${parsed.step}`);
    this.#diagnostic = parsed;
  }

  static read(error: unknown) {
    if (typeof error !== 'object' || isNil(error) || !(#diagnostic in error))
      return undefined;
    const parsed = surfaceReplayDiagnosticSchema.safeParse(error.#diagnostic);
    return parsed.success ? parsed.data : undefined;
  }
}

/** 固定の診断値だけを次のCLI境界に渡す。 */
export const createSurfaceReplayDiagnosticError = (
  diagnostic: SurfaceReplayDiagnostic,
): Error => new SurfaceReplayDiagnosticError(diagnostic);

/** 任意の例外プロパティやcauseを辿らず、自分で生成した診断だけを読む。 */
export const readSurfaceReplayDiagnostic = (error: unknown) =>
  SurfaceReplayDiagnosticError.read(error);

export type { SurfaceReplayDiagnostic };
