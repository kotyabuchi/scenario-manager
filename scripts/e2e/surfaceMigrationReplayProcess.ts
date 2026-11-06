import { spawn } from 'node:child_process';
import { open } from 'node:fs/promises';
import { setTimeout as delay } from 'node:timers/promises';

import type { FileHandle } from 'node:fs/promises';

const COMMAND_TIMEOUT_MS = 8 * 60_000;
const STOP_GRACE_MS = 3_000;
const GROUP_POLL_MS = 50;

/** 終了を証明できない子の所有directoryを消さないための区分。 */
export class UnsettledSurfaceReplayProcess extends Error {}

const signalGroup = (pid: number, signal: NodeJS.Signals | 0) => {
  try {
    return process.kill(-pid, signal);
  } catch (error) {
    if (error instanceof Error && 'code' in error && error.code === 'ESRCH')
      return false;
    throw new UnsettledSurfaceReplayProcess(
      '歴史再生のprocess群を確認できません。',
    );
  }
};

const stopRemainingGroup = async (pid: number) => {
  for (const signal of ['SIGTERM', 'SIGKILL'] as const) {
    if (!signalGroup(pid, signal)) return;
    const deadline = performance.now() + STOP_GRACE_MS;
    while (performance.now() < deadline) {
      if (!signalGroup(pid, 0)) return;
      await delay(GROUP_POLL_MS);
    }
  }
  if (signalGroup(pid, 0))
    throw new UnsettledSurfaceReplayProcess(
      '歴史再生のprocess群が終了していません。',
    );
};

/** Linuxの所有process群を待ち、終了が確認できた場合だけ成功を返す。 */
export const runSurfaceReplayProcess = async (
  executable: string,
  args: readonly string[],
  options: {
    cwd: string;
    env: NodeJS.ProcessEnv;
    log: string;
    stdoutFile?: string;
    signal?: AbortSignal;
  },
) => {
  options.signal?.throwIfAborted();
  const log = await open(options.log, 'wx', 0o600);
  let stdout: FileHandle | undefined;
  const closeFiles = async () => {
    const closed = await Promise.allSettled([log.close(), stdout?.close()]);
    const closeFailure = closed.find(({ status }) => status === 'rejected');
    if (closeFailure?.status === 'rejected') throw closeFailure.reason;
  };
  try {
    if (options.stdoutFile !== undefined)
      stdout = await open(options.stdoutFile, 'wx', 0o600);
    const child = spawn(executable, args, {
      cwd: options.cwd,
      env: options.env,
      detached: true,
      stdio: ['ignore', stdout?.fd ?? log.fd, log.fd],
    });
    const pid = child.pid;
    let spawnFailed = false;
    child.once('error', () => {
      spawnFailed = true;
    });
    const closed = new Promise<number | null>((resolve) => {
      child.once('close', resolve);
    });
    let stop: (() => void) | undefined;
    const cancelled = new Promise<'cancelled'>((resolve) => {
      stop = () => resolve('cancelled');
    });
    const timeout = setTimeout(() => stop?.(), COMMAND_TIMEOUT_MS);
    const abort = () => stop?.();
    options.signal?.addEventListener('abort', abort, { once: true });
    if (options.signal?.aborted) abort();
    try {
      const outcome = await Promise.race([closed, cancelled]);
      if (outcome === 'cancelled') {
        if (pid !== undefined) await stopRemainingGroup(pid);
        const confirmed = await Promise.race([
          closed.then(() => true),
          delay(STOP_GRACE_MS, false, { ref: false }),
        ]);
        if (!confirmed)
          throw new UnsettledSurfaceReplayProcess(
            '歴史再生の子processの終了を確認できません。',
          );
        throw new Error('歴史再生の子processを中断しました。');
      }
      if (pid !== undefined && signalGroup(pid, 0)) {
        await stopRemainingGroup(pid);
        throw new Error('歴史再生の子孫processが残っていました。');
      }
      if (spawnFailed || outcome !== 0)
        throw new Error('歴史再生の子processが失敗しました。');
    } finally {
      clearTimeout(timeout);
      options.signal?.removeEventListener('abort', abort);
      child.unref();
    }
  } catch (error) {
    // 終了未確認の判定を、logを閉じる際の別エラーで上書きしない。
    await closeFiles().catch(() => {});
    throw error;
  }
  await closeFiles();
};
