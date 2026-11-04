import { isNil } from 'ramda';

import {
  assertOwnedConnection,
  planOwnedCleanup,
  transitionEnvironment,
} from './environmentOwnership';
import { environmentManifestSchema } from './environmentSchema';

import type { createDockerDriver } from './environmentDocker';
import type {
  EnvironmentEvent,
  EnvironmentIssue,
  EnvironmentLease,
  EnvironmentManifest,
} from './environmentSchema';

type EnvironmentOperations = {
  docker: ReturnType<typeof createDockerDriver>;
  save: (manifest: EnvironmentManifest) => Promise<void>;
  readLease: () => Promise<EnvironmentLease>;
  start: () => Promise<void>;
  verify: (manifest: EnvironmentManifest) => Promise<void>;
  release: () => Promise<void>;
};

/** 起動・検査と独立したfinallyで、journalに所有が証明されたresourceだけを停止する。 */
export const runEnvironment = async (
  input: EnvironmentManifest,
  operations: EnvironmentOperations,
) => {
  let manifest = environmentManifestSchema.parse(input);
  const now = () => new Date().toISOString();
  const update = async (event: EnvironmentEvent) => {
    const next = transitionEnvironment(manifest, event);
    await operations.save(next);
    manifest = next;
  };
  let hasStarted = false;
  let didFail = false;
  const cleanupIssues: EnvironmentIssue[] = [];
  try {
    await operations.save(manifest);
    await operations.docker.assertFreshProject(manifest.projectId);
    const existing = await operations.docker.observe(manifest.projectId);
    if (Object.values(existing).some((resources) => resources.length > 0))
      throw new Error('既存project resourceを再利用することはできません。');
    await update({ type: 'preflight', at: now(), existingResourceCount: 0 });
    hasStarted = true;
    await operations.start();
    await update({
      type: 'resources-recorded',
      at: now(),
      resources: await operations.docker.observe(manifest.projectId),
    });
    assertOwnedConnection(manifest, {
      lease: await operations.readLease(),
      projectId: manifest.projectId,
      apiUrl: manifest.apiUrl,
      database: manifest.database,
    });
    await update({ type: 'running', at: now() });
    await operations.verify(manifest);
  } catch {
    didFail = true;
    await update({ type: 'failed', at: now(), code: 'ENVIRONMENT_RUN_FAILED' });
  } finally {
    if (hasStarted) {
      try {
        // CLIが起動途中で失敗しても、preflight以降に作成したresourceを記録する。
        await update({
          type: 'resources-recorded',
          at: now(),
          resources: await operations.docker.observe(manifest.projectId),
        });
        const plan = planOwnedCleanup(
          manifest,
          await operations.docker.observe(manifest.projectId),
          await operations.readLease(),
        );
        cleanupIssues.push(...plan.issues);
        await update({ type: 'stopping', at: now() });
        cleanupIssues.push(...(await operations.docker.remove(plan.resources)));
        const remaining = await operations.docker.observe(manifest.projectId);
        const at = now();
        await update({
          type: 'cleanup-recorded',
          at,
          cleanup: {
            at,
            status:
              cleanupIssues.length === 0 &&
              Object.values(remaining).every(
                (resources) => resources.length === 0,
              )
                ? 'complete'
                : 'incomplete',
            remaining,
            issues: cleanupIssues,
          },
        });
      } catch {
        didFail = true;
        await update({ type: 'failed', at: now(), code: 'CLEANUP_UNVERIFIED' });
      }
    }
    // 残留・観測失敗時は占有ロックとjournalを残し、次の実行で上書きしない。
    if (!hasStarted || manifest.cleanup?.status === 'complete') {
      try {
        await operations.release();
      } catch {
        didFail = true;
        // stoppedは終端なのでmanifestを書き換えず、呼出元へrelease失敗を伝える。
      }
    }
  }
  return {
    manifest,
    passed:
      !didFail &&
      isNil(manifest.failure) &&
      manifest.cleanup?.status === 'complete',
  };
};

export type { EnvironmentOperations };
