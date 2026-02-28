import { describe, expect, it } from 'vitest';

import { buildScheduleRecommendations } from '../recommendation';

import type {
  RecommendationParticipant,
  RecommendationSourceTimeBlock,
} from '@/app/(main)/sessions/[id]/availability/interface';

const slot = (
  userId: string,
  startAt: string,
  endAt: string,
): RecommendationSourceTimeBlock => ({
  userId,
  startAt,
  endAt,
});

const player = (
  userId: string,
  participantType: RecommendationParticipant['participantType'],
): RecommendationParticipant => ({
  userId,
  participantType,
  isHost: participantType === 'KEEPER',
});

describe('buildScheduleRecommendations', () => {
  it('全員参加可 / 見学者除外可 のグループを分けて返す', () => {
    const participants: RecommendationParticipant[] = [
      player('keeper', 'KEEPER'),
      player('player1', 'PLAYER'),
      player('spectator1', 'SPECTATOR'),
    ];

    const slots: RecommendationSourceTimeBlock[] = [
      slot('keeper', '2026-03-01T10:00:00.000Z', '2026-03-01T14:00:00.000Z'),
      slot('player1', '2026-03-01T10:00:00.000Z', '2026-03-01T14:00:00.000Z'),
      slot(
        'spectator1',
        '2026-03-01T10:00:00.000Z',
        '2026-03-01T12:00:00.000Z',
      ),
    ];

    const groups = buildScheduleRecommendations({
      participants,
      timeBlocks: slots,
      minPlaytimeMinutes: 180,
    });

    expect(groups.map((group) => group.group)).toEqual([
      'all_users',
      'required_users_only',
    ]);
    expect(groups[1]?.note).toBe('ここから下は見学者が参加できない候補です');

    const allUsersFirst = groups[0]?.items[0];
    expect(allUsersFirst?.timeBlocks).toEqual([
      {
        startAt: '2026-03-01T10:00:00.000Z',
        endAt: '2026-03-01T12:00:00.000Z',
      },
    ]);

    const requiredUsersOnlyFirst = groups[1]?.items[0];
    expect(requiredUsersOnlyFirst?.timeBlocks).toEqual([
      {
        startAt: '2026-03-01T10:00:00.000Z',
        endAt: '2026-03-01T14:00:00.000Z',
      },
    ]);
    expect(requiredUsersOnlyFirst?.meetsMinPlaytime).toBe(true);
  });

  it('単一枠は最低プレイ時間達成を優先して並ぶ', () => {
    const participants: RecommendationParticipant[] = [
      player('keeper', 'KEEPER'),
      player('player1', 'PLAYER'),
    ];
    const slots: RecommendationSourceTimeBlock[] = [
      slot('keeper', '2026-03-02T10:00:00.000Z', '2026-03-02T13:00:00.000Z'),
      slot('player1', '2026-03-02T10:00:00.000Z', '2026-03-02T13:00:00.000Z'),
      slot('keeper', '2026-03-02T14:00:00.000Z', '2026-03-02T18:00:00.000Z'),
      slot('player1', '2026-03-02T14:00:00.000Z', '2026-03-02T18:00:00.000Z'),
    ];

    const groups = buildScheduleRecommendations({
      participants,
      timeBlocks: slots,
      minPlaytimeMinutes: 210,
    });

    const singles =
      groups[0]?.items.filter((item) => item.kind === 'single') ?? [];
    expect(singles[0]?.timeBlocks[0]).toEqual({
      startAt: '2026-03-02T14:00:00.000Z',
      endAt: '2026-03-02T18:00:00.000Z',
    });
    expect(singles[0]?.meetsMinPlaytime).toBe(true);
    expect(singles[1]?.meetsMinPlaytime).toBe(false);
  });

  it('combo は少ない枠数・同日・短いgapを優先する', () => {
    const participants: RecommendationParticipant[] = [
      player('keeper', 'KEEPER'),
      player('player1', 'PLAYER'),
    ];
    const slots: RecommendationSourceTimeBlock[] = [
      slot('keeper', '2026-03-03T10:00:00.000Z', '2026-03-03T12:00:00.000Z'),
      slot('player1', '2026-03-03T10:00:00.000Z', '2026-03-03T12:00:00.000Z'),
      slot('keeper', '2026-03-03T12:30:00.000Z', '2026-03-03T14:30:00.000Z'),
      slot('player1', '2026-03-03T12:30:00.000Z', '2026-03-03T14:30:00.000Z'),
      slot('keeper', '2026-03-05T10:00:00.000Z', '2026-03-05T12:00:00.000Z'),
      slot('player1', '2026-03-05T10:00:00.000Z', '2026-03-05T12:00:00.000Z'),
    ];

    const groups = buildScheduleRecommendations({
      participants,
      timeBlocks: slots,
      minPlaytimeMinutes: 240,
    });

    const combos =
      groups[0]?.items.filter((item) => item.kind === 'combo') ?? [];
    expect(combos[0]?.timeBlocks).toEqual([
      {
        startAt: '2026-03-03T10:00:00.000Z',
        endAt: '2026-03-03T12:00:00.000Z',
      },
      {
        startAt: '2026-03-03T12:30:00.000Z',
        endAt: '2026-03-03T14:30:00.000Z',
      },
    ]);
    expect(combos[0]?.reasonLabels).toContain('同日で完結');
  });

  it('日跨ぎ枠を単一候補として扱える', () => {
    const participants: RecommendationParticipant[] = [
      player('keeper', 'KEEPER'),
      player('player1', 'PLAYER'),
    ];
    const slots: RecommendationSourceTimeBlock[] = [
      slot('keeper', '2026-03-06T22:00:00.000Z', '2026-03-07T02:00:00.000Z'),
      slot('player1', '2026-03-06T22:00:00.000Z', '2026-03-07T02:00:00.000Z'),
    ];

    const groups = buildScheduleRecommendations({
      participants,
      timeBlocks: slots,
      minPlaytimeMinutes: 180,
    });

    expect(groups[0]?.items[0]?.timeBlocks[0]).toEqual({
      startAt: '2026-03-06T22:00:00.000Z',
      endAt: '2026-03-07T02:00:00.000Z',
    });
    expect(groups[0]?.items[0]?.totalMinutes).toBe(240);
  });

  it('minPlaytimeMinutes=null の場合は単一枠優先で meetsMinPlaytime=true 扱い', () => {
    const participants: RecommendationParticipant[] = [
      player('keeper', 'KEEPER'),
      player('player1', 'PLAYER'),
    ];
    const slots: RecommendationSourceTimeBlock[] = [
      slot('keeper', '2026-03-08T10:00:00.000Z', '2026-03-08T12:00:00.000Z'),
      slot('player1', '2026-03-08T10:00:00.000Z', '2026-03-08T12:00:00.000Z'),
      slot('keeper', '2026-03-08T13:00:00.000Z', '2026-03-08T15:00:00.000Z'),
      slot('player1', '2026-03-08T13:00:00.000Z', '2026-03-08T15:00:00.000Z'),
    ];

    const groups = buildScheduleRecommendations({
      participants,
      timeBlocks: slots,
      minPlaytimeMinutes: null,
    });

    expect(groups[0]?.items[0]?.kind).toBe('single');
    expect(groups[0]?.items[0]?.meetsMinPlaytime).toBe(true);
    expect(groups[0]?.items.some((item) => item.kind === 'combo')).toBe(true);
  });

  it('スケジュールが0件なら空配列を返す', () => {
    const groups = buildScheduleRecommendations({
      participants: [player('keeper', 'KEEPER')],
      timeBlocks: [],
      minPlaytimeMinutes: 120,
    });

    expect(groups).toEqual([]);
  });

  it('想定上限ケースでも500ms以内でおすすめ生成できる', () => {
    const participants: RecommendationParticipant[] = [
      ...Array.from({ length: 4 }, (_, i) => player(`k${i}`, 'KEEPER')),
      ...Array.from({ length: 4 }, (_, i) => player(`p${i}`, 'PLAYER')),
      ...Array.from({ length: 2 }, (_, i) => player(`s${i}`, 'SPECTATOR')),
    ];

    const slots: RecommendationSourceTimeBlock[] = participants.flatMap(
      (participant, participantIndex) =>
        Array.from({ length: 20 }, (_, slotIndex) => {
          const day = String(1 + Math.floor(slotIndex / 4)).padStart(2, '0');
          const hourBase = 9 + (slotIndex % 4) * 3 + (participantIndex % 2);
          return slot(
            participant.userId,
            `2026-04-${day}T${String(hourBase).padStart(2, '0')}:00:00.000Z`,
            `2026-04-${day}T${String(hourBase + 2).padStart(2, '0')}:00:00.000Z`,
          );
        }),
    );

    const startedAt = performance.now();
    const groups = buildScheduleRecommendations({
      participants,
      timeBlocks: slots,
      minPlaytimeMinutes: 180,
    });
    const elapsedMs = performance.now() - startedAt;

    expect(groups).toBeDefined();
    expect(elapsedMs).toBeLessThan(500);
  });
});
