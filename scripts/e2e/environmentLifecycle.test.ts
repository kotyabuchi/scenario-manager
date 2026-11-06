import { describe, expect, it } from 'vitest';

import {
  createEnvironmentPlan,
  transitionEnvironment,
} from './environmentOwnership';
import { environmentEventSchema } from './environmentSchema';
import { at, empty, fixture, request } from './fixtures/environment/ownership';

describe('環境の状態遷移', () => {
  it('起動途中失敗からcleanup失敗・再試行まで所有journalを保持する', () => {
    const { manifest, resources } = fixture();
    const before = structuredClone(manifest);
    const failed = transitionEnvironment(manifest, {
      type: 'failed',
      at: at(4),
      code: 'START_FAILED',
    });
    expect(failed.failure).toStrictEqual({ code: 'START_FAILED', at: at(4) });
    const stopping = transitionEnvironment(failed, {
      type: 'stopping',
      at: at(5),
    });
    const incomplete = transitionEnvironment(stopping, {
      type: 'cleanup-recorded',
      at: at(6),
      cleanup: {
        at: at(6),
        status: 'incomplete',
        remaining: resources,
        issues: [
          {
            code: 'CLEANUP_FAILED',
            subject: 'container',
            message: '停止を確認できません。',
          },
        ],
      },
    });
    expect(incomplete.state).toBe('failed');
    expect(incomplete.failure?.code).toBe('CLEANUP_INCOMPLETE');
    expect(incomplete.resources).toEqual(resources);
    const retry = transitionEnvironment(incomplete, {
      type: 'stopping',
      at: at(7),
    });
    const stopped = transitionEnvironment(retry, {
      type: 'cleanup-recorded',
      at: at(8),
      cleanup: {
        at: at(8),
        status: 'complete',
        remaining: empty(),
        issues: [],
      },
    });
    expect(stopped.state).toBe('stopped');
    expect(stopped.resources).toEqual(resources);
    expect(manifest).toEqual(before);
    expect(() =>
      transitionEnvironment(stopped, { type: 'running', at: at(9) }),
    ).toThrow();
  });

  it('cancelがpreflight前でも空の所有環境だけを停止完了にできる', () => {
    const plan = createEnvironmentPlan(request());
    const stopping = transitionEnvironment(plan, {
      type: 'stopping',
      at: at(1),
    });
    expect(
      transitionEnvironment(stopping, {
        type: 'cleanup-recorded',
        at: at(2),
        cleanup: {
          at: at(2),
          status: 'complete',
          remaining: empty(),
          issues: [],
        },
      }).state,
    ).toBe('stopped');
  });

  it('preflightの既存resource・繰返し・時刻巻戻し・resource未記録を拒否する', () => {
    const { plan, preflight, manifest, resources } = fixture();
    expect(
      environmentEventSchema.safeParse({
        type: 'preflight',
        at: at(1),
        existingResourceCount: 1,
      }).success,
    ).toBe(false);
    expect(() =>
      transitionEnvironment(preflight, {
        type: 'preflight',
        at: at(2),
        existingResourceCount: 0,
      }),
    ).toThrow();
    expect(() =>
      transitionEnvironment(plan, {
        type: 'resources-recorded',
        at: at(1),
        resources,
      }),
    ).toThrow();
    expect(() =>
      transitionEnvironment(preflight, { type: 'running', at: at(2) }),
    ).toThrow();
    expect(() =>
      transitionEnvironment(manifest, { type: 'stopping', at: at(0) }),
    ).toThrow();
  });

  it('resource観測は追記し、既存identityの置換や消失を許可しない', () => {
    const { manifest, resources } = fixture();
    const repeated = transitionEnvironment(manifest, {
      type: 'resources-recorded',
      at: at(4),
      resources,
    });
    expect(repeated.resources).toEqual(resources);
    const retained = transitionEnvironment(repeated, {
      type: 'resources-recorded',
      at: at(5),
      resources: empty(),
    });
    expect(retained.resources).toEqual(resources);
    const changedImage = structuredClone(resources);
    changedImage.containers = changedImage.containers.map((resource) => ({
      ...resource,
      imageId: `sha256:${'9'.repeat(64)}`,
    }));
    expect(() =>
      transitionEnvironment(manifest, {
        type: 'resources-recorded',
        at: at(4),
        resources: changedImage,
      }),
    ).toThrow('置換');
    const replaced = structuredClone(resources);
    replaced.volumes = replaced.volumes.map((value) => ({
      ...value,
      createdAt: at(9),
    }));
    expect(() =>
      transitionEnvironment(manifest, {
        type: 'resources-recorded',
        at: at(4),
        resources: replaced,
      }),
    ).toThrow('置換');
  });

  it('残留resourceや未解消問題をcleanup完了に偽装できない', () => {
    const { manifest, resources } = fixture();
    const stopping = transitionEnvironment(manifest, {
      type: 'stopping',
      at: at(4),
    });
    expect(() =>
      transitionEnvironment(stopping, {
        type: 'cleanup-recorded',
        at: at(5),
        cleanup: {
          at: at(5),
          status: 'complete',
          remaining: resources,
          issues: [],
        },
      }),
    ).toThrow();
    expect(() =>
      transitionEnvironment(stopping, {
        type: 'cleanup-recorded',
        at: at(5),
        cleanup: {
          at: at(5),
          status: 'complete',
          remaining: empty(),
          issues: [
            {
              code: 'UNOWNED_RESOURCE',
              subject: 'volume',
              message: '確認できません。',
            },
          ],
        },
      }),
    ).toThrow();
    expect(() =>
      transitionEnvironment(stopping, {
        type: 'cleanup-recorded',
        at: at(5),
        cleanup: {
          at: at(6),
          status: 'complete',
          remaining: empty(),
          issues: [],
        },
      }),
    ).toThrow();
  });
});
