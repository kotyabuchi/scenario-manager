import { z } from 'zod';

const operationSchema = z.enum([
  'worktree-directory',
  'registry-directory',
  'lock-file',
  'port-bind',
]);
const systemCodeSchema = z.enum([
  'EACCES',
  'EADDRINUSE',
  'EADDRNOTAVAIL',
  'EAFNOSUPPORT',
  'EEXIST',
  'EINVAL',
  'ELOOP',
  'EMFILE',
  'ENFILE',
  'ENODEV',
  'ENOENT',
  'ENOSPC',
  'ENOTDIR',
  'EPERM',
  'EPROTONOSUPPORT',
  'EROFS',
]);
const MAX_CAUSES = 32;

/** 元の例外を非公開のcauseへ保持し、環境予約の失敗箇所だけを識別する。 */
export class EnvironmentLockError extends Error {
  constructor(
    readonly operation: z.infer<typeof operationSchema>,
    cause: unknown,
  ) {
    super(cause instanceof Error ? cause.message : '環境予約に失敗しました。', {
      cause,
    });
    this.name = 'EnvironmentLockError';
  }
}

/** message・stack・path・任意codeを公開せず、許可した診断値だけを返す。 */
export const summarizeEnvironmentFailure = (
  error: unknown,
  isLocking = false,
) => {
  const pending: unknown[] = [error];
  const seen = new Set<Error>();
  const operations = new Set<z.infer<typeof operationSchema>>();
  const systemCodes = new Set<z.infer<typeof systemCodeSchema>>();
  let visited = 0;
  while (pending.length > 0 && visited < MAX_CAUSES) {
    visited += 1;
    const current = pending.pop();
    if (!(current instanceof Error) || seen.has(current)) continue;
    seen.add(current);
    if (current instanceof EnvironmentLockError) {
      const operation = operationSchema.safeParse(current.operation);
      if (operation.success) operations.add(operation.data);
    }
    if ('code' in current) {
      const code = systemCodeSchema.safeParse(current.code);
      if (code.success) systemCodes.add(code.data);
    }
    pending.push(current.cause);
    if (current instanceof AggregateError)
      pending.push(...current.errors.slice(0, MAX_CAUSES));
  }
  if (operations.size === 0 && !isLocking) return null;
  return {
    kind: 'environment-lock',
    operations: [...operations].sort(),
    systemCodes: [...systemCodes].sort(),
  };
};
