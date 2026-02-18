import { describe, expect, it } from 'vitest';

import {
  scheduleCandidateSchema,
  scheduleCandidatesFormSchema,
  scheduleResponseSchema,
} from '../schema';

describe('scheduleCandidateSchema', () => {
  it('有効なISO日時はバリデーション成功する', () => {
    const result = scheduleCandidateSchema.safeParse({
      candidateDate: '2026-03-15T14:00:00.000Z',
    });
    expect(result.success).toBe(true);
  });

  it('endTime付きでバリデーション成功する', () => {
    const result = scheduleCandidateSchema.safeParse({
      candidateDate: '2026-03-15T14:00:00.000Z',
      endTime: '2026-03-15T18:00:00.000Z',
    });
    expect(result.success).toBe(true);
  });

  it('無効な日時文字列はバリデーション失敗する', () => {
    const result = scheduleCandidateSchema.safeParse({
      candidateDate: '2026/03/15',
    });
    expect(result.success).toBe(false);
  });

  it('candidateDateなしはバリデーション失敗する', () => {
    const result = scheduleCandidateSchema.safeParse({});
    expect(result.success).toBe(false);
  });
});

describe('scheduleCandidatesFormSchema', () => {
  it('候補1件でバリデーション成功する', () => {
    const result = scheduleCandidatesFormSchema.safeParse({
      candidates: [{ candidateDate: '2026-03-15T14:00:00.000Z' }],
    });
    expect(result.success).toBe(true);
  });

  it('候補30件でバリデーション成功する', () => {
    const candidates = Array.from({ length: 30 }, (_, i) => ({
      candidateDate: `2026-03-${String(i + 1).padStart(2, '0')}T14:00:00.000Z`,
    }));
    const result = scheduleCandidatesFormSchema.safeParse({ candidates });
    expect(result.success).toBe(true);
  });

  it('候補0件はバリデーション失敗する', () => {
    const result = scheduleCandidatesFormSchema.safeParse({ candidates: [] });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0]?.message).toBe(
        '最低1つの候補日時を登録してください',
      );
    }
  });

  it('候補31件はバリデーション失敗する', () => {
    const candidates = Array.from({ length: 31 }, (_, i) => ({
      candidateDate: new Date(2026, 2, i + 1).toISOString(),
    }));
    const result = scheduleCandidatesFormSchema.safeParse({ candidates });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0]?.message).toBe(
        '候補日時は30件以内にしてください',
      );
    }
  });
});

describe('scheduleResponseSchema', () => {
  it('全候補にOK回答でバリデーション成功する', () => {
    const result = scheduleResponseSchema.safeParse({
      responses: [
        { candidateId: '01ABC', availability: 'OK' },
        { candidateId: '01DEF', availability: 'MAYBE' },
      ],
    });
    expect(result.success).toBe(true);
  });

  it('コメント付きでバリデーション成功する', () => {
    const result = scheduleResponseSchema.safeParse({
      responses: [{ candidateId: '01ABC', availability: 'NG' }],
      comment: '都合が悪いです',
    });
    expect(result.success).toBe(true);
  });

  it('回答0件はバリデーション失敗する', () => {
    const result = scheduleResponseSchema.safeParse({
      responses: [],
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0]?.message).toBe(
        '少なくとも1つの候補に回答してください',
      );
    }
  });

  it('無効なavailability値はバリデーション失敗する', () => {
    const result = scheduleResponseSchema.safeParse({
      responses: [{ candidateId: '01ABC', availability: 'INVALID' }],
    });
    expect(result.success).toBe(false);
  });

  it('201文字以上のコメントはバリデーション失敗する', () => {
    const result = scheduleResponseSchema.safeParse({
      responses: [{ candidateId: '01ABC', availability: 'OK' }],
      comment: 'あ'.repeat(201),
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0]?.message).toBe(
        'コメントは200文字以内で入力してください',
      );
    }
  });
});
