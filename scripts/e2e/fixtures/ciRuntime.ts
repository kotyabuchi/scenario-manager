import {
  digestCiFullCollection,
  digestCiPartitionManifest,
} from '../ciPartition';
import { discoverySchema } from '../discoverySchema';
import { integrationCollectionSchema } from '../integrationSchema';
import { ciPartitionArtifactsFixture } from './ciPartitionArtifacts';
import { snapshotFixture } from './selection';

/** 実runnerを使わず、正規の計画と両shardの成功証拠を用意する。 */
export const ciRuntimeFixture = () => {
  const fixture = ciPartitionArtifactsFixture();
  const { eventPolicy, manifest, shards, workflow } = fixture;
  const integrationCollection = integrationCollectionSchema.parse({
    schemaVersion: 1,
    runner: {
      name: 'vitest',
      version: '3.2.4',
      project: 'integration',
      pool: 'threads',
      fileParallelism: false,
      maxWorkers: 1,
      includeTaskLocation: true,
    },
    config: 'vitest.integration.collect.config.ts',
    registrations: [],
    discovery: {
      schemaVersion: 1,
      profile: 'integration',
      projects: [],
      errors: [],
      tests: [],
    },
  });
  const discoveries = ['app', 'isolated', 'storybook'].map((profile) => {
    const tests = [
      ...fixture.fullPlan.requirements,
      ...fixture.fullPlan.allowedExtraTests,
    ]
      .filter((entry) => entry.profile === profile)
      .map(({ test }) => test);
    return discoverySchema.parse({
      schemaVersion: 1,
      profile,
      errors: [],
      tests,
      projects: [...new Set(tests.map(({ project }) => project))].map(
        (name) => ({
          name,
          testDir: profile === 'storybook' ? '.storybook/tests' : 'e2e',
          repeatEach: 1,
          dependencies: [],
        }),
      ),
    });
  });
  discoveries.push(integrationCollection.discovery);
  manifest.fullCollectionDigest = digestCiFullCollection(
    discoveries,
    integrationCollection,
  );
  for (const { envelope } of Object.values(shards)) {
    envelope.fullCollectionDigest = manifest.fullCollectionDigest;
    envelope.manifestDigest = digestCiPartitionManifest(manifest);
  }
  const initial = {
    inputs: shards.required.verification.inputsStart,
    snapshot: {
      ...snapshotFixture([
        { origin: 'committed', status: 'M', newPath: 'README.md' },
      ]),
      mode: 'ci' as const,
      base: eventPolicy.impactBase ?? eventPolicy.head,
      head: eventPolicy.head,
      digest: manifest.snapshotDigest,
    },
  };
  return {
    fixture,
    context: { eventPolicy, workflow },
    initial,
    ledgers: {
      ledger: fixture.ledger,
      legacy: fixture.legacy,
      smokeReference: fixture.smokeReference,
    },
    prepared: {
      plan: fixture.fullPlan,
      inputs: initial.inputs,
      scheduleExpected: [
        {
          test: fixture.isolatedRow.test,
          caseId: 'isolated-business',
          variant: fixture.isolatedRow.execution?.variant ?? 'default',
          binding: 'main',
          fixture: 'schedule' as const,
          operator: 'creator-only',
          observer: undefined,
        },
      ],
      integrationExpected: [],
      ledger: fixture.ledger,
      legacy: fixture.legacy,
      discoveries,
      integrationCollection,
    },
  };
};
