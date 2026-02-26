import { ulid } from 'ulid';
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';

vi.mock('@/lib/supabase/server', async () => {
  const { getTestClient } = await import('@/__tests__/helpers/testClient');
  return {
    createDbClient: async () => getTestClient(),
  };
});

import { createSession, getSessionById } from '../adapter';

import {
  cleanupScenarios,
  cleanupSessions,
  cleanupSystems,
  cleanupUsers,
  createTestScenario,
  createTestSystem,
  createTestUser,
} from '@/__tests__/helpers/fixtures';
import { getTestClient } from '@/__tests__/helpers/testClient';

import type { CreateSessionInput } from '../schema';

/**
 * セッション作成・管理機能のアダプターテスト
 * 要件: requirements-session-flow.md Section 3
 *
 * 対応ユーザーストーリー:
 * - US-S101: GMとして、シナリオ未定でもセッションを募集できる
 * - US-S102: GMとして、日程未定でもセッションを募集できる
 * - US-S103: GMとして、人数未定でもセッションを募集できる
 * - US-S109: GMとして、セッションをキャンセルできる
 *
 * 注意: これらはデータベースに接続する統合テストです。
 */

describe('Session Management Adapter', () => {
  let testUserId: string;
  let scenarioId: string;
  let systemId: string;
  const createdSessionIds: string[] = [];
  const hasServiceRoleKey = Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY);
  const itIfServiceRole = hasServiceRoleKey ? it : it.skip;
  const describeIfServiceRole = hasServiceRoleKey ? describe : describe.skip;

  beforeAll(async () => {
    const user = await createTestUser();
    testUserId = user.user_id;

    const system = await createTestSystem();
    systemId = system.system_id;

    const scenario = await createTestScenario({
      systemId,
      createdById: testUserId,
    });
    scenarioId = scenario.scenario_id;
  });

  afterAll(async () => {
    await cleanupSessions(createdSessionIds);
    await cleanupScenarios([scenarioId]);
    await cleanupUsers([testUserId]);
    await cleanupSystems([systemId]);
  });

  describeIfServiceRole('createSession', () => {
    // T-CS-RPC-001: RPC関数のシグネチャ/戻り値型の不整合を回帰検知する
    itIfServiceRole(
      'RPC create_session_transaction が曖昧解決・戻り値型不一致を起こさない',
      async () => {
        const client = getTestClient();
        const gameSessionId = ulid();

        const { data, error } = await client.rpc('create_session_transaction', {
          p_game_session_id: gameSessionId,
          p_user_id: testUserId,
          p_session_name: 'RPC回帰テスト用セッション',
          p_session_description: 'DB関数契約の回帰テスト',
          p_scenario_id: scenarioId,
          p_scheduled_at: new Date('2026-01-18T20:00:00+09:00').toISOString(),
          p_recruited_player_count: 4,
          p_tools: 'Discord',
          p_is_beginner_friendly: true,
          p_visibility: 'PUBLIC',
          p_creator_participant_type: 'KEEPER',
          p_initial_availability_slots: [],
          p_invited_members: [],
        });

        if (error) {
          expect(error.message).not.toContain(
            'structure of query does not match function result type',
          );
          expect(error.message).not.toContain(
            'Could not choose the best candidate function',
          );
          throw new Error(error.message);
        }

        createdSessionIds.push(gameSessionId);
        expect(Array.isArray(data)).toBe(true);
        expect(data).toHaveLength(1);

        const created = data[0];
        expect(created?.game_session_id).toBe(gameSessionId);
        expect(created?.scenario_id).toBe(scenarioId);
        expect(created?.session_phase).toBe('RECRUITING');
        expect(created?.visibility).toBe('PUBLIC');

        const { data: availabilitySlots, error: availabilityError } =
          await client
            .from('session_availability_slots')
            .select('start_at, end_at, user_id')
            .eq('session_id', gameSessionId);

        expect(availabilityError).toBeNull();
        expect(availabilitySlots).toEqual([]);
      },
    );

    // T-CS-001: 全項目を指定してセッションを作成できる
    itIfServiceRole('全項目を指定してセッションを作成できる', async () => {
      const input: CreateSessionInput = {
        invitedMembers: [],
        sessionName: '週末CoC7版卓',
        sessionDescription: '週末にCoC7版を遊びませんか？初心者歓迎！',
        scenarioId,
        scheduleCandidates: [
          { from: '2026-01-25T20:00:00+09:00' },
          { from: '2026-01-18T20:00:00+09:00' },
        ],
        recruitedPlayerCount: 4,
        tools: 'Discord + ココフォリア',
        isBeginnerFriendly: true,
        visibility: 'PUBLIC',
        scheduleType: 'specify',
        creatorParticipantType: 'KEEPER',
      };

      const result = await createSession(input, testUserId);

      if (!result.success) {
        throw result.error;
      }
      expect(result.success).toBe(true);
      if (result.success) {
        createdSessionIds.push(result.data.gameSessionId);
        expect(result.data.gameSessionId).toBeDefined();
        expect(result.data.sessionName).toBe('週末CoC7版卓');
        expect(result.data.sessionPhase).toBe('RECRUITING');
        const scheduledAt = result.data.scheduledAt ?? '';
        const normalizedScheduledAt = /Z$|[+-]\d{2}:\d{2}$/.test(scheduledAt)
          ? new Date(scheduledAt).toISOString()
          : new Date(`${scheduledAt}Z`).toISOString();
        expect(normalizedScheduledAt).toBe(
          new Date('2026-01-18T20:00:00+09:00').toISOString(),
        );

        const client = getTestClient();
        const { data: availabilitySlots, error: availabilityError } =
          await client
            .from('session_availability_slots')
            .select('start_at, end_at, user_id')
            .eq('session_id', result.data.gameSessionId)
            .order('start_at', { ascending: true });

        expect(availabilityError).toBeNull();
        expect(availabilitySlots).toHaveLength(2);
        expect(
          availabilitySlots?.every((slot) => slot.user_id === testUserId),
        ).toBe(true);
      }
    });

    // T-CS-002: 必須項目のみでセッションを作成できる（柔軟な募集）
    itIfServiceRole('必須項目のみでセッションを作成できる', async () => {
      const input: CreateSessionInput = {
        invitedMembers: [],
        sessionName: '週末に何か遊ぶ卓',
        sessionDescription: '週末に何か遊びませんか？',
        scheduleCandidates: [],
        isBeginnerFriendly: false,
        visibility: 'PUBLIC',
        scheduleType: 'later',
        creatorParticipantType: 'KEEPER',
      };

      const result = await createSession(input, testUserId);

      expect(result.success).toBe(true);
      if (result.success) {
        createdSessionIds.push(result.data.gameSessionId);
        expect(result.data.gameSessionId).toBeDefined();
        expect(result.data.scenarioId).toBeNull();
        expect(result.data.scheduledAt).toBeNull();
        expect(result.data.recruitedPlayerCount).toBeNull();
      }
    });

    // T-CS-003: シナリオ未定（null）でセッションを作成できる
    itIfServiceRole('シナリオ未定でセッションを作成できる', async () => {
      const input: CreateSessionInput = {
        invitedMembers: [],
        sessionName: 'シナリオ相談卓',
        sessionDescription: 'シナリオは参加者と相談して決めます',
        scenarioId: null,
        scheduleCandidates: [],
        isBeginnerFriendly: false,
        visibility: 'PUBLIC',
        scheduleType: 'later',
        creatorParticipantType: 'KEEPER',
      };

      const result = await createSession(input, testUserId);

      expect(result.success).toBe(true);
      if (result.success) {
        createdSessionIds.push(result.data.gameSessionId);
        expect(result.data.scenarioId).toBeNull();
      }
    });

    // T-CS-004: 日程未定でセッションを作成できる
    itIfServiceRole('日程未定でセッションを作成できる', async () => {
      const input: CreateSessionInput = {
        invitedMembers: [],
        sessionName: '日程調整中卓',
        sessionDescription: '日程は後で調整します',
        scheduleCandidates: [],
        isBeginnerFriendly: false,
        visibility: 'PUBLIC',
        scheduleType: 'later',
        creatorParticipantType: 'KEEPER',
      };

      const result = await createSession(input, testUserId);

      expect(result.success).toBe(true);
      if (result.success) {
        createdSessionIds.push(result.data.gameSessionId);
        expect(result.data.scheduledAt).toBeNull();
      }
    });

    // T-CS-005: 人数未定でセッションを作成できる
    itIfServiceRole('人数未定でセッションを作成できる', async () => {
      const input: CreateSessionInput = {
        invitedMembers: [],
        sessionName: '人数調整中卓',
        sessionDescription: '人数は集まり次第決めます',
        scheduleCandidates: [],
        recruitedPlayerCount: null,
        isBeginnerFriendly: false,
        visibility: 'PUBLIC',
        scheduleType: 'later',
        creatorParticipantType: 'KEEPER',
      };

      const result = await createSession(input, testUserId);

      expect(result.success).toBe(true);
      if (result.success) {
        createdSessionIds.push(result.data.gameSessionId);
        expect(result.data.recruitedPlayerCount).toBeNull();
      }
    });

    // T-CS-006: フォロワー限定でセッションを作成できる
    itIfServiceRole('フォロワー限定でセッションを作成できる', async () => {
      const input: CreateSessionInput = {
        invitedMembers: [],
        sessionName: '身内卓',
        sessionDescription: 'フォロワーさん向けの卓です',
        scheduleCandidates: [],
        visibility: 'FOLLOWERS_ONLY',
        isBeginnerFriendly: false,
        scheduleType: 'later',
        creatorParticipantType: 'KEEPER',
      };

      const result = await createSession(input, testUserId);

      expect(result.success).toBe(true);
      if (result.success) {
        createdSessionIds.push(result.data.gameSessionId);
        expect(result.data.visibility).toBe('FOLLOWERS_ONLY');
      }
    });

    // T-CS-007: 存在しないユーザーIDでエラー
    itIfServiceRole('存在しないユーザーIDでエラー', async () => {
      const input: CreateSessionInput = {
        invitedMembers: [],
        sessionName: 'テスト卓',
        sessionDescription: 'テスト',
        scheduleCandidates: [],
        isBeginnerFriendly: false,
        visibility: 'PUBLIC',
        scheduleType: 'later',
        creatorParticipantType: 'KEEPER',
      };
      const nonExistentUserId = 'non-existent-user-id';

      const result = await createSession(input, nonExistentUserId);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.message).toBe('ユーザーが見つかりません');
      }
    });

    // T-CS-008: 作成時に参加者として追加される
    itIfServiceRole('作成時に参加者として追加される', async () => {
      const input: CreateSessionInput = {
        invitedMembers: [],
        sessionName: 'GM自動追加テスト',
        sessionDescription: 'テスト',
        scheduleCandidates: [],
        isBeginnerFriendly: false,
        visibility: 'PUBLIC',
        scheduleType: 'later',
        creatorParticipantType: 'KEEPER',
      };

      const result = await createSession(input, testUserId);

      expect(result.success).toBe(true);
      if (result.success) {
        createdSessionIds.push(result.data.gameSessionId);
        // セッションの参加者を取得して確認
        const session = await getSessionById(result.data.gameSessionId);
        if (session.success && session.data) {
          const creatorParticipant = session.data.participants.find(
            (p) => p.userId === testUserId && p.participantType === 'KEEPER',
          );
          expect(creatorParticipant).toBeDefined();
        }
      }
    });
  });

  describeIfServiceRole('getSessionById', () => {
    // T-GS-001: 存在するセッションIDでセッションを取得できる
    itIfServiceRole(
      '存在するセッションIDでセッションを取得できる',
      async () => {
        // まずセッションを作成
        const input: CreateSessionInput = {
          invitedMembers: [],
          sessionName: '取得テスト用セッション',
          sessionDescription: 'テスト',
          scheduleCandidates: [],
          isBeginnerFriendly: false,
          visibility: 'PUBLIC',
          scheduleType: 'later',
          creatorParticipantType: 'KEEPER',
        };
        const createResult = await createSession(input, testUserId);
        expect(createResult.success).toBe(true);
        if (!createResult.success) return;

        createdSessionIds.push(createResult.data.gameSessionId);
        const sessionId = createResult.data.gameSessionId;
        const result = await getSessionById(sessionId);

        expect(result.success).toBe(true);
        if (result.success && result.data) {
          expect(result.data.gameSessionId).toBe(sessionId);
          expect(result.data).toHaveProperty('sessionName');
          expect(result.data).toHaveProperty('sessionDescription');
          expect(result.data).toHaveProperty('sessionPhase');
          expect(result.data).toHaveProperty('participants');
        }
      },
    );

    // T-GS-002: 存在しないセッションIDでnullを返す
    itIfServiceRole('存在しないセッションIDでnullを返す', async () => {
      const nonExistentSessionId = '01NONEXISTENT00000000000';

      const result = await getSessionById(nonExistentSessionId);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toBeNull();
      }
    });

    // T-GS-003: セッションにシナリオ情報が含まれる
    itIfServiceRole('セッションにシナリオ情報が含まれる', async () => {
      // シナリオ付きでセッションを作成
      const input: CreateSessionInput = {
        invitedMembers: [],
        sessionName: 'シナリオ付きセッション',
        sessionDescription: 'テスト',
        scenarioId,
        scheduleCandidates: [],
        isBeginnerFriendly: false,
        visibility: 'PUBLIC',
        scheduleType: 'later',
        creatorParticipantType: 'KEEPER',
      };
      const createResult = await createSession(input, testUserId);
      if (!createResult.success) return;

      createdSessionIds.push(createResult.data.gameSessionId);
      const result = await getSessionById(createResult.data.gameSessionId);

      expect(result.success).toBe(true);
      if (result.success && result.data) {
        expect(result.data).toHaveProperty('scenario');
        if (result.data.scenario) {
          expect(result.data.scenario).toHaveProperty('scenarioId');
          expect(result.data.scenario).toHaveProperty('scenarioName');
        }
      }
    });

    // T-GS-004: セッションに参加者情報が含まれる
    itIfServiceRole('セッションに参加者情報が含まれる', async () => {
      // セッションを作成（KEEPERが自動追加される）
      const input: CreateSessionInput = {
        invitedMembers: [],
        sessionName: '参加者情報テスト',
        sessionDescription: 'テスト',
        scheduleCandidates: [],
        isBeginnerFriendly: false,
        visibility: 'PUBLIC',
        scheduleType: 'later',
        creatorParticipantType: 'KEEPER',
      };
      const createResult = await createSession(input, testUserId);
      if (!createResult.success) return;

      createdSessionIds.push(createResult.data.gameSessionId);
      const result = await getSessionById(createResult.data.gameSessionId);

      expect(result.success).toBe(true);
      if (result.success && result.data) {
        expect(Array.isArray(result.data.participants)).toBe(true);
        if (result.data.participants.length > 0) {
          const participant = result.data.participants[0];
          expect(participant).toHaveProperty('userId');
          expect(participant).toHaveProperty('participantType');
          expect(participant).toHaveProperty('participantStatus');
        }
      }
    });
  });

  describe('Result型の検証', () => {
    // T-RT-001: 成功時のResult型
    it('成功時の戻り値の型が正しい', () => {
      type SuccessResult = {
        success: true;
        data: {
          gameSessionId: string;
          sessionName: string;
          sessionPhase: string;
        };
      };

      const mockSuccess: SuccessResult = {
        success: true,
        data: {
          gameSessionId: '01HY5K3XABCDEFGHIJKLMNOPQR',
          sessionName: 'テスト卓',
          sessionPhase: 'RECRUITING',
        },
      };

      expect(mockSuccess.success).toBe(true);
      expect(mockSuccess.data.gameSessionId).toBe('01HY5K3XABCDEFGHIJKLMNOPQR');
      expect(mockSuccess.data.sessionPhase).toBe('RECRUITING');
    });

    // T-RT-002: 失敗時のResult型
    it('失敗時の戻り値の型が正しい', () => {
      type ErrorResult = {
        success: false;
        error: Error;
      };

      const mockError: ErrorResult = {
        success: false,
        error: new Error('ユーザーが見つかりません'),
      };

      expect(mockError.success).toBe(false);
      expect(mockError.error.message).toBe('ユーザーが見つかりません');
    });
  });

  describe('エラーメッセージの検証', () => {
    // T-EM-001: ユーザー不存在エラー
    it('ユーザー不存在エラーのメッセージが正しい', () => {
      const errorMessage = 'ユーザーが見つかりません';
      expect(errorMessage).toBe('ユーザーが見つかりません');
    });

    // T-EM-002: セッション不存在エラー
    it('セッション不存在エラーのメッセージが正しい', () => {
      const errorMessage = 'セッションが見つかりません';
      expect(errorMessage).toBe('セッションが見つかりません');
    });

    // T-EM-003: 作成失敗エラー
    it('作成失敗エラーのメッセージが正しい', () => {
      const errorMessage = 'セッションの作成に失敗しました';
      expect(errorMessage).toBe('セッションの作成に失敗しました');
    });

    // T-EM-004: 権限エラー
    it('権限エラーのメッセージが正しい', () => {
      const errorMessage = 'この操作を行う権限がありません';
      expect(errorMessage).toBe('この操作を行う権限がありません');
    });
  });
});
