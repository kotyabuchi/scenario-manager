import { z } from 'zod';

import { runLocalCommand } from './environmentCommands';
import { writeProgressStderr } from './progressStderr';

import { arch, availableParallelism, platform, release } from 'node:os';

import type { EnvironmentManifest } from './environmentSchema';

const ROLES = ['db', 'rest', 'kong', 'auth', 'storage'] as const;
const hash = z.string().regex(/^sha256:[0-9a-f]{64}$/);
const inspectSchema = z.object({
  id: z.string(),
  name: z.string(),
  project: z.string(),
  reference: z.string(),
  image: hash,
});
const imageSchema = z.object({
  id: hash,
  digests: z.array(z.string()).nullable(),
});
const containerFormat =
  '{"id":{{json .Id}},"name":{{json .Name}},"project":{{json (index .Config.Labels "com.supabase.cli.project")}},"reference":{{json .Config.Image}},"image":{{json .Image}}}';
const imageFormat = '{"id":{{json .Id}},"digests":{{json .RepoDigests}}}';
const referencePattern =
  /^(public\.ecr\.aws\/supabase|ghcr\.io\/supabase)\/(postgres|postgrest|kong|gotrue|storage-api):(v?[0-9][0-9.]{0,39})$/;
const digestPattern =
  /^(?:public\.ecr\.aws\/supabase|ghcr\.io\/supabase)\/(?:postgres|postgrest|kong|gotrue|storage-api)@(sha256:[0-9a-f]{64})$/;
const roleImage = {
  db: 'postgres',
  rest: 'postgrest',
  kong: 'kong',
  auth: 'gotrue',
  storage: 'storage-api',
} as const;

type Options = {
  projectId: string;
  containers: EnvironmentManifest['resources']['containers'];
  cwd: string;
  env: NodeJS.ProcessEnv;
  signal: AbortSignal;
};

/** CI で所有コンテナの識別情報だけを記録し、観測失敗を実行結果に混ぜない。 */
export const collectImageObservation = async ({
  projectId,
  containers,
  cwd,
  env,
  signal,
}: Options): Promise<void> => {
  if (
    process.env.GITHUB_ACTIONS !== 'true' &&
    process.env.E2E_CLI_TIMING !== '1'
  )
    return;
  const startedAt = performance.now();
  const durationMs = () =>
    Math.max(0, Math.round(performance.now() - startedAt));
  const controller = new AbortController();
  const abort = () => controller.abort();
  const timer = setTimeout(abort, 10_000);
  signal.addEventListener('abort', abort, { once: true });
  if (signal.aborted) abort();
  const run = (args: string[]) =>
    runLocalCommand('docker', args, { cwd, env, signal: controller.signal });
  try {
    const info = JSON.parse(
      await run([
        'info',
        '--format',
        '{"driver":{{json .Driver}},"version":{{json .ServerVersion}}}',
      ]),
    ) as unknown;
    const docker = z
      .object({
        driver: z.enum([
          'overlay2',
          'overlayfs',
          'fuse-overlayfs',
          'btrfs',
          'vfs',
          'zfs',
        ]),
        version: z.string().regex(/^[0-9.]{1,32}$/),
      })
      .parse(info);
    const images = [];
    for (const role of ROLES) {
      const name = `supabase_${role}_${projectId}`;
      const owned = containers.filter(
        (item) => item.name === name && item.projectLabel === projectId,
      );
      if (owned.length === 0) {
        images.push({ role, status: 'absent' });
        continue;
      }
      if (owned.length !== 1) throw new Error('ambiguous');
      const owner = owned[0];
      if (owner === undefined) throw new Error('missing');
      const container = inspectSchema.parse(
        JSON.parse(
          await run(['inspect', '--format', containerFormat, owner.id]),
        ),
      );
      if (
        container.id !== owner.id ||
        container.name !== `/${name}` ||
        container.project !== projectId ||
        container.image !== owner.imageId
      )
        throw new Error('ownership');
      const reference = referencePattern.exec(container.reference);
      if (reference === null || reference[2] !== roleImage[role])
        throw new Error('reference');
      const image = imageSchema.parse(
        JSON.parse(
          await run([
            'image',
            'inspect',
            '--format',
            imageFormat,
            container.image,
          ]),
        ),
      );
      if (image.id !== container.image) throw new Error('image');
      const digests = (image.digests ?? [])
        .map((value) => digestPattern.exec(value)?.[1])
        .filter((value): value is string => value !== undefined)
        .sort();
      images.push({
        role,
        status: 'observed',
        registry: reference[1],
        tag: reference[3],
        id: image.id,
        digests,
      });
    }
    const imageOS = /^ubuntu(?:20|22|24|26)$/.test(process.env.ImageOS ?? '')
      ? process.env.ImageOS
      : null;
    const imageVersion = /^\d{8}\.\d+(?:\.\d+)?$/.test(
      process.env.ImageVersion ?? '',
    )
      ? process.env.ImageVersion
      : null;
    const kernel = release();
    writeProgressStderr(
      `[supabase-image-observation] ${JSON.stringify({
        status: 'observed',
        durationMs: durationMs(),
        runner: {
          os: platform(),
          arch: arch(),
          kernel: /^[a-zA-Z0-9._+-]{1,100}$/.test(kernel) ? kernel : null,
          imageOS,
          imageVersion,
          cpuCount: availableParallelism(),
          docker,
        },
        images,
      })}\n`,
    );
  } catch {
    try {
      writeProgressStderr(
        `[supabase-image-observation] ${JSON.stringify({ status: controller.signal.aborted ? 'collection-aborted' : 'collection-failed', durationMs: durationMs() })}\n`,
      );
    } catch {
      /* 観測は本処理を妨げない。 */
    }
  } finally {
    clearTimeout(timer);
    signal.removeEventListener('abort', abort);
  }
};
