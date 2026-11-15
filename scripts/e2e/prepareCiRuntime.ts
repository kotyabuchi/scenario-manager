import { isNil } from 'ramda';
import { z } from 'zod';

import {
  localCommandEnvironment,
  runLocalCommand,
} from './environmentCommands';
import { SUPABASE_CLI_VERSION } from './supabaseCli';

import { createRequire } from 'node:module';
import { dirname, join } from 'node:path';
import { pathToFileURL } from 'node:url';

// CLI更新時は設定・excludeとの契約テストと併せて明示的に更新する。
// https://github.com/supabase/cli/blob/v2.75.0/pkg/config/templates/Dockerfile
export const CI_RUNTIME_IMAGES = {
  cliVersion: '2.75.0',
  postgresMajor: 17,
  registry: 'public.ecr.aws',
  images: [
    'public.ecr.aws/supabase/postgres:17.6.1.075',
    'public.ecr.aws/supabase/kong:2.8.1',
    'public.ecr.aws/supabase/postgrest:v14.3',
    'public.ecr.aws/supabase/gotrue:v2.186.0',
    'public.ecr.aws/supabase/storage-api:v1.35.3',
  ],
} as const;

// 先読みだけを打ち切り、既存startの取得・retryへ戻せる上限。
export const IMAGE_PREFETCH_TIMEOUT_MS = 120_000;

export const ciRuntimeProgressSchema = z.object({
  schemaVersion: z.literal(1),
  scope: z.enum(['runtime', 'images', 'chromium']),
  status: z.enum([
    'started',
    'cached',
    'pulling',
    'pulled',
    'fallback',
    'skipped',
    'completed',
    'failed',
    'aborted',
  ]),
  elapsedMs: z.number().int().nonnegative(),
  image: z.enum(CI_RUNTIME_IMAGES.images).optional(),
});

type CiRuntimeProgress = z.infer<typeof ciRuntimeProgressSchema>;
type PrepareCiRuntimeOptions = {
  root: string;
  env: NodeJS.ProcessEnv;
  signal?: AbortSignal;
  onProgress?: (event: CiRuntimeProgress) => void;
  platform?: NodeJS.Platform;
  arch?: string;
};

/** Chromium導入にイメージ先読みを重ね、全childのclose後にだけ戻る。 */
export const prepareCiRuntime = async ({
  root,
  env,
  signal,
  onProgress,
  platform = process.platform,
  arch = process.arch,
}: PrepareCiRuntimeOptions): Promise<boolean> => {
  let startedAt: number | undefined;
  try {
    startedAt = performance.now();
  } catch {
    // 診断用時計を読めなくても準備処理は実行する。
  }
  const runtimeController = new AbortController();
  const imageController = new AbortController();
  const interrupt = () => runtimeController.abort();
  const abortImages = () => imageController.abort();
  process.once('SIGINT', interrupt);
  process.once('SIGTERM', interrupt);
  signal?.addEventListener('abort', interrupt, { once: true });
  runtimeController.signal.addEventListener('abort', abortImages, {
    once: true,
  });
  if (signal?.aborted) interrupt();

  // 生のcommand出力や例外、環境値を公開しない。
  const report = (
    scope: CiRuntimeProgress['scope'],
    status: CiRuntimeProgress['status'],
    image?: CiRuntimeProgress['image'],
  ) => {
    try {
      if (isNil(startedAt)) return;
      const event = ciRuntimeProgressSchema.parse({
        schemaVersion: 1,
        scope,
        status,
        elapsedMs: Math.max(0, Math.round(performance.now() - startedAt)),
        ...(isNil(image) ? {} : { image }),
      });
      if (!isNil(onProgress)) onProgress(event);
      else process.stdout.write(`[ci-runtime] ${JSON.stringify(event)}\n`);
    } catch {
      // 表示先の失敗でchild終了待機を妨げない。
    }
  };

  let deadline: ReturnType<typeof setTimeout> | undefined;
  try {
    runtimeController.signal.throwIfAborted();
    if (CI_RUNTIME_IMAGES.cliVersion !== SUPABASE_CLI_VERSION)
      throw new Error('固定CLIのイメージ契約を更新してください。');
    report('runtime', 'started');
    // package.jsonのbin.playwright=cli.jsを確認済み。shellや任意CLI引数は使わない。
    // https://github.com/microsoft/playwright/blob/v1.57.0/packages/playwright/package.json
    const require = createRequire(import.meta.url);
    const playwrightCli = join(
      dirname(require.resolve('playwright/package.json')),
      'cli.js',
    );
    // runLocalCommandは直接childと継承pipeのcloseを待つ。
    // apt等がpipeを切り離した孫processの終了までは保証しない（既存runnerの境界）。
    const installChromium = async () => {
      report('chromium', 'started');
      try {
        await runLocalCommand(
          'node',
          [playwrightCli, 'install', '--with-deps', 'chromium'],
          { cwd: root, env, signal: runtimeController.signal },
        );
        runtimeController.signal.throwIfAborted();
        report('chromium', 'completed');
      } catch {
        const wasAborted = runtimeController.signal.aborted;
        runtimeController.abort();
        report('chromium', wasAborted ? 'aborted' : 'failed');
        throw new Error('Chromium導入に失敗しました。');
      }
    };
    const prefetchImages = async () => {
      // 採用時はstart側にも同じregistryを渡す。別registryを勝手に置換しない。
      if (
        platform !== 'linux' ||
        arch !== 'x64' ||
        env.SUPABASE_INTERNAL_IMAGE_REGISTRY?.toLowerCase() !==
          CI_RUNTIME_IMAGES.registry
      ) {
        report('images', 'skipped');
        return;
      }
      report('images', 'started');
      deadline = setTimeout(abortImages, IMAGE_PREFETCH_TIMEOUT_MS);
      const dockerHost = (
        await runLocalCommand(
          'docker',
          ['context', 'inspect', '--format', '{{.Endpoints.docker.Host}}'],
          { cwd: root, env, signal: imageController.signal },
        )
      ).trim();
      // 有効contextがremoteならpullせず、既存probeの接続検査へ戻す。
      const dockerEnv = localCommandEnvironment(env, dockerHost);
      const results = await Promise.allSettled(
        CI_RUNTIME_IMAGES.images.map(async (image) => {
          imageController.signal.throwIfAborted();
          try {
            await runLocalCommand('docker', ['image', 'inspect', image], {
              cwd: root,
              env: dockerEnv,
              signal: imageController.signal,
            });
            imageController.signal.throwIfAborted();
            report('images', 'cached', image);
            return;
          } catch {
            imageController.signal.throwIfAborted();
          }
          report('images', 'pulling', image);
          await runLocalCommand('docker', ['pull', '--quiet', image], {
            cwd: root,
            env: dockerEnv,
            signal: imageController.signal,
          });
          imageController.signal.throwIfAborted();
          report('images', 'pulled', image);
        }),
      );
      clearTimeout(deadline);
      report(
        'images',
        runtimeController.signal.aborted
          ? 'aborted'
          : results.some((result) => result.status === 'rejected')
            ? 'fallback'
            : 'completed',
      );
    };
    const results = await Promise.allSettled([
      installChromium(),
      prefetchImages(),
    ]);
    runtimeController.signal.throwIfAborted();
    if (results[0]?.status !== 'fulfilled')
      throw new Error('Chromium導入に失敗しました。');
    // 先読みの通常失敗は性能補助に限定し、既存startが取得を再試行する。
    if (results[1]?.status === 'rejected') report('images', 'fallback');
    report('runtime', 'completed');
    return true;
  } catch {
    report('runtime', runtimeController.signal.aborted ? 'aborted' : 'failed');
    return false;
  } finally {
    clearTimeout(deadline);
    process.removeListener('SIGINT', interrupt);
    process.removeListener('SIGTERM', interrupt);
    signal?.removeEventListener('abort', interrupt);
    runtimeController.signal.removeEventListener('abort', abortImages);
  }
};

if (
  !isNil(process.argv[1]) &&
  import.meta.url === pathToFileURL(process.argv[1]).href
) {
  if (process.argv.length !== 2) process.exitCode = 1;
  else {
    prepareCiRuntime({ root: process.cwd(), env: process.env }).then(
      (passed) => {
        if (!passed) process.exitCode = 1;
      },
    );
  }
}

export type { CiRuntimeProgress, PrepareCiRuntimeOptions };
