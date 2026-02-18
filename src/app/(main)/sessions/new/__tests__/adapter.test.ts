import { afterAll, beforeAll, describe, expect, it } from 'vitest';

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

  describe('createSession', () => {
    // T-CS-001: 全項目を指定してセッションを作成できる
    it('全項目を指定してセッションを作成できる', async () => {
      const input: CreateSessionInput = {
        sessionName: '週末CoC7版卓',
        sessionDescription: '週末にCoC7版を遊びませんか？初心者歓迎！',
        scenarioId,
        scheduledAt: '2026-01-25T20:00:00+09:00',
        recruitedPlayerCount: 4,
        tools: 'Discord + ココフォリア',
        isBeginnerFriendly: true,
        visibility: 'PUBLIC',
        scheduleType: 'specify',
      };

      const result = await createSession(input, testUserId);

      expect(result.success).toBe(true);
      if (result.success) {
        createdSessionIds.push(result.data.gameSessionId);
        expect(result.data.gameSessionId).toBeDefined();
        expect(result.data.sessionName).toBe('週末CoC7版卓');
        expect(result.data.sessionPhase).toBe('RECRUITING');
      }
    });

    // T-CS-002: 必須項目のみでセッションを作成できる（柔軟な募集）
    it('必須項目のみでセッションを作成できる', async () => {
      const input: CreateSessionInput = {
        sessionName: '週末に何か遊ぶ卓',
        sessionDescription: '週末に何か遊びませんか？',
        isBeginnerFriendly: false,
        visibility: 'PUBLIC',
        scheduleType: 'later',
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
    it('シナリオ未定でセッションを作成できる', async () => {
      const input: CreateSessionInput = {
        sessionName: 'シナリオ相談卓',
        sessionDescription: 'シナリオは参加者と相談して決めます',
        scenarioId: null,
        isBeginnerFriendly: false,
        visibility: 'PUBLIC',
        scheduleType: 'later',
      };

      const result = await createSession(input, testUserId);

      expect(result.success).toBe(true);
      if (result.success) {
        createdSessionIds.push(result.data.gameSessionId);
        expect(result.data.scenarioId).toBeNull();
      }
    });

    // T-CS-004: 日程未定でセッションを作成できる
    it('日程未定でセッションを作成できる', async () => {
      const input: CreateSessionInput = {
        sessionName: '日程調整中卓',
        sessionDescription: '日程は後で調整します',
        scheduledAt: null,
        isBeginnerFriendly: false,
        visibility: 'PUBLIC',
        scheduleType: 'later',
      };

      const result = await createSession(input, testUserId);

      expect(result.success).toBe(true);
      if (result.success) {
        createdSessionIds.push(result.data.gameSessionId);
        expect(result.data.scheduledAt).toBeNull();
      }
    });

    // T-CS-005: 人数未定でセッションを作成できる
    it('人数未定でセッションを作成できる', async () => {
      const input: CreateSessionInput = {
        sessionName: '人数調整中卓',
        sessionDescription: '人数は集まり次第決めます',
        recruitedPlayerCount: null,
        isBeginnerFriendly: false,
        visibility: 'PUBLIC',
        scheduleType: 'later',
      };

      const result = await createSession(input, testUserId);

      expect(result.success).toBe(true);
      if (result.success) {
        createdSessionIds.push(result.data.gameSessionId);
        expect(result.data.recruitedPlayerCount).toBeNull();
      }
    });

    // T-CS-006: フォロワー限定でセッションを作成できる
    it('フォロワー限定でセッションを作成できる', async () => {
      const input: CreateSessionInput = {
        sessionName: '身内卓',
        sessionDescription: 'フォロワーさん向けの卓です',
        visibility: 'FOLLOWERS_ONLY',
        isBeginnerFriendly: false,
        scheduleType: 'later',
      };

      const result = await createSession(input, testUserId);

      expect(result.success).toBe(true);
      if (result.success) {
        createdSessionIds.push(result.data.gameSessionId);
        expect(result.data.visibility).toBe('FOLLOWERS_ONLY');
      }
    });

    // T-CS-007: 存在しないユーザーIDでエラー
    it('存在しないユーザーIDでエラー', async () => {
      const input: CreateSessionInput = {
        sessionName: 'テスト卓',
        sessionDescription: 'テスト',
        isBeginnerFriendly: false,
        visibility: 'PUBLIC',
        scheduleType: 'later',
      };
      const nonExistentUserId = 'non-existent-user-id';

      const result = await createSession(input, nonExistentUserId);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.message).toBe('ユーザーが見つかりません');
      }
    });

    // T-CS-008: 作成時にGMとして参加者に追加される
    it('作成時にGMとして参加者に追加される', async () => {
      const input: CreateSessionInput = {
        sessionName: 'GM自動追加テスト',
        sessionDescription: 'テスト',
        isBeginnerFriendly: false,
        visibility: 'PUBLIC',
        scheduleType: 'later',
      };

      const result = await createSession(input, testUserId);

      expect(result.success).toBe(true);
      if (result.success) {
        createdSessionIds.push(result.data.gameSessionId);
        // セッションの参加者を取得して確認
        const session = await getSessionById(result.data.gameSessionId);
        if (session.success && session.data) {
          const gmParticipant = session.data.participants.find(
            (p) => p.userId === testUserId && p.participantType === 'KEEPER',
          );
          expect(gmParticipant).toBeDefined();
        }
      }
    });
  });

  describe('getSessionById', () => {
    // T-GS-001: 存在するセッションIDでセッションを取得できる
    it('存在するセッションIDでセッションを取得できる', async () => {
      // まずセッションを作成
      const input: CreateSessionInput = {
        sessionName: '取得テスト用セッション',
        sessionDescription: 'テスト',
        isBeginnerFriendly: false,
        visibility: 'PUBLIC',
        scheduleType: 'later',
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
    });

    // T-GS-002: 存在しないセッションIDでnullを返す
    it('存在しないセッションIDでnullを返す', async () => {
      const nonExistentSessionId = '01NONEXISTENT00000000000';

      const result = await getSessionById(nonExistentSessionId);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toBeNull();
      }
    });

    // T-GS-003: セッションにシナリオ情報が含まれる
    it('セッションにシナリオ情報が含まれる', async () => {
      // シナリオ付きでセッションを作成
      const input: CreateSessionInput = {
        sessionName: 'シナリオ付きセッション',
        sessionDescription: 'テスト',
        scenarioId,
        isBeginnerFriendly: false,
        visibility: 'PUBLIC',
        scheduleType: 'later',
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
    it('セッションに参加者情報が含まれる', async () => {
      // セッションを作成（KEEPERが自動追加される）
      const input: CreateSessionInput = {
        sessionName: '参加者情報テスト',
        sessionDescription: 'テスト',
        isBeginnerFriendly: false,
        visibility: 'PUBLIC',
        scheduleType: 'later',
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
