import { aggregateCiVerification } from './ciAggregate';
import { writeCiArtifact } from './ciContext';
import { advanceCiProgress, createCiFailure } from './ciDiagnostics';
import { ciShardIdSchema } from './ciPartitionSchema';
import { planCiVerification } from './ciPlan';
import { runCiShard } from './ciShard';
import { writeProgressStderr } from './progressStderr';
import { readSurfaceReplayDiagnostic } from './surfaceReplayFailure';

import { closeSync, constants, openSync, writeFileSync } from 'node:fs';
import { realpath } from 'node:fs/promises';
import { availableParallelism } from 'node:os';
import { pathToFileURL } from 'node:url';

import type { CiJob, CiProgress, CiProgressUpdate } from './ciDiagnostics';

const identifyJob = (args: string[]): CiJob | null => {
  const [command, shard] = args;
  if (args.length === 1 && (command === 'plan' || command === 'aggregate'))
    return command;
  if (args.length === 2 && command === 'shard') {
    const id = ciShardIdSchema.safeParse(shard);
    if (id.success) return id.data;
  }
  return null;
};

const markDiagnosticWritten = (env: NodeJS.ProcessEnv) => {
  const output = env.GITHUB_OUTPUT;
  if (env.GITHUB_ACTIONS !== 'true' || !output) return;
  const fd = openSync(
    output,
    constants.O_WRONLY | constants.O_APPEND | (constants.O_NOFOLLOW ?? 0),
  );
  try {
    writeFileSync(fd, 'diagnostic_written=true\n');
  } finally {
    closeSync(fd);
  }
};

/** CLI自身は成果物を判定せず、同じ共通checkerを各jobから呼ぶ。 */
export const runCiCli = async (
  args: string[],
  root: string,
  env: NodeJS.ProcessEnv,
) => {
  const job = identifyJob(args);
  let progress: CiProgressUpdate = { phase: job ? 'context' : 'arguments' };
  const shouldLogTiming = job === 'plan' && env.GITHUB_ACTIONS === 'true';
  let phaseStartedAt = performance.now();
  const writeTimingSpan = (endedAt: number) => {
    // 品質チェックの区間にはログ保存と入力checkpointも含まれる。
    const timing = {
      phase: progress.phase,
      qualityCheck: progress.qualityCheck,
      elapsedMs: Math.round(endedAt - phaseStartedAt),
    };
    writeProgressStderr(`[ci-timing] ${JSON.stringify(timing)}\n`);
  };
  if (shouldLogTiming) {
    const timing = { availableParallelism: availableParallelism() };
    writeProgressStderr(`[ci-timing] ${JSON.stringify(timing)}\n`);
  }
  const onProgress: CiProgress = (update) => {
    const next = advanceCiProgress(progress, update);
    if (
      shouldLogTiming &&
      (next.phase !== progress.phase ||
        next.qualityCheck !== progress.qualityCheck)
    ) {
      const now = performance.now();
      writeTimingSpan(now);
      phaseStartedAt = now;
    }
    progress = next;
  };
  if (!job) return createCiFailure({ job, progress, env, interrupted: false });

  const controller = new AbortController();
  const interrupt = () => controller.abort();
  let directory: string | undefined;
  process.once('SIGINT', interrupt);
  process.once('SIGTERM', interrupt);
  try {
    directory = await realpath(root);
    if (job === 'plan')
      return await planCiVerification(
        directory,
        env,
        controller.signal,
        onProgress,
      );
    if (job === 'aggregate')
      return await aggregateCiVerification(
        directory,
        env,
        controller.signal,
        onProgress,
      );
    return await runCiShard(directory, env, job, controller.signal, onProgress);
  } catch (error) {
    const report = createCiFailure({
      job,
      progress,
      env,
      interrupted: controller.signal.aborted,
      surfaceReplay: readSurfaceReplayDiagnostic(error),
    });
    if (directory) {
      try {
        writeCiArtifact(directory, `${job}/failure.json`, report);
        markDiagnosticWritten(env);
      } catch {
        // 保存・通知できなかった場合も、今回の結果をstdoutで返す。
      }
    }
    return report;
  } finally {
    process.removeListener('SIGINT', interrupt);
    process.removeListener('SIGTERM', interrupt);
    if (shouldLogTiming) writeTimingSpan(performance.now());
  }
};

if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(process.argv[1]).href
) {
  const result = await runCiCli(
    process.argv.slice(2),
    process.cwd(),
    process.env,
  );
  process.stdout.write(`${JSON.stringify(result)}\n`);
  if (result.status === 'failed') process.exitCode = 1;
}
