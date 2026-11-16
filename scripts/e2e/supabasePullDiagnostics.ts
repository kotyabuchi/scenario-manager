import { writeProgressStderr } from './progressStderr';

const roles = {
  db: 'postgres',
  postgres: 'postgres',
  gateway: 'kong',
  kong: 'kong',
  api: 'postgrest',
  postgrest: 'postgrest',
  auth: 'gotrue',
  gotrue: 'gotrue',
  storage: 'storage-api',
  'storage-api': 'storage-api',
} as const;
const interrupted =
  /^(db|postgres|gateway|kong|api|postgrest|auth|gotrue|storage|storage-api)\s+Interrupted$/;
const layerRetry = /^[a-f0-9]{12,64}(:)? Retrying in ([1-9]\d{0,3}) seconds?$/;

/** 追加表示だけを固定enumへ縮約し、任意行やlayer IDを保存しない。 */
export const createSupabasePullDiagnostics = () => {
  const events: {
    kind: 'interrupted' | 'layer-retry';
    role: string | null;
    format: 'compose' | 'fallback';
    elapsedMs: number;
  }[] = [];
  let truncated = false;
  let closed = false;
  return {
    matchesLine: (line: string) =>
      line.length <= 2048 && (interrupted.test(line) || layerRetry.test(line)),
    observeLine: (line: string, elapsedMs: number) => {
      if (
        closed ||
        line.length > 2048 ||
        !Number.isSafeInteger(elapsedMs) ||
        elapsedMs < 0
      )
        return;
      const match = interrupted.exec(line);
      const retry = layerRetry.exec(line);
      if (!match && !retry) return;
      if (events.length >= 128) {
        truncated = true;
        return;
      }
      if (match) {
        const key = match[1] as keyof typeof roles;
        events.push({
          kind: 'interrupted',
          role: roles[key],
          format: 'compose',
          elapsedMs,
        });
      } else {
        events.push({
          kind: 'layer-retry',
          role: null,
          format: retry?.[1] ? 'fallback' : 'compose',
          elapsedMs,
        });
      }
    },
    close: () => {
      if (closed) return;
      closed = true;
      if (events.length || truncated)
        writeProgressStderr(
          `[supabase-pull-diagnostics] ${JSON.stringify({ version: 1, events, truncated })}\n`,
        );
    },
  };
};
