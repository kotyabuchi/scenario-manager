/**
 * 処理結果を表す型
 * 成功時はdataを、失敗時はerrorを持つ
 */
export type Result<T, E = Error> =
  | { success: true; data: T }
  | { success: false; error: E };

/**
 * Result型のヘルパー関数
 */
export const ok = <T>(data: T): Result<T, never> => ({
  success: true,
  data,
});

export const err = <E = Error>(error: E): Result<never, E> => ({
  success: false,
  error,
});

/**
 * Result型かどうかを判定する型ガード
 */
export const isOk = <T, E>(
  result: Result<T, E>,
): result is { success: true; data: T } => result.success;

export const isErr = <T, E>(
  result: Result<T, E>,
): result is { success: false; error: E } => !result.success;
