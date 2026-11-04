import { describe, expect, it } from 'vitest';

import { createEnvironmentPlan } from './environmentOwnership';
import {
  environmentManifestSchema,
  environmentPlanInputSchema,
  environmentResourcesSchema,
} from './environmentSchema';
import {
  at,
  empty,
  fixture,
  request,
  resourcesFor,
} from './fixtures/environment/ownership';

describe('専用環境manifest', () => {
  it.each([
    [
      '/repository',
      '/worktrees/isolated',
      '/worktrees/isolated/test-results/environments/run-012345abcdef',
    ],
    [
      'C:\\repository',
      'C:\\worktrees\\isolated',
      'C:\\worktrees\\isolated\\test-results\\environments\\run-012345abcdef',
    ],
  ])('OS共通の入力から専用project/workdirを決定する: %s', (repoRoot, worktreeRoot, workdir) => {
    const input = { ...request(), repoRoot, worktreeRoot };
    const original = structuredClone(input);
    const plan = createEnvironmentPlan(input);
    expect(plan).toMatchObject({
      schemaVersion: 1,
      cliVersion: '2.75.0',
      state: 'starting',
      projectId: 'sm-e2e-012345abcdef',
      workdir,
      apiUrl: 'http://127.0.0.1:55321',
      database: { host: '127.0.0.1', port: 55322, name: 'postgres' },
      resources: empty(),
      preflightAt: null,
      cleanup: null,
    });
    expect(input).toEqual(original);
  });

  it.each([
    { runId: '../escape' },
    { runId: 'ABCDEF012345' },
    { ownerNonce: 'not-uuid' },
    { commit: 'main' },
    { worktreeRoot: 'relative/root' },
    { worktreeRoot: 'C:relative' },
    { worktreeRoot: '/root/../outside' },
    { worktreeRoot: '/root\nother' },
    { ports: { api: 55321, db: 55321, shadow: 55320 } },
    { ports: { api: 80, db: 55322, shadow: 55320 } },
    { ports: { api: 65536, db: 55322, shadow: 55320 } },
    { ports: { api: 54321, db: 55322, shadow: 55320 } },
    { createdAt: 'yesterday' },
    {
      inputHashes: {
        config: 'unhashed',
        migrations: 'c'.repeat(64),
        seed: 'd'.repeat(64),
      },
    },
  ])('不正な所有設定・開発portを拒否する: %j', (change) => {
    expect(
      environmentPlanInputSchema.safeParse({ ...request(), ...change }).success,
    ).toBe(false);
  });

  it('秘密や未定義のfieldをmanifestの各階層へ混入できない', () => {
    const { manifest, resources } = fixture();
    for (const input of [
      { ...manifest, password: 'private' },
      { ...manifest, token: 'private' },
      { ...manifest, database: { ...manifest.database, password: 'private' } },
      {
        ...manifest,
        inputHashes: { ...manifest.inputHashes, secret: 'private' },
      },
      {
        ...manifest,
        resources: {
          ...resources,
          containers: resources.containers.map((value) => ({
            ...value,
            labels: { token: 'private' },
          })),
        },
      },
    ])
      expect(environmentManifestSchema.safeParse(input).success).toBe(false);
  });

  it('manifest内のrun/project/workdir/endpointと状態の食違いを拒否する', () => {
    const { plan } = fixture();
    for (const change of [
      { projectId: 'scenario-manager' },
      { projectId: 'sm-e2e-aaaaaaaaaaaa' },
      { workdir: '/outside' },
      { apiUrl: 'http://127.0.0.1:55322' },
      { database: { ...plan.database, port: 55323 } },
      { state: 'running' },
      { state: 'stopped' },
      { state: 'failed' },
      { updatedAt: '2025-01-01T00:00:00Z' },
      { resources: resourcesFor(plan) },
      { preflightAt: at(30) },
      { cliVersion: 'latest' },
    ])
      expect(
        environmentManifestSchema.safeParse({ ...plan, ...change }).success,
      ).toBe(false);
  });

  it('resource IDは短縮せず、重複と未知fieldを拒否する', () => {
    const { resources } = fixture();
    expect(
      environmentResourcesSchema.safeParse({
        ...resources,
        containers: [...resources.containers, ...resources.containers],
      }).success,
    ).toBe(false);
    expect(
      environmentResourcesSchema.safeParse({
        ...resources,
        containers: resources.containers.map((value) => ({
          ...value,
          id: 'short',
        })),
      }).success,
    ).toBe(false);
    expect(
      environmentResourcesSchema.safeParse({
        ...resources,
        volumes: resources.volumes.map((value) => ({
          ...value,
          id: 'fake-volume-id',
        })),
      }).success,
    ).toBe(false);
  });
});
