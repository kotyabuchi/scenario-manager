import { isNil } from 'ramda';

import { spawn } from 'node:child_process';

const DEADLINE_MS = 2_000;
const GRACE_MS = 5_000;
const MAX_BYTES = 256 * 1024;

/** 所有したnative childのみ終了要求し、stdoutの上限超過時も実closeまで待つ。 */
export const readBoundedDiagnosticChild = (
  executable: string,
  args: string[],
  signal: AbortSignal,
) => {
  let child: ReturnType<typeof spawn> | null = null;
  try {
    child = spawn(executable, args, {
      // アプリ側のProcessEnv必須型を満たしつつ、親の値は継承しない。
      env: {
        PATH: '/usr/bin:/bin',
        LANG: 'C',
        NODE_ENV: 'production',
        NEXT_PUBLIC_SUPABASE_URL: '',
        NEXT_PUBLIC_SUPABASE_ANON_KEY: '',
      },
      stdio: ['ignore', 'pipe', 'pipe'],
      windowsHide: true,
    });
  } catch {
    return { child: null, completion: Promise.resolve(null) };
  }
  const owned = child;
  const completion = new Promise<string | null>((resolve) => {
    let bytes = 0;
    let failed = false;
    const chunks: Buffer[] = [];
    let grace: ReturnType<typeof setTimeout> | undefined;
    const stop = () => {
      failed = true;
      try {
        owned.kill('SIGTERM');
      } catch {}
      grace ??= setTimeout(() => {
        try {
          owned.kill('SIGKILL');
        } catch {}
      }, GRACE_MS);
    };
    const timer = setTimeout(stop, DEADLINE_MS);
    signal.addEventListener('abort', stop, { once: true });
    if (signal.aborted) stop();
    owned.stdout?.on('data', (chunk: Buffer) => {
      bytes += chunk.length;
      if (bytes > MAX_BYTES) stop();
      else chunks.push(chunk);
    });
    owned.stdout?.on('error', stop);
    owned.stderr?.on('error', stop);
    owned.stderr?.resume();
    owned.once('error', () => {
      failed = true;
    });
    owned.once('close', (code) => {
      clearTimeout(timer);
      if (!isNil(grace)) clearTimeout(grace);
      signal.removeEventListener('abort', stop);
      resolve(
        !failed && code === 0 ? Buffer.concat(chunks).toString('utf8') : null,
      );
    });
  });
  return { child: owned, completion };
};
