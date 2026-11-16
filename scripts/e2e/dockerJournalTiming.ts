import { isNil } from 'ramda';

import { readBoundedDiagnosticChild } from './boundedDiagnosticChild';
import { writeProgressStderr } from './progressStderr';

const MAX_LINES = 512;
const MAX_LINE = 16 * 1024;
const CLOCK_TOLERANCE_MS = 1_000;
const MAX_WINDOW_MS = 30 * 60 * 1000;
type Kind =
  | 'layer-init-error'
  | 'layer-checksum-error'
  | 'download-retrying'
  | 'download-failed'
  | 'pull-next-endpoint'
  | 'pull-not-continuing';
type Event = { kind: Kind; elapsedMs: number; attribution: 'unattributed' };

/** logrusのmsgだけを取り、error等の別フィールドを分類対象にしない。 */
const outerMessage = (message: string) => {
  if (!/^[A-Za-z_][A-Za-z0-9_.-]*=/.test(message)) return message;
  const fields = [
    ...message.matchAll(
      /(?:^|\s)([A-Za-z_][A-Za-z0-9_.-]*)=(?:"((?:\\.|[^"\\])*)"|(\S+))/g,
    ),
  ];
  const matches = fields.filter((field) => field[1] === 'msg');
  if (matches.length !== 1) return '';
  return matches[0]?.[2] ?? matches[0]?.[3] ?? '';
};

/** journal本文は外部に返さず、固定のdaemon log分類だけに縮約する。 */
export const classifyDockerJournal = (
  output: string,
  start: number,
  end: number,
) => {
  const lines = output.split('\n').filter(Boolean);
  if (lines.length === 0 || lines.length > MAX_LINES) return null;
  const events: Event[] = [];
  for (const line of lines) {
    if (Buffer.byteLength(line) > MAX_LINE) return null;
    let row: unknown;
    try {
      row = JSON.parse(line);
    } catch {
      return null;
    }
    if (typeof row !== 'object' || isNil(row)) return null;
    const unit: unknown = Reflect.get(row, '_SYSTEMD_UNIT');
    const stamp: unknown = Reflect.get(row, '__REALTIME_TIMESTAMP');
    const message: unknown = Reflect.get(row, 'MESSAGE');
    if (
      unit !== 'docker.service' ||
      typeof stamp !== 'string' ||
      !/^\d{1,20}$/.test(stamp) ||
      typeof message !== 'string'
    )
      return null;
    const timestamp = Number(BigInt(stamp) / BigInt(1000));
    if (
      !Number.isSafeInteger(timestamp) ||
      timestamp < start ||
      timestamp > end
    )
      continue;
    const outer = outerMessage(message);
    let kind: Kind | undefined;
    if (/^Attempting next endpoint for pull after error: /.test(outer))
      kind = 'pull-next-endpoint';
    else if (outer === 'Not continuing with pull after error')
      kind = 'pull-not-continuing';
    else if (/\bError initiating layer download:/.test(outer))
      kind = 'layer-init-error';
    else if (/\bfilesystem layer verification failed for digest\b/.test(outer))
      kind = 'layer-checksum-error';
    else if (
      /\bDownload failed, retrying \([1-9]\d{0,2}\/[1-9]\d{0,2}\):/.test(outer)
    )
      kind = 'download-retrying';
    else if (/\bDownload failed after [1-9]\d{0,2} attempts:/.test(outer))
      kind = 'download-failed';
    if (kind)
      events.push({
        kind,
        elapsedMs: timestamp - start,
        attribution: 'unattributed',
      });
  }
  return events;
};

/** 同じowned startの窓のみを事後に読み、元の起動/cleanupから例外を隔離する。 */
export const createDockerJournalTiming = (options: {
  signal: AbortSignal;
  platform?: NodeJS.Platform;
}) => {
  const enabled =
    (options.platform ?? process.platform) === 'linux' &&
    process.env.GITHUB_ACTIONS === 'true';
  let startWall: number | null = null;
  let startMono: number | null = null;
  let endWall: number | null = null;
  let endMono: number | null = null;
  let finished = false;
  const point = () => {
    const wall = Date.now();
    const mono = performance.now();
    return Number.isSafeInteger(wall) &&
      wall > 0 &&
      Number.isFinite(mono) &&
      mono >= 0
      ? { wall, mono }
      : null;
  };
  return {
    start: () => {
      if (!enabled) return;
      try {
        const p = point();
        startWall = p?.wall ?? null;
        startMono = p?.mono ?? null;
      } catch {}
    },
    onClose: () => {
      if (!enabled || !isNil(endWall)) return;
      try {
        const p = point();
        endWall = p?.wall ?? null;
        endMono = p?.mono ?? null;
      } catch {}
    },
    finish: async () => {
      if (!enabled || finished) return;
      finished = true;
      let status: 'observed' | 'unknown' = 'unknown';
      let events: Event[] | null = null;
      let begin: number | null = null;
      try {
        begin = performance.now();
        if (
          isNil(startWall) ||
          isNil(startMono) ||
          isNil(endWall) ||
          isNil(endMono) ||
          options.signal.aborted ||
          endWall < startWall ||
          endMono < startMono ||
          endWall - startWall > MAX_WINDOW_MS ||
          Math.abs(endWall - startWall - (endMono - startMono)) >
            CLOCK_TOLERANCE_MS
        )
          return;
        const start = startWall;
        const end = endWall;
        const { completion } = readBoundedDiagnosticChild(
          '/usr/bin/journalctl',
          [
            '--no-pager',
            '--quiet',
            '--boot=0',
            '--unit=docker.service',
            '--output=json',
            `--since=@${Math.floor(start / 1000)}`,
            `--until=@${Math.ceil(end / 1000)}`,
            `--lines=${MAX_LINES + 1}`,
          ],
          options.signal,
        );
        const result = await completion;
        if (!isNil(result)) {
          events = classifyDockerJournal(result, start, end);
          if (!isNil(events)) status = 'observed';
        }
      } catch {
        // 未取得はunknownであり、実行結果を変更しない。
      } finally {
        try {
          const durationMs = isNil(begin)
            ? null
            : Math.round(performance.now() - begin);
          writeProgressStderr(
            `[supabase-docker-journal] ${JSON.stringify({ version: 1, status, durationMs: Number.isSafeInteger(durationMs) && !isNil(durationMs) && durationMs >= 0 ? durationMs : null, attribution: 'unattributed', events })}\n`,
          );
        } catch {}
      }
    },
  };
};
