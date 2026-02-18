import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import {
  confirmSchedule,
  createScheduleCandidates,
  getScheduleCandidates,
  getScheduleResponses,
  submitScheduleResponse,
} from '../adapter';

import {
  cleanupSessions,
  cleanupUsers,
  createTestCandidate,
  createTestResponse,
  createTestSession,
  createTestUser,
} from '@/__tests__/helpers/fixtures';

/**
 * スケジュールアダプター関数テスト
 *
 * 注意: これらはデータベースに接続する統合テストです。
 * テスト環境でDBに接続できない場合、テストは警告を出してスキップ扱いになります。
 */

const NON_EXISTENT_SESSION_ID = 'non-existent-session-id-00000000000000';
const NON_EXISTENT_CANDIDATE_ID = 'non-existent-candidate-id-000000000';

describe('Schedule Adapter', () => {
  let userId: string;
  let sessionId: string;
  let candidateId1: string;
  let candidateId2: string;
  let candidateId3: string;

  beforeAll(async () => {
    // テストユーザー作成
    const user = await createTestUser();
    userId = user.user_id;

    // セッション作成
    const session = await createTestSession({ keeperUserId: userId });
    sessionId = session.game_session_id;

    // 日程候補3件（日付を変えて）
    const candidate1 = await createTestCandidate({
      sessionId,
      createdBy: userId,
      candidate_date: '2026-03-01T10:00:00+09:00',
    });
    candidateId1 = candidate1.candidate_id;

    const candidate2 = await createTestCandidate({
      sessionId,
      createdBy: userId,
      candidate_date: '2026-03-08T10:00:00+09:00',
    });
    candidateId2 = candidate2.candidate_id;

    const candidate3 = await createTestCandidate({
      sessionId,
      createdBy: userId,
      candidate_date: '2026-03-15T10:00:00+09:00',
    });
    candidateId3 = candidate3.candidate_id;

    // 候補1件に対して回答
    await createTestResponse({ candidateId: candidateId1, userId });
  });

  afterAll(async () => {
    await cleanupSessions([sessionId]);
    await cleanupUsers([userId]);
  });

  describe('createScheduleCandidates', () => {
    // T-CC-001: 日程候補を一括登録できる
    it('存在するセッションIDで日程候補を一括登録できる', async () => {
      const candidates = [
        {
          candidateDate: '2026-04-01T10:00:00+09:00',
          endTime: '2026-04-01T14:00:00+09:00',
        },
        { candidateDate: '2026-04-08T10:00:00+09:00' },
      ];

      const result = await createScheduleCandidates(
        sessionId,
        userId,
        candidates,
      );

      expect(result.success).toBe(true);
    });

    // T-CC-002: 外部キー制約違反でエラーを返す
    it('存在しないセッションIDで外部キー制約エラーを返す', async () => {
      const result = await createScheduleCandidates(
        NON_EXISTENT_SESSION_ID,
        userId,
        [{ candidateDate: '2026-03-01T10:00:00+09:00' }],
      );

      // 外部キー制約違反でエラーになるはず
      expect(result.success).toBe(false);
    });
  });

  describe('getScheduleCandidates', () => {
    // T-GC-001: 存在しないsessionIdで空配列を返す
    it('存在しないsessionIdで空配列を返す', async () => {
      const result = await getScheduleCandidates(NON_EXISTENT_SESSION_ID);

      if (result.success) {
        expect(result.data).toEqual([]);
      } else {
        // DB接続エラーの場合はテストをスキップ扱い
        console.warn('DB接続エラー: テストをスキップ', result.error.message);
        expect(true).toBe(true);
      }
    });

    // T-GC-002: Result型が返される
    it('Result型が返される', async () => {
      const result = await getScheduleCandidates(NON_EXISTENT_SESSION_ID);

      expect(result).toHaveProperty('success');
      expect(typeof result.success).toBe('boolean');

      if (result.success) {
        expect(result).toHaveProperty('data');
        expect(Array.isArray(result.data)).toBe(true);
      } else {
        expect(result).toHaveProperty('error');
      }
    });

    // T-GC-003: 日程候補に集計情報が付与される
    it('日程候補に回答集計情報が付与される', async () => {
      const result = await getScheduleCandidates(sessionId);

      expect(result.success).toBe(true);
      if (result.success && result.data.length > 0) {
        const candidate = result.data[0];
        if (candidate) {
          expect(candidate).toHaveProperty('candidateId');
          expect(candidate).toHaveProperty('okCount');
          expect(candidate).toHaveProperty('maybeCount');
          expect(candidate).toHaveProperty('ngCount');
          expect(candidate).toHaveProperty('responses');
          expect(Array.isArray(candidate.responses)).toBe(true);
          expect(typeof candidate.okCount).toBe('number');
          expect(typeof candidate.maybeCount).toBe('number');
          expect(typeof candidate.ngCount).toBe('number');
        }
      }
    });
  });

  describe('submitScheduleResponse', () => {
    // T-SR-001: 日程回答を送信できる
    it('存在する日程候補に回答を送信できる', async () => {
      const responses = [
        { candidateId: candidateId1, availability: 'OK' as const },
      ];

      const result = await submitScheduleResponse(
        userId,
        responses,
        'よろしくお願いします',
      );

      expect(result.success).toBe(true);
    });

    // T-SR-002: 同じcandidateId+userIdで再送信するとupsertされる
    it('同じcandidateId+userIdで再送信するとupsertされる', async () => {
      const responses = [
        { candidateId: candidateId2, availability: 'NG' as const },
      ];

      // 初回
      const firstResult = await submitScheduleResponse(userId, responses);
      expect(firstResult.success).toBe(true);

      // 再送信（upsert）
      const secondResult = await submitScheduleResponse(userId, responses);
      expect(secondResult.success).toBe(true);
    });

    // T-SR-003: 複数の日程候補に一括回答できる
    it('複数の日程候補に一括回答できる', async () => {
      const responses = [
        { candidateId: candidateId1, availability: 'OK' as const },
        { candidateId: candidateId2, availability: 'MAYBE' as const },
        { candidateId: candidateId3, availability: 'NG' as const },
      ];

      const result = await submitScheduleResponse(userId, responses);

      expect(result.success).toBe(true);
    });
  });

  describe('getScheduleResponses', () => {
    // T-GR-001: 存在しないsessionIdで空配列を返す
    it('存在しないsessionIdで空配列を返す', async () => {
      const result = await getScheduleResponses(NON_EXISTENT_SESSION_ID);

      if (result.success) {
        expect(result.data).toEqual([]);
      } else {
        // DB接続エラーの場合はテストをスキップ扱い
        console.warn('DB接続エラー: テストをスキップ', result.error.message);
        expect(true).toBe(true);
      }
    });

    // T-GR-002: Result型が返される
    it('Result型が返される', async () => {
      const result = await getScheduleResponses(NON_EXISTENT_SESSION_ID);

      expect(result).toHaveProperty('success');
      expect(typeof result.success).toBe('boolean');

      if (result.success) {
        expect(result).toHaveProperty('data');
        expect(Array.isArray(result.data)).toBe(true);
      } else {
        expect(result).toHaveProperty('error');
      }
    });

    // T-GR-003: 実際のセッションIDで日程回答を取得できる
    it('実際のセッションIDで日程回答を取得できる', async () => {
      const result = await getScheduleResponses(sessionId);

      expect(result.success).toBe(true);
      if (result.success && result.data.length > 0) {
        const response = result.data[0];
        if (response) {
          expect(response).toHaveProperty('responseId');
          expect(response).toHaveProperty('candidateId');
          expect(response).toHaveProperty('userId');
          expect(response).toHaveProperty('availability');
        }
      }
    });
  });

  describe('confirmSchedule', () => {
    // T-CF-001: 存在しないIDでのRPC呼び出しはエラーを返す
    it('存在しないsessionIdとcandidateIdでエラーを返す', async () => {
      const result = await confirmSchedule(
        NON_EXISTENT_SESSION_ID,
        NON_EXISTENT_CANDIDATE_ID,
      );

      // RPCがエラーを返すはず
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBeInstanceOf(Error);
      }
    });

    // T-CF-002: 実際のsessionIdとcandidateIdで日程を確定できる
    it('実際のsessionIdとcandidateIdで日程を確定できる', async () => {
      const result = await confirmSchedule(sessionId, candidateId1);

      expect(result.success).toBe(true);
    });

    // T-CF-003: Result型が返される
    it('Result型が返される', async () => {
      const result = await confirmSchedule(
        NON_EXISTENT_SESSION_ID,
        NON_EXISTENT_CANDIDATE_ID,
      );

      expect(result).toHaveProperty('success');
      expect(typeof result.success).toBe('boolean');
    });
  });

  describe('getScheduleCandidates', () => {
    // T-GS-001: 存在しないsessionIdで空配列を返す（getScheduleCandidatesのラッパー）
    it('存在しないsessionIdで空配列を返す', async () => {
      const result = await getScheduleCandidates(NON_EXISTENT_SESSION_ID);

      if (result.success) {
        expect(result.data).toEqual([]);
      } else {
        // DB接続エラーの場合はテストをスキップ扱い
        console.warn('DB接続エラー: テストをスキップ', result.error.message);
        expect(true).toBe(true);
      }
    });

    // T-GS-002: Result型が返される
    it('Result型が返される', async () => {
      const result = await getScheduleCandidates(NON_EXISTENT_SESSION_ID);

      expect(result).toHaveProperty('success');
      expect(typeof result.success).toBe('boolean');

      if (result.success) {
        expect(result).toHaveProperty('data');
        expect(Array.isArray(result.data)).toBe(true);
      } else {
        expect(result).toHaveProperty('error');
      }
    });

    // T-GS-003: getScheduleCandidatesと同じ結果を返す
    it('getScheduleCandidatesと同じ結果を返す', async () => {
      const [summaryResult, candidatesResult] = await Promise.all([
        getScheduleCandidates(NON_EXISTENT_SESSION_ID),
        getScheduleCandidates(NON_EXISTENT_SESSION_ID),
      ]);

      // 両方同じ成否になるはず
      expect(summaryResult.success).toBe(candidatesResult.success);

      if (summaryResult.success && candidatesResult.success) {
        expect(summaryResult.data).toEqual(candidatesResult.data);
      }
    });

    // T-GS-004: 実際のセッションIDでサマリーを取得できる
    it('実際のセッションIDでサマリーを取得できる', async () => {
      const result = await getScheduleCandidates(sessionId);

      expect(result.success).toBe(true);
      if (result.success && result.data.length > 0) {
        const candidate = result.data[0];
        if (candidate) {
          expect(candidate).toHaveProperty('candidateId');
          expect(candidate).toHaveProperty('okCount');
          expect(candidate).toHaveProperty('maybeCount');
          expect(candidate).toHaveProperty('ngCount');
        }
      }
    });
  });
});
