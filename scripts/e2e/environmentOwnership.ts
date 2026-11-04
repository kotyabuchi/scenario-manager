import { isNil } from 'ramda';

import {
  environmentEventSchema,
  environmentLeaseSchema,
  environmentManifestSchema,
  environmentObservationSchema,
  environmentPlanInputSchema,
  environmentResourcesSchema,
} from './environmentSchema';

import { posix, win32 } from 'node:path';

import type {
  EnvironmentEvent,
  EnvironmentIssue,
  EnvironmentLease,
  EnvironmentManifest,
  EnvironmentObservation,
  EnvironmentPlanInput,
  EnvironmentResources,
} from './environmentSchema';

const emptyResources = (): EnvironmentResources => ({
  containers: [],
  networks: [],
  volumes: [],
});

/** driverがrealpath確認したrootから、既存開発stackと異なる専用planを作る。 */
export const createEnvironmentPlan = (
  input: EnvironmentPlanInput,
): EnvironmentManifest => {
  const plan = environmentPlanInputSchema.parse(input);
  const paths = /^[a-zA-Z]:/.test(plan.worktreeRoot) ? win32 : posix;
  return environmentManifestSchema.parse({
    ...plan,
    schemaVersion: 1,
    projectId: `sm-e2e-${plan.runId}`,
    workdir: paths.join(
      plan.worktreeRoot,
      'test-results',
      'environments',
      `run-${plan.runId}`,
    ),
    apiUrl: `http://127.0.0.1:${plan.ports.api}`,
    database: { host: '127.0.0.1', port: plan.ports.db, name: 'postgres' },
    cliVersion: '2.75.0',
    state: 'starting',
    preflightAt: null,
    updatedAt: plan.createdAt,
    resources: emptyResources(),
    failure: null,
    cleanup: null,
  });
};

const assertLease = (
  manifest: EnvironmentManifest,
  input: EnvironmentLease,
) => {
  const lease = environmentLeaseSchema.parse(input);
  for (const key of [
    'runId',
    'ownerNonce',
    'projectId',
    'worktreeRoot',
  ] as const)
    if (lease[key] !== manifest[key])
      throw new Error('環境の所有leaseが一致しません。');
};

/** URLがlocalであるだけでは許可せず、所有leaseとproject/全接続条件を照合する。 */
export const assertOwnedConnection = (
  input: EnvironmentManifest,
  observed: EnvironmentObservation,
): void => {
  const manifest = environmentManifestSchema.parse(input);
  const actual = environmentObservationSchema.parse(observed);
  assertLease(manifest, actual.lease);
  if (
    isNil(manifest.preflightAt) ||
    manifest.resources.containers.length === 0 ||
    Object.values(manifest.resources).some((items) =>
      items.some((item) => item.projectLabel !== manifest.projectId),
    ) ||
    !['starting', 'running'].includes(manifest.state)
  )
    throw new Error('接続を許可できる環境状態ではありません。');
  if (
    actual.projectId !== manifest.projectId ||
    actual.apiUrl !== manifest.apiUrl ||
    actual.database.host !== manifest.database.host ||
    actual.database.port !== manifest.database.port ||
    actual.database.name !== manifest.database.name
  )
    throw new Error('接続先が所有環境と一致しません。');
};

/** journalのexact identityと現在のproject label/作成日時が一致したresourceだけを返す。 */
export const planOwnedCleanup = (
  input: EnvironmentManifest,
  observed: EnvironmentResources,
  lease: EnvironmentLease,
) => {
  const manifest = environmentManifestSchema.parse(input);
  assertLease(manifest, lease);
  const actual = environmentResourcesSchema.parse(observed);
  if (isNil(manifest.preflightAt)) {
    if (Object.values(actual).some((items) => items.length > 0))
      throw new Error('開始前の所有確認なしにresourceを削除できません。');
    return { resources: emptyResources(), issues: [] };
  }
  const issues: EnvironmentIssue[] = [];
  const select = <T extends EnvironmentResources['volumes'][number]>(
    kind: string,
    recorded: T[],
    current: T[],
    key: (resource: T) => string,
  ): T[] => {
    const journal = new Map(
      recorded.map((resource) => [key(resource), resource]),
    );
    return current.filter((resource) => {
      const identity = key(resource);
      const original = journal.get(identity);
      if (isNil(original)) {
        if (resource.projectLabel === manifest.projectId)
          issues.push({
            code: 'UNRECORDED_RESOURCE',
            subject: `${kind}:${identity}`,
            message: '同projectの未記録resourceは削除できません。',
          });
        return false;
      }
      if (
        resource.projectLabel !== manifest.projectId ||
        original.projectLabel !== manifest.projectId ||
        resource.createdAt !== original.createdAt ||
        resource.name !== original.name ||
        ('imageId' in original &&
          'imageId' in resource &&
          original.imageId !== resource.imageId)
      ) {
        issues.push({
          code: 'RESOURCE_IDENTITY_MISMATCH',
          subject: `${kind}:${identity}`,
          message:
            'resourceの所有label・名前・作成日時がjournalと一致しません。',
        });
        return false;
      }
      return true;
    });
  };
  const resources = {
    containers: select(
      'container',
      manifest.resources.containers,
      actual.containers,
      (value) => value.id,
    ),
    networks: select(
      'network',
      manifest.resources.networks,
      actual.networks,
      (value) => value.id,
    ),
    volumes: select(
      'volume',
      manifest.resources.volumes,
      actual.volumes,
      (value) => value.name,
    ),
  };
  return { resources, issues };
};

/** 状態と所有journalを更新する純粋関数。時刻・実resource観測はdriverから渡す。 */
export const transitionEnvironment = (
  input: EnvironmentManifest,
  raw: EnvironmentEvent,
): EnvironmentManifest => {
  const manifest = environmentManifestSchema.parse(input);
  const event = environmentEventSchema.parse(raw);
  if (
    Date.parse(event.at) < Date.parse(manifest.updatedAt) ||
    manifest.state === 'stopped'
  )
    throw new Error('環境の状態または時刻を巻き戻すことはできません。');
  if (event.type === 'preflight') {
    if (manifest.state !== 'starting' || !isNil(manifest.preflightAt))
      throw new Error('preflightは開始前に一度だけ記録できます。');
    manifest.preflightAt = event.at;
  } else if (event.type === 'resources-recorded') {
    if (
      isNil(manifest.preflightAt) ||
      !['starting', 'running', 'failed'].includes(manifest.state)
    )
      throw new Error('resourceを記録できる環境状態ではありません。');
    const merge = <T extends EnvironmentResources['volumes'][number]>(
      before: T[],
      additions: T[],
      key: (value: T) => string,
    ): T[] => {
      const current = new Map(before.map((value) => [key(value), value]));
      for (const resource of additions) {
        const old = current.get(key(resource));
        if (
          !isNil(old) &&
          (old.name !== resource.name ||
            old.createdAt !== resource.createdAt ||
            old.projectLabel !== resource.projectLabel ||
            ('imageId' in old &&
              'imageId' in resource &&
              old.imageId !== resource.imageId))
        )
          throw new Error('既存resourceのidentityは置換できません。');
        current.set(key(resource), resource);
      }
      return [...current.values()];
    };
    manifest.resources = {
      containers: merge(
        manifest.resources.containers,
        event.resources.containers,
        (value) => value.id,
      ),
      networks: merge(
        manifest.resources.networks,
        event.resources.networks,
        (value) => value.id,
      ),
      volumes: merge(
        manifest.resources.volumes,
        event.resources.volumes,
        (value) => value.name,
      ),
    };
  } else if (event.type === 'running') {
    if (
      manifest.state !== 'starting' ||
      isNil(manifest.preflightAt) ||
      manifest.resources.containers.length === 0
    )
      throw new Error('起動確認とresource記録が完了していません。');
    manifest.state = 'running';
  } else if (event.type === 'stopping') {
    manifest.state = 'stopping';
  } else if (event.type === 'failed') {
    manifest.state = 'failed';
    manifest.failure = { code: event.code, at: event.at };
  } else {
    if (manifest.state !== 'stopping' || event.cleanup.at !== event.at)
      throw new Error('停止処理の観測時刻とcleanup結果が一致しません。');
    manifest.cleanup = event.cleanup;
    manifest.state = event.cleanup.status === 'complete' ? 'stopped' : 'failed';
    if (manifest.state === 'failed')
      manifest.failure = { code: 'CLEANUP_INCOMPLETE', at: event.at };
  }
  manifest.updatedAt = event.at;
  return environmentManifestSchema.parse(manifest);
};
