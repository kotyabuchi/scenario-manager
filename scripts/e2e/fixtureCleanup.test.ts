import { isNil } from 'ramda';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { cleanupFixture } from '../../e2e/fixtures/fixtureCleanup';
import {
  auth,
  block,
  createCleanupFixture,
  session,
  user,
} from './fixtures/environment/fixtureCleanup';

const mocks = vi.hoisted(() => ({
  createClient: vi.fn(),
  assertConnection: vi.fn(),
}));
vi.mock('@supabase/supabase-js', () => ({ createClient: mocks.createClient }));
vi.mock('./environmentCredentials', () => ({
  assertFixtureConnection: mocks.assertConnection,
}));
beforeEach(() => {
  vi.clearAllMocks();
  mocks.assertConnection.mockReset();
});
const setup = () => {
  const value = createCleanupFixture();
  mocks.createClient.mockReturnValue(value.client);
  return value;
};

describe('fixture cleanup', () => {
  it('所有接続だけでadminを作り、現行FKの子からexact IDで削除する', async () => {
    const value = setup();
    const other = {
      user_id: '01J00000000000000000000999',
      auth_user_id: '22222222-2222-4222-8222-222222222222',
    };
    value.rows.get('users')?.push(other);
    const result = await cleanupFixture(value.connection, value.journal);
    expect(result).toEqual({ status: 'complete', remaining: [], issues: [] });
    expect(value.deleted).toEqual([
      'game_schedule_time_blocks',
      'session_availability_time_blocks',
      'session_participants',
      'game_sessions',
      'scenarios',
      'users',
      'auth-user',
    ]);
    expect(value.rows.get('users')).toEqual([other]);
    expect(mocks.assertConnection).toHaveBeenCalledBefore(mocks.createClient);
    expect(mocks.createClient).toHaveBeenCalledWith(
      value.connection.manifest.apiUrl,
      'admin-only',
      expect.objectContaining({
        auth: {
          persistSession: false,
          autoRefreshToken: false,
          detectSessionInUrl: false,
        },
      }),
    );
    expect(
      value.observed
        .filter((entry) => entry.deleting)
        .every((entry) => Object.keys(entry.filters).length > 0),
    ).toBe(true);
  });

  it('接続検査失敗時はSDKを生成しない', async () => {
    const value = setup();
    mocks.assertConnection.mockRejectedValue(new Error('所有外'));
    await expect(
      cleanupFixture(value.connection, value.journal),
    ).rejects.toThrow('所有外');
    expect(mocks.createClient).not.toHaveBeenCalled();
  });

  it('lease不一致またはownerTag改変は削除前に拒否する', async () => {
    const value = setup();
    value.connection.lease = {
      ...value.connection.lease,
      ownerNonce: '33333333-3333-4333-8333-333333333333',
    };
    await expect(
      cleanupFixture(value.connection, value.journal),
    ).rejects.toThrow('所有者');
    expect(mocks.createClient).not.toHaveBeenCalled();
  });

  it('同じIDでもAuthの所有タグが違えば全関連行を保護する', async () => {
    const value = setup();
    const actual = value.authRows.get(auth.id);
    if (actual) actual.app_metadata.e2e_fixture_owner = 'different-owner';
    const result = await cleanupFixture(value.connection, value.journal);
    expect(result.status).toBe('incomplete');
    expect(
      result.issues.some((issue) => issue.code === 'OWNERSHIP_MISMATCH'),
    ).toBe(true);
    expect(value.deleted).toEqual([]);
  });

  it('app UUID対応が差し替わった行とその親・子を削除しない', async () => {
    const value = setup();
    value.rows.set('users', [
      { user_id: user.id, auth_user_id: 'foreign-auth' },
    ]);
    const result = await cleanupFixture(value.connection, value.journal);
    expect(result.status).toBe('incomplete');
    expect(value.deleted).toEqual([]);
  });

  it('予約だけの実作成行も照合してrollbackする', async () => {
    const value = setup();
    value.manifest.resources.forEach((entry) => {
      entry.status = 'reserved';
    });
    expect((await cleanupFixture(value.connection, value.journal)).status).toBe(
      'complete',
    );
    expect(value.deleted).toHaveLength(7);
  });

  it('未作成/既に削除済みIDは成功として扱う', async () => {
    const value = setup();
    value.rows.clear();
    value.authRows.clear();
    expect((await cleanupFixture(value.connection, value.journal)).status).toBe(
      'complete',
    );
    expect(value.deleted).toEqual([]);
  });

  it.each([
    'auth-user',
    'users',
    'game_sessions',
    'session_participants',
    'game_schedule_time_blocks',
  ] as const)('削除済みの%sが再出現したら再削除せず残留を報告する', async (kind) => {
    const value = setup();
    const entry = value.manifest.resources.find(
      (item) => item.resource.kind === kind,
    );
    if (isNil(entry)) throw new Error('fixture不足');
    entry.status = 'removed';
    const result = await cleanupFixture(value.connection, value.journal);
    expect(result.status).toBe('incomplete');
    expect(result.remaining).toContainEqual(entry.resource);
    expect(
      result.issues.some((issue) => issue.code === 'RESOURCE_REAPPEARED'),
    ).toBe(true);
    expect(value.deleted).not.toContain(kind);
    expect(value.deleted).not.toContain('auth-user');
  });

  it('全IDがremovedで実体も消えていれば再cleanupは完了する', async () => {
    const value = setup();
    value.manifest.resources.forEach((entry) => {
      entry.status = 'removed';
    });
    value.rows.clear();
    value.authRows.clear();
    expect((await cleanupFixture(value.connection, value.journal)).status).toBe(
      'complete',
    );
    expect(value.deleted).toEqual([]);
  });

  it('delete成功応答だけでは完了せず、行残留を再観測する', async () => {
    const value = setup();
    value.noOpDeletes.add('game_schedule_time_blocks');
    const result = await cleanupFixture(value.connection, value.journal);
    expect(result.status).toBe('incomplete');
    expect(result.issues).toContainEqual({
      code: 'DELETE_FAILED',
      resource: `game_schedule_time_blocks:${block.id}`,
    });
    expect(value.deleted).not.toContain('game_sessions');
    expect(value.deleted).not.toContain('auth-user');
  });

  it('delete errorを全て検出し、親削除によるcascadeで隠さない', async () => {
    const value = setup();
    value.deleteErrors.add('game_schedule_time_blocks');
    value.deleteErrors.add('session_availability_time_blocks');
    const result = await cleanupFixture(value.connection, value.journal);
    expect(
      result.issues.filter((issue) => issue.code === 'DELETE_FAILED'),
    ).toHaveLength(2);
    expect(
      result.remaining.some((resource) => resource.kind === 'game_sessions'),
    ).toBe(true);
    expect(value.deleted).not.toContain('users');
    expect(JSON.stringify(result)).not.toContain('secret-error');
  });

  it('Authの404以外のエラーは不在とみなさない', async () => {
    const value = setup();
    value.observeErrors.add('auth-user');
    const result = await cleanupFixture(value.connection, value.journal);
    expect(result.status).toBe('incomplete');
    expect(value.deleted).toEqual([]);
  });

  it('RPC生成blockは所有session内で列挙し、journal保存後にexact ID削除する', async () => {
    const value = setup();
    value.manifest.resources = value.manifest.resources.filter(
      (entry) => entry.resource.kind !== 'game_schedule_time_blocks',
    );
    const result = await cleanupFixture(value.connection, value.journal);
    expect(result.status).toBe('complete');
    expect(value.journal.reserve).toHaveBeenCalledWith(block);
    expect(value.journal.record).toHaveBeenCalledWith(block);
    expect(
      value.observed
        .filter(
          (entry) =>
            !entry.deleting &&
            entry.table.endsWith('time_blocks') &&
            Object.keys(entry.filters).length === 1 &&
            'session_id' in entry.filters,
        )
        .every((entry) => entry.filters.session_id === session.id),
    ).toBe(true);
  });

  it('新規blockの予約保存失敗時はID削除も親cascadeも実行しない', async () => {
    const value = setup();
    value.manifest.resources = value.manifest.resources.filter(
      (entry) => entry.resource.kind !== 'game_schedule_time_blocks',
    );
    vi.mocked(value.journal.reserve).mockRejectedValue(
      new Error('save failed'),
    );
    const result = await cleanupFixture(value.connection, value.journal);
    expect(
      result.issues.some((issue) => issue.code === 'JOURNAL_SAVE_FAILED'),
    ).toBe(true);
    expect(value.deleted).not.toContain('game_schedule_time_blocks');
    expect(value.deleted).not.toContain('game_sessions');
  });

  it('新規blockの成功記録保存失敗でも予約済IDはrollbackする', async () => {
    const value = setup();
    value.manifest.resources = value.manifest.resources.filter(
      (entry) => entry.resource.kind !== 'game_schedule_time_blocks',
    );
    vi.mocked(value.journal.record).mockRejectedValue(new Error('save failed'));
    const result = await cleanupFixture(value.connection, value.journal);
    expect(result.status).toBe('incomplete');
    expect(result.remaining).toEqual([]);
    expect(value.deleted).toContain('game_schedule_time_blocks');
  });

  it('block一覧の取得失敗はparent cleanupを止める', async () => {
    const value = setup();
    value.discoveryErrors.add('session_availability_time_blocks');
    const result = await cleanupFixture(value.connection, value.journal);
    expect(result.status).toBe('incomplete');
    expect(value.deleted).not.toContain('game_sessions');
  });

  it('他actorのblockは所有IDとして取り込まず親も保護する', async () => {
    const value = setup();
    value.rows.get('game_schedule_time_blocks')?.push({
      game_schedule_time_block_id: '01J00000000000000000000999',
      session_id: session.id,
      created_by: '01J00000000000000000000888',
    });
    const result = await cleanupFixture(value.connection, value.journal);
    expect(result.status).toBe('incomplete');
    expect(value.journal.reserve).not.toHaveBeenCalled();
    expect(value.deleted).not.toContain('game_sessions');
  });

  it('cleanup保存失敗を正常完了としない', async () => {
    const value = setup();
    vi.mocked(value.journal.finishCleanup).mockRejectedValue(
      new Error('disk failed'),
    );
    const result = await cleanupFixture(value.connection, value.journal);
    expect(result.status).toBe('incomplete');
    expect(result.remaining).toEqual([]);
    expect(result.issues).toContainEqual({
      code: 'JOURNAL_SAVE_FAILED',
      resource: 'manifest',
    });
  });
});
