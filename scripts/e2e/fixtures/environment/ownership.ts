import {
  createEnvironmentPlan,
  transitionEnvironment,
} from '../../environmentOwnership';

import type {
  EnvironmentLease,
  EnvironmentManifest,
  EnvironmentPlanInput,
  EnvironmentResources,
} from '../../environmentSchema';

/** テスト内の時刻を単一の基準日から作る。 */
export const at = (second: number) =>
  `2026-11-04T00:00:${String(second).padStart(2, '0')}Z`;
/** 秘密情報を含まない所有環境の計画入力を作る。 */
export const request = (): EnvironmentPlanInput => ({
  runId: '012345abcdef',
  ownerNonce: '58e0fb3b-5c82-4fb6-8867-cf77953c3a87',
  repoRoot: '/repository',
  worktreeRoot: '/worktrees/isolated',
  commit: 'a'.repeat(40),
  ports: { api: 55321, db: 55322, shadow: 55320 },
  inputHashes: {
    config: 'b'.repeat(64),
    migrations: 'c'.repeat(64),
    seed: 'd'.repeat(64),
  },
  createdAt: at(0),
});
/** 空のresource観測を作る。 */
export const empty = (): EnvironmentResources => ({
  containers: [],
  networks: [],
  volumes: [],
});
/** manifestと完全一致するローカルleaseを作る。 */
export const leaseFor = (manifest: EnvironmentManifest): EnvironmentLease => ({
  runId: manifest.runId,
  ownerNonce: manifest.ownerNonce,
  projectId: manifest.projectId,
  worktreeRoot: manifest.worktreeRoot,
});
/** 専用projectに属するDocker観測を作る。 */
export const resourcesFor = (
  manifest: EnvironmentManifest,
): EnvironmentResources => ({
  containers: [
    {
      id: '1'.repeat(64),
      name: `supabase_db_${manifest.projectId}`,
      projectLabel: manifest.projectId,
      createdAt: at(2),
      imageId: `sha256:${'2'.repeat(64)}`,
    },
  ],
  networks: [
    {
      id: '3'.repeat(64),
      name: `supabase_network_${manifest.projectId}`,
      projectLabel: manifest.projectId,
      createdAt: at(2),
    },
  ],
  volumes: [
    {
      name: `supabase_db_${manifest.projectId}`,
      projectLabel: manifest.projectId,
      createdAt: at(2),
    },
  ],
});
/** 起動前検査とresource記録を済ませた環境を作る。 */
export const fixture = () => {
  const plan = createEnvironmentPlan(request());
  const preflight = transitionEnvironment(plan, {
    type: 'preflight',
    at: at(1),
    existingResourceCount: 0,
  });
  const resources = resourcesFor(plan);
  const manifest = transitionEnvironment(preflight, {
    type: 'resources-recorded',
    at: at(3),
    resources,
  });
  const lease = leaseFor(manifest);
  const observed = {
    lease,
    projectId: manifest.projectId,
    apiUrl: manifest.apiUrl,
    database: { ...manifest.database },
  };
  return { plan, preflight, manifest, resources, lease, observed };
};
