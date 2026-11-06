import { isNil } from 'ramda';

import { spawn } from 'node:child_process';
import { open } from 'node:fs/promises';
import { setTimeout as delay } from 'node:timers/promises';

import type { FileHandle } from 'node:fs/promises';
import type { SurfaceReplayDiagnostic } from './surfaceReplayFailure';

const COMMAND_TIMEOUT_MS = 8 * 60_000;
const STOP_GRACE_MS = 3_000;
const NATURAL_EXIT_GRACE_MS = 250;
const GROUP_POLL_MS = 50;

/** 終了を証明できない子の所有directoryを消さないための区分。 */
export class UnsettledSurfaceReplayProcess extends Error {}

type ProcessFailure = Exclude<
  SurfaceReplayDiagnostic['processFailure'],
  'group-unsettled'
>;
type StopReason = Extract<ProcessFailure, 'aborted' | 'timeout'>;
const PROCESS_FAILURE_MESSAGES = {
  'spawn-error': '歴史再生の子processを起動できませんでした。',
  'exit-failed': '歴史再生の子processが失敗しました。',
  'descendants-remained': '歴史再生の子孫processが残っていました。',
  timeout: '歴史再生の子processを中断しました。',
  aborted: '歴史再生の子processを中断しました。',
} satisfies Record<ProcessFailure, string>;

/** OSやコマンドの生エラーを公開せず、失敗の区分を再生側へ渡す。 */
export class SurfaceReplayProcessError extends Error {
  constructor(readonly processFailure: ProcessFailure) {
    super(PROCESS_FAILURE_MESSAGES[processFailure]);
  }
}

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

const hasRemainingGroupAfterGrace = async (
  pid: number,
  cancelled: Promise<'cancelled'>,
) => {
  const deadline = performance.now() + NATURAL_EXIT_GRACE_MS;
  while (signalGroup(pid, 0)) {
    const remaining = deadline - performance.now();
    if (remaining <= 0) return true;
    const outcome = await Promise.race([
      delay(Math.min(remaining, GROUP_POLL_MS)),
      cancelled,
    ]);
    if (outcome === 'cancelled') return true;
  }
  return false;
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
  if (options.signal?.aborted) throw new SurfaceReplayProcessError('aborted');
  const log = await open(options.log, 'wx', 0o600);
  let stdout: FileHandle | undefined;
  const closeFiles = async () => {
    const closed = await Promise.allSettled([log.close(), stdout?.close()]);
    const closeFailure = closed.find(({ status }) => status === 'rejected');
    if (closeFailure?.status === 'rejected') throw closeFailure.reason;
  };
  try {
    if (!isNil(options.stdoutFile))
      stdout = await open(options.stdoutFile, 'wx', 0o600);
    let child: ReturnType<typeof spawn>;
    try {
      child = spawn(executable, args, {
        cwd: options.cwd,
        env: options.env,
        detached: true,
        stdio: ['ignore', stdout?.fd ?? log.fd, log.fd],
      });
    } catch {
      throw new SurfaceReplayProcessError('spawn-error');
    }
    const pid = child.pid;
    let spawnFailed = false;
    child.once('error', () => {
      spawnFailed = true;
    });
    const closed = new Promise<number | null>((resolve) => {
      child.once('close', resolve);
    });
    let stop: ((reason: StopReason) => void) | undefined;
    let stopReason: StopReason | undefined;
    const cancelled = new Promise<'cancelled'>((resolve) => {
      stop = (reason) => {
        stopReason ??= reason;
        resolve('cancelled');
      };
    });
    const timeout = setTimeout(() => stop?.('timeout'), COMMAND_TIMEOUT_MS);
    const abort = () => stop?.('aborted');
    options.signal?.addEventListener('abort', abort, { once: true });
    if (options.signal?.aborted) abort();
    try {
      const outcome = await Promise.race([closed, cancelled]);
      let hasRemainingGroup = false;
      if (isNil(stopReason) && !isNil(pid)) {
        // 正常終了直後だけ、同じグループの子孫が自発終了する時間を設ける。
        hasRemainingGroup =
          !spawnFailed && outcome === 0
            ? await hasRemainingGroupAfterGrace(pid, cancelled)
            : signalGroup(pid, 0);
      }
      if (!isNil(stopReason)) {
        if (!isNil(pid)) await stopRemainingGroup(pid);
        const confirmed = await Promise.race([
          closed.then(() => true),
          delay(STOP_GRACE_MS, false, { ref: false }),
        ]);
        if (!confirmed)
          throw new UnsettledSurfaceReplayProcess(
            '歴史再生の子processの終了を確認できません。',
          );
        throw new SurfaceReplayProcessError(stopReason);
      }
      if (!isNil(pid) && hasRemainingGroup) {
        await stopRemainingGroup(pid);
        throw new SurfaceReplayProcessError('descendants-remained');
      }
      if (spawnFailed) throw new SurfaceReplayProcessError('spawn-error');
      if (outcome !== 0) throw new SurfaceReplayProcessError('exit-failed');
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
