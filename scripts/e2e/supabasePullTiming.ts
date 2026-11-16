import { isNil } from 'ramda';
import { z } from 'zod';

import { writeProgressStderr } from './progressStderr';

const MAX_LAYERS = 1024;
const MAX_COUNT = 1_000_000;
const MAX_LINE_CHARACTERS = 2048;
const ROLES = [
  'postgres',
  'kong',
  'postgrest',
  'gotrue',
  'storage-api',
] as const;
const STATES = [
  'Downloading',
  'Download complete',
  'Extracting',
  'Pull complete',
  'Already exists',
  'Pulling fs layer',
  'Waiting',
  'Verifying Checksum',
] as const;
const failureSchema = z.enum([
  'registry-auth',
  'rate-limit',
  'network',
  'other',
]);
const stateSchema = z.enum(STATES);
const stageSchema = z.enum([
  'Pulling',
  'Pulled',
  'cached',
  'Error',
  'retry-4s',
  'retry-8s',
]);
const windowSchema = z.object({
  count: z.number().int().nonnegative(),
  firstObservedMs: z.number().nonnegative().nullable(),
  lastObservedMs: z.number().nonnegative().nullable(),
});
const contextSchema = z.object({
  format: z.enum(['compose', 'fallback']),
  phase: z.enum(['before-database', 'after-database']),
  layers: z.array(windowSchema.extend({ state: stateSchema })),
  images: z.array(
    windowSchema.extend({ role: z.enum(ROLES), stage: stageSchema }),
  ),
  failures: z.array(
    z.object({ kind: failureSchema, count: z.number().int().nonnegative() }),
  ),
  downloadStartMissing: z.boolean(),
  extractStartMissing: z.boolean(),
});
export const supabasePullTimingSchema = z.object({
  version: z.literal(1),
  measurement: z.literal('observed-windows-only'),
  imageLayerAttribution: z.literal('unavailable'),
  contexts: z.array(contextSchema),
  layerLimitReached: z.boolean(),
  countLimitReached: z.boolean(),
});
type PullState = z.infer<typeof stateSchema>;
type PullContext = z.infer<typeof contextSchema>;
type ObservationWindow = z.infer<typeof windowSchema>;

const rolePattern = ROLES.join('|');
// Composeのcached行はmap key、Pulling/Pulled行はServiceConfig.Nameを使う。
const SERVICE_ROLES = {
  db: 'postgres',
  gateway: 'kong',
  api: 'postgrest',
  auth: 'gotrue',
  storage: 'storage-api',
} as const;
const servicePattern = Object.keys(SERVICE_ROLES).join('|');
const resolveRole = (value: unknown) => {
  if (typeof value === 'string' && Object.hasOwn(SERVICE_ROLES, value)) {
    for (const [service, role] of Object.entries(SERVICE_ROLES)) {
      if (service === value) return z.enum(ROLES).safeParse(role);
    }
  }
  return z.enum(ROLES).safeParse(value);
};
const statePattern = STATES.join('|');
const imagePattern = new RegExp(
  `^(${rolePattern}|${servicePattern}) (Pulling|Pulled|Skipped - Image is already present locally|Error)(?: (.*))?$`,
);
const retryPattern = new RegExp(
  `^Retrying after (4|8)s: (?:public\\.ecr\\.aws/supabase/|ghcr\\.io/supabase/|supabase/)?(${rolePattern}):[A-Za-z0-9._-]+$`,
);
const layerPattern = new RegExp(
  `^([a-f0-9]{12,64})(:)? (${statePattern})(?: (.*))?$`,
);
const progressPattern =
  /^(?:\[[=> ]+\]\s+)?\d+(?:\.\d+)?(?:B|kB|MB|GB|TB)(?:\/\d+(?:\.\d+)?(?:B|kB|MB|GB|TB))?(?:\s+\d+(?:ms|s|m|h)(?:\d+(?:ms|s|m|h))*)?$/;
const databasePattern = /^Starting database(?: from backup)?\.\.\.$/;
const fallbackPattern = new RegExp(
  `^[A-Za-z0-9._-]+: Pulling from (?:supabase/)?(${rolePattern})$`,
);

const parseLine = (line: string) => {
  if (line.length > MAX_LINE_CHARACTERS) return;
  if (databasePattern.test(line)) return { kind: 'database' as const };
  const retry = retryPattern.exec(line);
  if (!isNil(retry)) {
    const role = z.enum(ROLES).safeParse(retry[2]);
    if (role.success)
      return {
        kind: 'image' as const,
        role: role.data,
        stage: retry[1] === '4' ? ('retry-4s' as const) : ('retry-8s' as const),
        format: 'fallback' as const,
      };
  }
  // fallbackの先頭はtag、本文はrepository。後続layerとの対応は推測しない。
  const fallback = fallbackPattern.exec(line);
  if (!isNil(fallback)) {
    const role = resolveRole(fallback[1]);
    if (role.success)
      return {
        kind: 'image' as const,
        role: role.data,
        stage: 'Pulling' as const,
        format: 'fallback' as const,
      };
  }
  const image = imagePattern.exec(line);
  if (!isNil(image)) {
    const role = resolveRole(image[1]);
    const stage = stageSchema.safeParse(
      image[2]?.startsWith('Skipped') ? 'cached' : image[2],
    );
    if (!role.success || !stage.success) return;
    const suffix = image[3] ?? '';
    if (stage.data !== 'Error' && suffix !== '') return;
    const failure =
      stage.data === 'Error'
        ? /unauthorized|authentication required|denied/i.test(suffix)
          ? ('registry-auth' as const)
          : /toomanyrequests|too many requests|rate limit/i.test(suffix)
            ? ('rate-limit' as const)
            : /timeout|timed out|connection|network|no such host/i.test(suffix)
              ? ('network' as const)
              : ('other' as const)
        : undefined;
    return {
      kind: 'image' as const,
      role: role.data,
      stage: stage.data,
      format: 'compose' as const,
      failure,
    };
  }
  const layer = layerPattern.exec(line);
  if (isNil(layer)) return;
  const state = stateSchema.safeParse(layer[3]);
  const suffix = layer[4] ?? '';
  if (!state.success || (suffix !== '' && !progressPattern.test(suffix)))
    return;
  return {
    kind: 'layer' as const,
    id: layer[1] ?? '',
    state: state.data,
    format: layer[2] === ':' ? ('fallback' as const) : ('compose' as const),
  };
};

const emptyWindow = (): ObservationWindow => ({
  count: 0,
  firstObservedMs: null,
  lastObservedMs: null,
});

/** 同一起動の表示だけを集計する。区間は並行し得るため加算せず、image別の正確な取得・展開時間とは扱わない。 */
export const createSupabasePullTiming = () => {
  const contexts: PullContext[] = [];
  const layers = new Map<string, Set<PullState>>();
  let phase: PullContext['phase'] = 'before-database';
  let layerLimitReached = false;
  let countLimitReached = false;
  let isClosed = false;
  const increment = (value: number) => {
    if (value >= MAX_COUNT) {
      countLimitReached = true;
      return value;
    }
    return value + 1;
  };
  const record = (window: ObservationWindow, elapsedMs: number) => {
    window.count = increment(window.count);
    window.firstObservedMs ??= elapsedMs;
    window.lastObservedMs = elapsedMs;
  };
  return {
    matchesLine: (line: string) => {
      const event = parseLine(line);
      return !isNil(event) && event.kind !== 'database';
    },
    observeLine: (line: string, elapsedMs: number) => {
      try {
        if (isClosed || !Number.isFinite(elapsedMs) || elapsedMs < 0) return;
        const event = parseLine(line);
        if (isNil(event)) return;
        if (event.kind === 'database') {
          phase = 'after-database';
          return;
        }
        let context = contexts.find(
          (value) => value.format === event.format && value.phase === phase,
        );
        if (isNil(context)) {
          context = {
            format: event.format,
            phase,
            layers: [],
            images: [],
            failures: [],
            downloadStartMissing: false,
            extractStartMissing: false,
          };
          contexts.push(context);
        }
        if (event.kind === 'image') {
          let window = context.images.find(
            (value) => value.role === event.role && value.stage === event.stage,
          );
          if (isNil(window)) {
            window = { role: event.role, stage: event.stage, ...emptyWindow() };
            context.images.push(window);
          }
          record(window, elapsedMs);
          if ('failure' in event && !isNil(event.failure)) {
            let failure = context.failures.find(
              (value) => value.kind === event.failure,
            );
            if (isNil(failure)) {
              failure = { kind: event.failure, count: 0 };
              context.failures.push(failure);
            }
            failure.count = increment(failure.count);
          }
          return;
        }
        // 同じIDでも表示形式・database前後を跨いだ状態は別観測として数える。
        const key = `${event.format}:${phase}:${event.id}`;
        let seen = layers.get(key);
        if (isNil(seen)) {
          if (layers.size >= MAX_LAYERS) {
            layerLimitReached = true;
            return;
          }
          seen = new Set<PullState>();
          layers.set(key, seen);
        }
        if (event.state === 'Download complete' && !seen.has('Downloading'))
          context.downloadStartMissing = true;
        if (event.state === 'Pull complete' && !seen.has('Extracting'))
          context.extractStartMissing = true;
        let window = context.layers.find(
          (value) => value.state === event.state,
        );
        if (isNil(window)) {
          window = { state: event.state, ...emptyWindow() };
          context.layers.push(window);
        }
        // 件数は状態ごとのlayer数。更新行は区間だけを広げる。
        if (!seen.has(event.state)) window.count = increment(window.count);
        seen.add(event.state);
        window.firstObservedMs ??= elapsedMs;
        window.lastObservedMs = elapsedMs;
      } catch {
        // 診断の失敗を本来の起動処理へ伝えない。
      }
    },
    close: () => {
      if (isClosed) return;
      isClosed = true;
      try {
        if (contexts.length === 0) return;
        const summary = supabasePullTimingSchema.parse({
          version: 1,
          measurement: 'observed-windows-only',
          imageLayerAttribution: 'unavailable',
          contexts,
          layerLimitReached,
          countLimitReached,
        });
        writeProgressStderr(
          `[supabase-pull-timing] ${JSON.stringify(summary)}\n`,
        );
      } catch {
        // 出力先とスキーマ検査の例外を隔離する。
      } finally {
        layers.clear();
      }
    },
  };
};
