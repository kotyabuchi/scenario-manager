import { isNil } from 'ramda';

import { resolveLocalExecutable } from './environmentExecutable';

import { execFile } from 'node:child_process';
import { writeFile } from 'node:fs/promises';

import type { ChildProcess } from 'node:child_process';

const MAX_OUTPUT_BYTES = 16 * 1024 * 1024;
const COMMAND_TIMEOUT_MS = 30 * 60 * 1000;
const TERMINATION_GRACE_MS = 5_000;
const ENVIRONMENT_KEYS = new Set([
  'PATH',
  'PATHEXT',
  'SYSTEMROOT',
  'WINDIR',
  'COMSPEC',
  'TEMP',
  'TMP',
  'USERPROFILE',
  'APPDATA',
  'LOCALAPPDATA',
  'HOME',
]);

/** cloud資格情報・DB URL・実験flagを子プロセスへ継承しない。 */
export const localCommandEnvironment = (
  source: NodeJS.ProcessEnv,
  dockerHost: string,
): NodeJS.ProcessEnv => {
  if (!/^(unix:\/\/\/|npipe:\/\/\/\/\.\/pipe\/)[^\r\n]+$/.test(dockerHost))
    throw new Error('local Docker socket以外は使用できません。');
  const env = { ...source };
  for (const key of Object.keys(env))
    if (!ENVIRONMENT_KEYS.has(key.toUpperCase()))
      Reflect.deleteProperty(env, key);
  env.DOCKER_HOST = dockerHost;
  env.NO_COLOR = '1';
  return env;
};

/** shellを使わず固定CLIを起動する。出力は呼出元か非公開logにのみ渡す。 */
export const runLocalCommand = async (
  tool: 'supabase' | 'docker' | 'git' | 'node',
  args: string[],
  options: {
    cwd: string;
    env: NodeJS.ProcessEnv;
    log?: string;
    signal?: AbortSignal;
    shouldAllowAbort?: boolean;
  },
): Promise<string> => {
  let executable: string;
  try {
    executable =
      tool === 'node'
        ? process.execPath
        : await resolveLocalExecutable(tool, options.env);
    options.signal?.throwIfAborted();
  } catch {
    throw new Error(`${tool}の実行に失敗しました。`);
  }
  return new Promise((resolve, reject) => {
    let hasClosed = false;
    let hasSettled = false;
    let hasInputFailed = false;
    let finish: (() => Promise<string>) | undefined;
    const fail = () => reject(new Error(`${tool}の実行に失敗しました。`));
    const settle = () => {
      if (!hasClosed || hasSettled || isNil(finish)) return;
      hasSettled = true;
      // callbackはAbortError時に終了前でも呼ばれる。close確認後だけ結果を公開する。
      finish().then(resolve, fail);
    };
    let child: ChildProcess;
    try {
      child = execFile(
        executable,
        args,
        {
          cwd: options.cwd,
          env: options.env,
          windowsHide: true,
          encoding: 'utf8',
          maxBuffer: MAX_OUTPUT_BYTES,
          timeout: COMMAND_TIMEOUT_MS,
          ...(isNil(options.signal) ? {} : { signal: options.signal }),
        },
        (error, stdout, stderr) => {
          finish = async () => {
            if (!isNil(options.log))
              await writeFile(options.log, `${stdout}\n${stderr}`, {
                mode: 0o600,
                flag: 'wx',
              });
            const isExpectedAbort =
              options.shouldAllowAbort === true &&
              options.signal?.aborted === true &&
              error?.name === 'AbortError';
            if ((!isNil(error) && !isExpectedAbort) || hasInputFailed)
              throw new Error(`${tool}のlocal commandが失敗しました。`);
            return stdout;
          };
          settle();
        },
      );
    } catch {
      // spawn前の同期失敗には終了を待つ子プロセスが存在しない。
      fail();
      return;
    }
    const forceStop = () => {
      if (hasClosed || !isNil(child.exitCode) || !isNil(child.signalCode))
        return;
      try {
        // PID検索やprocess tree全体を使わず、自分が生成したhandleだけを停止する。
        child.kill('SIGKILL');
      } catch {
        // 終了を証明できなければPromiseを保留し、呼出元のlockを保持する。
      }
    };
    let graceTimer: ReturnType<typeof setTimeout> | undefined;
    const armForceStop = () => {
      graceTimer ??= setTimeout(forceStop, TERMINATION_GRACE_MS);
    };
    // execFileのtimeoutによるSIGTERM後も存続する子には追加の終了要求を送る。
    const deadlineTimer = setTimeout(
      forceStop,
      COMMAND_TIMEOUT_MS + TERMINATION_GRACE_MS,
    );
    options.signal?.addEventListener('abort', armForceStop, { once: true });
    if (options.signal?.aborted) armForceStop();
    child.once('close', () => {
      hasClosed = true;
      clearTimeout(deadlineTimer);
      if (!isNil(graceTimer)) clearTimeout(graceTimer);
      options.signal?.removeEventListener('abort', armForceStop);
      settle();
    });
    try {
      child.stdin?.end();
    } catch {
      hasInputFailed = true;
      try {
        child.kill('SIGTERM');
      } catch {
        // closeが届くまでcleanupへ進めない。
      }
      armForceStop();
    }
  });
};
