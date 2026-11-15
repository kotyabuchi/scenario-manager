import { isNil } from 'ramda';
import { z } from 'zod';

import { runLocalCommand } from './environmentCommands';
import { writeProgressStderr } from './progressStderr';

import { join } from 'node:path';

const DEADLINE_MS = 2_000;
const MAX_OUTPUT = 8_192;
const decimal = z.string().regex(/^\d{1,20}$/);
const snapshotSchema = z.strictObject({
  cpu: z
    .strictObject({
      fields: z.array(decimal).length(8),
      ids: z
        .array(decimal)
        .min(1)
        .max(4096)
        .refine((ids) => new Set(ids).size === ids.length),
    })
    .nullable(),
  io: z
    .strictObject({ some: decimal.nullable(), full: decimal.nullable() })
    .nullable(),
});
type Snapshot = z.infer<typeof snapshotSchema>;
type ReadResult = {
  startMs: number;
  endMs: number;
  data: Snapshot | null;
  status: 'observed' | 'timeout' | 'cancelled' | 'invalid' | 'unavailable';
};

const delta = (
  before: string | null | undefined,
  after: string | null | undefined,
) => {
  if (isNil(before) || isNil(after)) return null;
  const value = BigInt(after) - BigInt(before);
  if (value < 0 || value > BigInt(Number.MAX_SAFE_INTEGER)) return null;
  return Number(value);
};

/** 固定procの2点を所有childで読み、全host窓の差分だけを診断出力する。 */
export const createHostPressureTiming = (options: {
  root: string;
  cwd: string;
  env: NodeJS.ProcessEnv;
  signal: AbortSignal;
  platform?: NodeJS.Platform;
}) => {
  const enabled =
    (options.platform ?? process.platform) === 'linux' &&
    (process.env.GITHUB_ACTIONS === 'true' ||
      process.env.E2E_CLI_TIMING === '1');
  let before: ReadResult | null = null;
  let startMs: number | null = null;
  let closeMs: number | null = null;
  let hasClosed = false;
  let finished = false;
  const now = () => {
    try {
      const value = performance.now();
      return Number.isFinite(value) && value >= 0 ? value : null;
    } catch {
      return null;
    }
  };
  const read = async (): Promise<ReadResult | null> => {
    const start = now();
    if (isNil(start) || options.signal.aborted) return null;
    const controller = new AbortController();
    const abort = () => controller.abort();
    let timedOut = false;
    const timer = setTimeout(() => {
      timedOut = true;
      abort();
    }, DEADLINE_MS);
    options.signal.addEventListener('abort', abort, { once: true });
    if (options.signal.aborted) abort();
    let data: Snapshot | null = null;
    let status: ReadResult['status'] = 'unavailable';
    try {
      const result = await runLocalCommand(
        'node',
        [join(options.root, 'scripts/e2e/hostPressureReader.mjs')],
        { cwd: options.cwd, env: options.env, signal: controller.signal },
      );
      if (
        !controller.signal.aborted &&
        Buffer.byteLength(result) <= MAX_OUTPUT
      ) {
        status = 'invalid';
        const parsed = snapshotSchema.safeParse(JSON.parse(result));
        if (parsed.success) {
          data = parsed.data;
          status = 'observed';
        } else status = 'invalid';
      } else if (!controller.signal.aborted) {
        status = 'invalid';
      }
    } catch {
      // 未取得を成功値へ変換せず、元の起動やcleanupに伝えない。
    } finally {
      clearTimeout(timer);
      options.signal.removeEventListener('abort', abort);
    }
    if (controller.signal.aborted) status = timedOut ? 'timeout' : 'cancelled';
    const end = now();
    return isNil(end) || end < start
      ? null
      : { startMs: start, endMs: end, data, status };
  };
  return {
    prepare: async () => {
      if (enabled) {
        try {
          before = await read();
        } catch {
          before = null;
        }
      }
    },
    start: () => {
      if (enabled) startMs = now();
    },
    onClose: () => {
      if (!enabled || hasClosed) return;
      hasClosed = true;
      try {
        closeMs = now();
      } catch {
        closeMs = null;
      }
    },
    finish: async () => {
      if (!enabled || finished) return;
      finished = true;
      try {
        const post = hasClosed ? await read().catch(() => null) : null;
        const valid =
          !isNil(before) &&
          !isNil(post) &&
          !isNil(startMs) &&
          !isNil(closeMs) &&
          before.endMs <= startMs &&
          startMs <= closeMs &&
          closeMs <= post.startMs &&
          post.startMs <= post.endMs;
        const a = valid && !isNil(before) ? before.data : null;
        const b = valid && !isNil(post) ? post.data : null;
        let cpu: number[] | null = null;
        if (
          !isNil(a?.cpu) &&
          !isNil(b?.cpu) &&
          JSON.stringify(a.cpu.ids) === JSON.stringify(b.cpu.ids)
        ) {
          const values = a.cpu.fields.map((value, index) =>
            delta(value, b.cpu?.fields[index]),
          );
          if (values.every((value): value is number => !isNil(value)))
            cpu = values;
        }
        const some = delta(a?.io?.some, b?.io?.some);
        const full = delta(a?.io?.full, b?.io?.full);
        const relative = (value: number | null) =>
          isNil(value) || isNil(startMs) ? null : Math.round(value - startMs);
        writeProgressStderr(
          `[supabase-host-pressure] ${JSON.stringify({ version: 1, status: !valid ? 'unknown' : isNil(cpu) || isNil(some) || isNil(full) ? 'partial' : 'observed', startMs: relative(startMs), closeMs: relative(closeMs), before: isNil(before) ? null : { startMs: relative(before.startMs), endMs: relative(before.endMs), status: before.status }, after: isNil(post) ? null : { startMs: relative(post.startMs), endMs: relative(post.endMs), status: post.status }, cpuTicks: cpu, ioSomeUs: some, ioFullUs: full })}\n`,
        );
      } catch {
        // 診断のみの失敗は環境の結果を変えない。
      }
    },
  };
};
