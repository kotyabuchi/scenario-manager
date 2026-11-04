import { isNil } from 'ramda';
import { describe, expect, it } from 'vitest';

import {
  assertOwnedConnection,
  planOwnedCleanup,
  transitionEnvironment,
} from './environmentOwnership';
import { at, empty, fixture } from './fixtures/environment/ownership';

describe('所有resourceだけのcleanup計画', () => {
  it('exact IDとlabel/時刻一致だけを返し、入力を変更しない', () => {
    const { manifest, resources, lease } = fixture();
    const before = structuredClone({ manifest, resources, lease });
    expect(planOwnedCleanup(manifest, resources, lease)).toEqual({
      resources,
      issues: [],
    });
    expect({ manifest, resources, lease }).toEqual(before);
    expect(planOwnedCleanup(manifest, empty(), lease)).toEqual({
      resources: empty(),
      issues: [],
    });
  });

  it.each([
    'containers',
    'networks',
    'volumes',
  ] as const)('%sのlabel/作成日時/名前が変われば削除しない', (kind) => {
    for (const change of [
      { projectLabel: null },
      { projectLabel: 'scenario-manager' },
      { createdAt: at(9) },
      { name: 'replaced' },
    ]) {
      const { manifest, resources, lease } = fixture();
      const target = resources[kind][0];
      if (isNil(target)) throw new Error('fixture不足');
      Object.assign(target, change);
      const result = planOwnedCleanup(manifest, resources, lease);
      expect(result.resources[kind]).toEqual([]);
      expect(result.issues.length).toBeGreaterThan(0);
    }
  });

  it('名前が同じでも別container/network IDは削除しない', () => {
    const { manifest, resources, lease } = fixture();
    resources.containers = resources.containers.map((value) => ({
      ...value,
      id: '4'.repeat(64),
    }));
    resources.networks = resources.networks.map((value) => ({
      ...value,
      id: '5'.repeat(64),
    }));
    const result = planOwnedCleanup(manifest, resources, lease);
    expect(result.resources.containers).toEqual([]);
    expect(result.resources.networks).toEqual([]);
    expect(result.issues.map((issue) => issue.code)).toEqual([
      'UNRECORDED_RESOURCE',
      'UNRECORDED_RESOURCE',
    ]);
  });

  it('別projectは無視し、同projectの未記録resourceは残留として通知する', () => {
    const { manifest, resources, lease } = fixture();
    resources.volumes.push(
      {
        name: 'unrecorded',
        projectLabel: manifest.projectId,
        createdAt: at(2),
      },
      { name: 'foreign', projectLabel: 'other-project', createdAt: at(2) },
    );
    const result = planOwnedCleanup(manifest, resources, lease);
    expect(result.resources.volumes).toHaveLength(1);
    expect(result.issues).toEqual([
      expect.objectContaining({
        code: 'UNRECORDED_RESOURCE',
        subject: 'volume:unrecorded',
      }),
    ]);
  });

  it('labelのないvolumeはjournalに残しても削除・接続対象にはできない', () => {
    const { preflight, resources, lease, observed } = fixture();
    resources.volumes = resources.volumes.map((value) => ({
      ...value,
      projectLabel: null,
    }));
    const manifest = transitionEnvironment(preflight, {
      type: 'resources-recorded',
      at: at(3),
      resources,
    });
    expect(
      planOwnedCleanup(manifest, resources, lease).resources.volumes,
    ).toEqual([]);
    expect(planOwnedCleanup(manifest, resources, lease).issues).toHaveLength(1);
    expect(() => assertOwnedConnection(manifest, observed)).toThrow();
    expect(() =>
      transitionEnvironment(manifest, { type: 'running', at: at(4) }),
    ).toThrow();
  });

  it('preflight未確認では既存resourceを削除しない', () => {
    const { plan, resources, lease } = fixture();
    expect(() => planOwnedCleanup(plan, resources, lease)).toThrow('所有確認');
    expect(planOwnedCleanup(plan, empty(), lease)).toEqual({
      resources: empty(),
      issues: [],
    });
  });

  it('同じcontainer IDでもimage IDが一致しなければ削除しない', () => {
    const { manifest, resources, lease } = fixture();
    resources.containers = resources.containers.map((value) => ({
      ...value,
      imageId: `sha256:${'9'.repeat(64)}`,
    }));
    expect(
      planOwnedCleanup(manifest, resources, lease).resources.containers,
    ).toEqual([]);
  });
});
