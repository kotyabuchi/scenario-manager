import { describe, expect, it, vi } from 'vitest';

import { runEnvironment } from './environment';
import { createEnvironmentPlan } from './environmentOwnership';

import type {
  EnvironmentIssue,
  EnvironmentLease,
  EnvironmentManifest,
  EnvironmentResources,
} from './environmentSchema';

type Operations = Parameters<typeof runEnvironment>[1];
const empty = (): EnvironmentResources => ({
  containers: [],
  networks: [],
  volumes: [],
});

const fixture = () => {
  const manifest = createEnvironmentPlan({
    runId: '012345abcdef',
    ownerNonce: '58e0fb3b-5c82-4fb6-8867-cf77953c3a87',
    repoRoot: '/repository',
    worktreeRoot: '/worktrees/isolated',
    commit: 'a'.repeat(40),
    ports: { api: 57321, db: 57322, shadow: 57320 },
    inputHashes: {
      config: 'b'.repeat(64),
      migrations: 'c'.repeat(64),
      seed: 'd'.repeat(64),
    },
    createdAt: new Date(Date.now() - 60_000).toISOString(),
  });
  const lease: EnvironmentLease = {
    runId: manifest.runId,
    ownerNonce: manifest.ownerNonce,
    projectId: manifest.projectId,
    worktreeRoot: manifest.worktreeRoot,
  };
  const createdAt = new Date(Date.now() - 1_000).toISOString();
  const resources: EnvironmentResources = {
    containers: [
      {
        id: '1'.repeat(64),
        name: `supabase_db_${manifest.projectId}`,
        projectLabel: manifest.projectId,
        createdAt,
        imageId: `sha256:${'2'.repeat(64)}`,
      },
    ],
    networks: [
      {
        id: '3'.repeat(64),
        name: `supabase_network_${manifest.projectId}`,
        projectLabel: manifest.projectId,
        createdAt,
      },
    ],
    volumes: [
      {
        name: `supabase_db_${manifest.projectId}`,
        projectLabel: manifest.projectId,
        createdAt,
      },
    ],
  };
  let current = empty();
  const saved: EnvironmentManifest[] = [];
  const events: string[] = [];
  const operations = {
    docker: {
      assertFreshProject: vi.fn(async (_project: string) => {
        events.push('preflight');
      }),
      observe: vi.fn(async (_project: string) => {
        events.push('observe');
        return structuredClone(current);
      }),
      remove: vi.fn(
        async (selected: EnvironmentResources): Promise<EnvironmentIssue[]> => {
          events.push('remove');
          current = {
            containers: current.containers.filter(
              (item) =>
                !selected.containers.some((target) => target.id === item.id),
            ),
            networks: current.networks.filter(
              (item) =>
                !selected.networks.some((target) => target.id === item.id),
            ),
            volumes: current.volumes.filter(
              (item) =>
                !selected.volumes.some((target) => target.name === item.name),
            ),
          };
          return [];
        },
      ),
    },
    save: vi.fn(async (value: EnvironmentManifest) => {
      events.push(`save:${value.state}`);
      saved.push(structuredClone(value));
    }),
    readLease: vi.fn(async () => {
      events.push('lease');
      return structuredClone(lease);
    }),
    start: vi.fn(async () => {
      events.push('start');
      current = structuredClone(resources);
    }),
    verify: vi.fn(async (_value: EnvironmentManifest) => {
      events.push('verify');
    }),
    release: vi.fn(async () => {
      events.push('release');
    }),
  } satisfies Operations;
  return {
    manifest,
    lease,
    resources,
    operations,
    saved,
    events,
    setResources: (value: EnvironmentResources) => {
      current = structuredClone(value);
    },
    remaining: () => structuredClone(current),
  };
};

describe('runEnvironmentの所有環境ライフサイクル', () => {
  it('事前名前衝突はstart/removeへ進まずlockを解放する', async () => {
    const { manifest, operations } = fixture();
    operations.docker.assertFreshProject.mockRejectedValueOnce(
      new Error('name conflict'),
    );
    const result = await runEnvironment(manifest, operations);
    expect(result.passed).toBe(false);
    expect(operations.start).not.toHaveBeenCalled();
    expect(operations.docker.observe).not.toHaveBeenCalled();
    expect(operations.docker.remove).not.toHaveBeenCalled();
    expect(operations.release).toHaveBeenCalledTimes(1);
  });

  it('事前label観測に既存resourceがあっても再利用・削除しない', async () => {
    const { manifest, operations, setResources, resources } = fixture();
    setResources(resources);
    const result = await runEnvironment(manifest, operations);
    expect(result.passed).toBe(false);
    expect(operations.start).not.toHaveBeenCalled();
    expect(operations.docker.remove).not.toHaveBeenCalled();
    expect(operations.release).toHaveBeenCalledTimes(1);
  });

  it('正常時もexact resourcesを削除して不存在確認後にlockを解放する', async () => {
    const { manifest, operations, resources, remaining, events, saved } =
      fixture();
    const result = await runEnvironment(manifest, operations);
    expect(result.passed).toBe(true);
    expect(result.manifest.state).toBe('stopped');
    expect(result.manifest.cleanup?.status).toBe('complete');
    expect(operations.verify).toHaveBeenCalledTimes(1);
    expect(operations.docker.remove).toHaveBeenCalledWith(resources);
    expect(remaining()).toEqual(empty());
    expect(events.indexOf('preflight')).toBeLessThan(events.indexOf('start'));
    expect(events.slice(events.indexOf('remove'))).toEqual([
      'remove',
      'observe',
      'save:stopped',
      'release',
    ]);
    expect(saved.some((item) => item.state === 'running')).toBe(true);
  });

  it('start途中の失敗で作られたnetworkだけを記録して片付ける', async () => {
    const { manifest, operations, resources, setResources, remaining } =
      fixture();
    const partial = { ...empty(), networks: resources.networks };
    operations.start.mockImplementationOnce(async () => {
      setResources(partial);
      throw new Error('partial start');
    });
    const result = await runEnvironment(manifest, operations);
    expect(result.passed).toBe(false);
    expect(result.manifest.resources).toEqual(partial);
    expect(result.manifest.cleanup?.status).toBe('complete');
    expect(operations.verify).not.toHaveBeenCalled();
    expect(operations.docker.remove).toHaveBeenCalledWith(partial);
    expect(remaining()).toEqual(empty());
    expect(operations.release).toHaveBeenCalledTimes(1);
  });

  it.each([
    new Error('verify failed'),
    new DOMException('cancelled', 'AbortError'),
  ])('検証失敗・中断でも所有resourceを片付けて失敗を返す', async (error) => {
    const { manifest, operations, resources } = fixture();
    operations.verify.mockRejectedValueOnce(error);
    const result = await runEnvironment(manifest, operations);
    expect(result.passed).toBe(false);
    expect(result.manifest.failure?.code).toBe('ENVIRONMENT_RUN_FAILED');
    expect(result.manifest.cleanup?.status).toBe('complete');
    expect(operations.docker.remove).toHaveBeenCalledWith(resources);
    expect(operations.release).toHaveBeenCalledTimes(1);
  });

  it('nonceが異なるleaseでは検証・削除せずlockを保持する', async () => {
    const { manifest, operations, lease, resources, remaining } = fixture();
    operations.readLease.mockResolvedValue({
      ...lease,
      ownerNonce: 'f70c3bad-e286-41f8-8214-36d3c11a08a5',
    });
    const result = await runEnvironment(manifest, operations);
    expect(result.passed).toBe(false);
    expect(operations.verify).not.toHaveBeenCalled();
    expect(operations.docker.remove).not.toHaveBeenCalled();
    expect(operations.release).not.toHaveBeenCalled();
    expect(remaining()).toEqual(resources);
  });

  it('cleanup観測に失敗すると削除候補を推測せずlockを保持する', async () => {
    const { manifest, operations, resources } = fixture();
    operations.docker.observe
      .mockResolvedValueOnce(empty())
      .mockResolvedValueOnce(resources)
      .mockRejectedValueOnce(new Error('cannot observe cleanup'));
    const result = await runEnvironment(manifest, operations);
    expect(result.passed).toBe(false);
    expect(result.manifest.failure?.code).toBe('CLEANUP_UNVERIFIED');
    expect(operations.docker.remove).not.toHaveBeenCalled();
    expect(operations.release).not.toHaveBeenCalled();
  });

  it('削除の例外と残留がある場合はlockを解放しない', async () => {
    const { manifest, operations, resources, remaining } = fixture();
    operations.docker.remove.mockRejectedValueOnce(new Error('remove failed'));
    const result = await runEnvironment(manifest, operations);
    expect(result.passed).toBe(false);
    expect(result.manifest.failure?.code).toBe('CLEANUP_UNVERIFIED');
    expect(operations.release).not.toHaveBeenCalled();
    expect(remaining()).toEqual(resources);
  });

  it('removeが問題一覧を返す場合も残留を記録しlockを保持する', async () => {
    const { manifest, operations, resources } = fixture();
    operations.docker.remove.mockResolvedValueOnce([
      {
        code: 'REMOVE_FAILED',
        subject: 'container:owned',
        message: '削除できません。',
      },
    ]);
    const result = await runEnvironment(manifest, operations);
    expect(result.passed).toBe(false);
    expect(result.manifest.cleanup).toMatchObject({
      status: 'incomplete',
      remaining: resources,
    });
    expect(
      result.manifest.cleanup?.issues.map((issue) => issue.code),
    ).toContain('REMOVE_FAILED');
    expect(operations.release).not.toHaveBeenCalled();
  });

  it('失敗状態journalの保存が失敗してもfinally自体は所有cleanupを実行する', async () => {
    const { manifest, operations, resources, remaining } = fixture();
    operations.verify.mockRejectedValueOnce(new Error('verification failed'));
    let rejected = false;
    operations.save.mockImplementation(async (value) => {
      if (!rejected && value.state === 'failed') {
        rejected = true;
        throw new Error('failed journal write');
      }
    });
    await expect(runEnvironment(manifest, operations)).rejects.toThrow(
      'failed journal write',
    );
    expect(operations.docker.remove).toHaveBeenCalledWith(resources);
    expect(remaining()).toEqual(empty());
    expect(operations.release).toHaveBeenCalledTimes(1);
  });

  it('remove後の不存在観測が失敗してもcleanup完了を推測しない', async () => {
    const { manifest, operations, resources } = fixture();
    operations.docker.observe
      .mockResolvedValueOnce(empty())
      .mockResolvedValueOnce(resources)
      .mockResolvedValueOnce(resources)
      .mockResolvedValueOnce(resources)
      .mockRejectedValueOnce(new Error('after-remove observation failed'));
    const result = await runEnvironment(manifest, operations);
    expect(result.passed).toBe(false);
    expect(operations.docker.remove).toHaveBeenCalledWith(resources);
    expect(operations.release).not.toHaveBeenCalled();
  });

  it('起動後journalの一度だけの保存失敗でもfinallyでcleanupする', async () => {
    const { manifest, operations, resources } = fixture();
    let failed = false;
    operations.save.mockImplementation(async (value) => {
      if (!failed && value.state === 'running') {
        failed = true;
        throw new Error('journal write failed');
      }
    });
    const result = await runEnvironment(manifest, operations);
    expect(result.passed).toBe(false);
    expect(operations.docker.remove).toHaveBeenCalledWith(resources);
    expect(operations.release).toHaveBeenCalledTimes(1);
  });

  it('開始前の保存が常に失敗しても起動せずfinallyでlockを解放する', async () => {
    const { manifest, operations } = fixture();
    operations.save.mockRejectedValue(new Error('journal unavailable'));
    await expect(runEnvironment(manifest, operations)).rejects.toThrow();
    expect(operations.start).not.toHaveBeenCalled();
    expect(operations.docker.remove).not.toHaveBeenCalled();
    expect(operations.release).toHaveBeenCalledTimes(1);
  });

  it('cleanup完了journalを保存できなければ終端遷移を偽装せずlockを保持する', async () => {
    const { manifest, operations, resources, remaining } = fixture();
    operations.save.mockImplementation(async (value) => {
      if (value.state === 'stopped') throw new Error('final journal failed');
    });
    const result = await runEnvironment(manifest, operations);
    expect(result.passed).toBe(false);
    expect(operations.docker.remove).toHaveBeenCalledWith(resources);
    expect(remaining()).toEqual(empty());
    expect(result.manifest.state).toBe('failed');
    expect(result.manifest.cleanup).toBeNull();
    expect(result.manifest.failure?.code).toBe('CLEANUP_UNVERIFIED');
    expect(operations.release).not.toHaveBeenCalled();
  });

  it('resource停止完了後もlock解放が失敗したら成功扱いにしない', async () => {
    const { manifest, operations } = fixture();
    operations.release.mockRejectedValueOnce(new Error('lease mismatch'));
    const result = await runEnvironment(manifest, operations);
    expect(result.manifest.cleanup?.status).toBe('complete');
    expect(result.passed).toBe(false);
  });
});
