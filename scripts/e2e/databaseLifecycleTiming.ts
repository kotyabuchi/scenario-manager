import { isNil } from 'ramda';
import { z } from 'zod';

import { runLocalCommand } from './environmentCommands';
import { writeProgressStderr } from './progressStderr';

const DEADLINE_MS = 2_000;
const CLOCK_TOLERANCE_MS = 1_000;
const EVENT_PRECISION_MS = 1_000;
const MAX_EVENT_CHARACTERS = 131_072;
const MAX_EVENTS = 256;
const PROJECT_LABEL = 'com.supabase.cli.project';
const inspectSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  project: z.string(),
  created: z.string(),
  started: z.string(),
  status: z.enum([
    'created',
    'running',
    'paused',
    'restarting',
    'removing',
    'exited',
    'dead',
  ]),
  health: z.enum(['', 'starting', 'healthy', 'unhealthy']),
  restarts: z.number().int().nonnegative(),
});
const eventSchema = z.object({
  action: z.enum([
    'health_status: healthy',
    'health_status: unhealthy',
    'start',
    'restart',
    'die',
    'oom',
  ]),
  id: z.string(),
  name: z.string(),
  time: z.number().int().positive().safe(),
});
const collectOptionsSchema = z.object({
  databaseId: z.string().min(1),
  projectId: z.string().min(1),
  cwd: z.string(),
});
type CollectOptions = z.infer<typeof collectOptionsSchema> & {
  env: NodeJS.ProcessEnv;
  signal?: AbortSignal;
};

const countSchema = z.number().int().nonnegative().finite();
const durationSchema = z.number().nonnegative().finite();
const countsSchema = z.object({
  eventCount: countSchema,
  startCount: countSchema,
  restartCount: countSchema,
  restartEventCount: countSchema,
  dieCount: countSchema,
  oomCount: countSchema,
  healthyCount: countSchema,
});
const durationsSchema = countsSchema.extend({
  createdToStartedMs: durationSchema,
  invocationToCreatedMs: durationSchema,
  eventPrecisionMs: z.literal(EVENT_PRECISION_MS),
});
const outputSchema = z.discriminatedUnion('status', [
  z.object({
    status: z.enum([
      'clock-invalid',
      'ownership-mismatch',
      'timestamps-invalid',
      'collection-aborted',
      'collection-failed',
    ]),
  }),
  countsSchema.extend({ status: z.literal('lifecycle-ambiguous') }),
  durationsSchema.extend({ status: z.literal('healthy-unobserved') }),
  durationsSchema.extend({
    status: z.literal('healthy-observed'),
    startedToHealthyLowerMs: durationSchema,
    startedToHealthyUpperMs: durationSchema,
  }),
]);

const INSPECT_FORMAT = `{"id":{{json .Id}},"name":{{json .Name}},"project":{{json (index .Config.Labels "${PROJECT_LABEL}")}},"created":{{json .Created}},"started":{{json .State.StartedAt}},"status":{{json .State.Status}},"health":{{if .State.Health}}{{json .State.Health.Status}}{{else}}""{{end}},"restarts":{{json .RestartCount}}}`;
const EVENT_FORMAT =
  '{"action":{{json .Action}},"id":{{json .Actor.ID}},"name":{{json (index .Actor.Attributes "name")}},"time":{{json .Time}}}';

const parseTimestamp = (value: string) => {
  // DockerのRFC3339Nanoだけを受け付け、Date.parseの曖昧な日付補正を避ける。
  if (!z.iso.datetime({ offset: true }).safeParse(value).success)
    return undefined;
  const result = Date.parse(value);
  return Number.isFinite(result) && result > 0 ? result : undefined;
};

/** 所有確認済みDBの履歴を有限回だけ読み、秘密を含まない時間の観測を出力する。 */
export const createDatabaseLifecycleTiming = () => {
  const isEnabled =
    process.env.GITHUB_ACTIONS === 'true' || process.env.E2E_CLI_TIMING === '1';
  let startWall: number | undefined;
  let startMono: number | undefined;
  let finishWall: number | undefined;
  let finishMono: number | undefined;
  let hasStarted = false;
  let hasFinished = false;
  let hasCollected = false;
  const emit = (data: z.input<typeof outputSchema>) => {
    try {
      writeProgressStderr(
        `[supabase-db-lifecycle] ${JSON.stringify(outputSchema.parse(data))}\n`,
      );
    } catch {
      // 診断の出力先障害を本処理へ伝えない。
    }
  };
  return {
    start: () => {
      if (!isEnabled || hasStarted) return;
      hasStarted = true;
      try {
        startWall = Date.now();
        startMono = performance.now();
      } catch {
        startWall = undefined;
        startMono = undefined;
      }
    },
    finish: () => {
      if (!isEnabled || hasFinished) return;
      hasFinished = true;
      try {
        finishWall = Date.now();
        finishMono = performance.now();
      } catch {
        finishWall = undefined;
        finishMono = undefined;
      }
    },
    collect: async (options: CollectOptions): Promise<void> => {
      if (!isEnabled || hasCollected) return;
      hasCollected = true;
      if (
        isNil(startWall) ||
        isNil(startMono) ||
        isNil(finishWall) ||
        isNil(finishMono) ||
        ![startWall, startMono, finishWall, finishMono].every(
          Number.isFinite,
        ) ||
        finishWall < startWall ||
        finishMono < startMono ||
        Math.abs(finishWall - startWall - (finishMono - startMono)) >
          CLOCK_TOLERANCE_MS
      ) {
        emit({ status: 'clock-invalid' });
        return;
      }
      const windowStart = startWall;
      const windowEnd = finishWall;
      const controller = new AbortController();
      const abort = () => controller.abort();
      const timer = setTimeout(abort, DEADLINE_MS);
      options.signal?.addEventListener('abort', abort, { once: true });
      if (options.signal?.aborted === true) abort();
      try {
        const selected = collectOptionsSchema.parse(options);
        controller.signal.throwIfAborted();
        const commandOptions = {
          cwd: selected.cwd,
          env: options.env,
          signal: controller.signal,
        };
        const info = inspectSchema.parse(
          JSON.parse(
            await runLocalCommand(
              'docker',
              ['inspect', '--format', INSPECT_FORMAT, selected.databaseId],
              commandOptions,
            ),
          ),
        );
        controller.signal.throwIfAborted();
        if (
          info.id !== selected.databaseId ||
          info.name !== `/supabase_db_${selected.projectId}` ||
          info.project !== selected.projectId
        ) {
          emit({ status: 'ownership-mismatch' });
          return;
        }
        const eventsText = await runLocalCommand(
          'docker',
          [
            'events',
            '--since',
            new Date(windowStart - EVENT_PRECISION_MS).toISOString(),
            '--until',
            new Date(finishWall).toISOString(),
            '--filter',
            'type=container',
            '--filter',
            `container=${selected.databaseId}`,
            ...['health_status', 'start', 'restart', 'die', 'oom'].flatMap(
              (event) => ['--filter', `event=${event}`],
            ),
            '--format',
            EVENT_FORMAT,
          ],
          commandOptions,
        );
        controller.signal.throwIfAborted();
        if (eventsText.length > MAX_EVENT_CHARACTERS)
          throw new Error('oversized');
        const lines =
          eventsText.trim() === '' ? [] : eventsText.trim().split(/\r?\n/);
        if (lines.length > MAX_EVENTS) throw new Error('oversized');
        const events = lines.map((line) => eventSchema.parse(JSON.parse(line)));
        if (
          events.some(
            (event) =>
              event.id !== selected.databaseId ||
              event.name !== `supabase_db_${selected.projectId}`,
          )
        ) {
          emit({ status: 'ownership-mismatch' });
          return;
        }
        const created = parseTimestamp(info.created);
        const started = parseTimestamp(info.started);
        if (
          isNil(created) ||
          isNil(started) ||
          created < startWall ||
          started < created ||
          started > finishWall ||
          events.some(
            (event) =>
              event.time * EVENT_PRECISION_MS <
                windowStart - EVENT_PRECISION_MS ||
              event.time * EVENT_PRECISION_MS > windowEnd,
          )
        ) {
          emit({ status: 'timestamps-invalid' });
          return;
        }
        const healthy = events.filter(
          (event) => event.action === 'health_status: healthy',
        );
        const starts = events.filter((event) => event.action === 'start');
        // startイベントの発行はStartedAtより遅れ得るため、同一秒を要求しない。
        if (
          (starts.length === 1 &&
            starts.some(
              (event) =>
                event.time * EVENT_PRECISION_MS + EVENT_PRECISION_MS <= started,
            )) ||
          events.some(
            (event) =>
              event.time * EVENT_PRECISION_MS + EVENT_PRECISION_MS <= created,
          )
        ) {
          emit({ status: 'timestamps-invalid' });
          return;
        }
        const restarts = events.filter((event) => event.action === 'restart');
        const deaths = events.filter((event) => event.action === 'die');
        const ooms = events.filter((event) => event.action === 'oom');
        const counts = {
          eventCount: events.length,
          startCount: starts.length,
          restartCount: info.restarts,
          restartEventCount: restarts.length,
          dieCount: deaths.length,
          oomCount: ooms.length,
          healthyCount: healthy.length,
        };
        if (
          info.restarts > 0 ||
          starts.length > 1 ||
          restarts.length > 0 ||
          deaths.length > 0 ||
          ooms.length > 0 ||
          healthy.length > 1
        ) {
          emit({ status: 'lifecycle-ambiguous', ...counts });
          return;
        }
        const common = {
          ...counts,
          createdToStartedMs: started - created,
          invocationToCreatedMs: created - startWall,
          eventPrecisionMs: EVENT_PRECISION_MS,
        } satisfies z.infer<typeof durationsSchema>;
        const firstHealthy = healthy[0];
        if (isNil(firstHealthy)) {
          // 履歴はdaemon全体で直近256件。欠落から不健康やCLI失敗を推測しない。
          emit({ status: 'healthy-unobserved', ...common });
          return;
        }
        const healthyAt = firstHealthy.time * EVENT_PRECISION_MS;
        if (healthyAt + EVENT_PRECISION_MS <= started) {
          emit({ status: 'timestamps-invalid' });
          return;
        }
        // eventは秒精度なので点推定せず、切り捨て誤差を含む区間を公開する。
        emit({
          status: 'healthy-observed',
          ...common,
          startedToHealthyLowerMs: Math.max(0, healthyAt - started),
          startedToHealthyUpperMs:
            Math.min(finishWall, healthyAt + EVENT_PRECISION_MS) - started,
        });
      } catch {
        emit({
          status: controller.signal.aborted
            ? 'collection-aborted'
            : 'collection-failed',
        });
      } finally {
        clearTimeout(timer);
        options.signal?.removeEventListener('abort', abort);
      }
    },
  };
};
