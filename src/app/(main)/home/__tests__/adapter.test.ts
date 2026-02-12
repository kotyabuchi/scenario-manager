import { describe, expect, it } from 'vitest';

import { mergeAndSortActivities } from '../adapter';

import type { ActivityItem } from '../interface';

describe('mergeAndSortActivities', () => {
  it('空の配列を渡すと空の結果を返す', () => {
    const result = mergeAndSortActivities([]);
    expect(result).toEqual([]);
  });

  it('最大5件に制限される', () => {
    const items: ActivityItem[] = Array.from({ length: 8 }, (_, i) => ({
      id: `item-${i}`,
      type: 'scenario_updated' as const,
      description: `テスト${i}`,
      actorName: '',
      targetName: `シナリオ${i}`,
      timestamp: new Date(2026, 0, i + 1).toISOString(),
    }));
    const result = mergeAndSortActivities(items);
    expect(result).toHaveLength(5);
  });

  it('timestamp降順でソートされる', () => {
    const items: ActivityItem[] = [
      {
        id: 'old',
        type: 'scenario_updated',
        description: '古い',
        actorName: '',
        targetName: 'シナリオA',
        timestamp: '2026-01-01T00:00:00Z',
      },
      {
        id: 'new',
        type: 'participant_joined',
        description: '新しい',
        actorName: 'ユーザー',
        targetName: 'セッションB',
        timestamp: '2026-01-10T00:00:00Z',
      },
      {
        id: 'mid',
        type: 'session_completed',
        description: '中間',
        actorName: '',
        targetName: 'セッションC',
        timestamp: '2026-01-05T00:00:00Z',
      },
    ];
    const result = mergeAndSortActivities(items);
    expect(result.map((r) => r.id)).toEqual(['new', 'mid', 'old']);
  });

  it('5件を超える場合に最新の5件が選ばれる', () => {
    const items: ActivityItem[] = Array.from({ length: 8 }, (_, i) => ({
      id: `item-${i}`,
      type: 'scenario_updated' as const,
      description: `テスト${i}`,
      actorName: '',
      targetName: `シナリオ${i}`,
      timestamp: new Date(2026, 0, i + 1).toISOString(),
    }));
    const result = mergeAndSortActivities(items);
    // 最新5件（1/8, 1/7, 1/6, 1/5, 1/4）が降順で返る
    expect(result.map((r) => r.id)).toEqual([
      'item-7',
      'item-6',
      'item-5',
      'item-4',
      'item-3',
    ]);
  });

  it('同一timestampの場合に入力順序が保持される（安定ソート）', () => {
    const sameTime = '2026-01-15T12:00:00Z';
    const items: ActivityItem[] = [
      {
        id: 'joined',
        type: 'participant_joined',
        description: '参加',
        actorName: 'A',
        targetName: 'セッション',
        timestamp: sameTime,
      },
      {
        id: 'updated',
        type: 'scenario_updated',
        description: '更新',
        actorName: '',
        targetName: 'シナリオ',
        timestamp: sameTime,
      },
      {
        id: 'completed',
        type: 'session_completed',
        description: '完了',
        actorName: '',
        targetName: 'セッション',
        timestamp: sameTime,
      },
    ];
    const result = mergeAndSortActivities(items);
    expect(result.map((r) => r.id)).toEqual(['joined', 'updated', 'completed']);
  });

  it('5件以下の場合はそのまま全件返す', () => {
    const items: ActivityItem[] = [
      {
        id: 'only',
        type: 'review_created',
        description: 'レビュー',
        actorName: 'B',
        targetName: 'シナリオ',
        timestamp: '2026-02-01T00:00:00Z',
      },
    ];
    const result = mergeAndSortActivities(items);
    expect(result).toHaveLength(1);
    expect(result[0]?.id).toBe('only');
  });
});
