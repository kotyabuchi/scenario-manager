import { expect } from '@playwright/test';
import { isNil } from 'ramda';

import { SessionDetailPage } from '../pages/session-detail-page';

import type { Page } from '@playwright/test';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { AvailabilityTimeBlockInput } from '../../src/app/(main)/sessions/[id]/schedule/availability/interface';
import type { Database } from '../../src/db/types';

const DAY_MS = 24 * 60 * 60_000;
const BLOCK_DURATION_MS = 2 * 60 * 60_000;
const TOKYO_OFFSET_MS = 9 * 60 * 60_000;
const TIMEZONE = 'Asia/Tokyo';

// local DBのschedule_dateはUTCのtimestamp without time zoneとして返される
const databaseTimestampIso = (value: string) =>
  new Date(
    /(?:Z|[+-]\d{2}:\d{2})$/.test(value) ? value : `${value}Z`,
  ).toISOString();

/** fixtureの30分境界を維持し、日ごとに重ならない2時間枠を作る。 */
export const buildScheduleBlocks = (
  anchorIso: string,
  dayOffsets: readonly number[],
): AvailabilityTimeBlockInput[] =>
  dayOffsets.map((offset) => {
    const start = Date.parse(anchorIso) + offset * DAY_MS;
    return {
      startAt: new Date(start).toISOString(),
      endAt: new Date(start + BLOCK_DURATION_MS).toISOString(),
    };
  });

/** Asia/Tokyoのcontextに入力するdatetime-local値を返す。 */
export const toScheduleInput = (iso: string) =>
  new Date(Date.parse(iso) + TOKYO_OFFSET_MS).toISOString().slice(0, 16);

/** 確定候補の表示と、テストが指定した日時を照合するための期待文字列。 */
export const candidateTimeBlockLabel = (block: AvailabilityTimeBlockInput) => {
  const start = toScheduleInput(block.startAt);
  const end = toScheduleInput(block.endAt);
  const dateLabel = (iso: string) => {
    const local = toScheduleInput(iso);
    const weekday = new Intl.DateTimeFormat('en-US', {
      weekday: 'short',
      timeZone: TIMEZONE,
    }).format(new Date(iso));
    return `${Number(local.slice(5, 7))}/${Number(local.slice(8, 10))} (${weekday})`;
  };
  return start.slice(0, 10) === end.slice(0, 10)
    ? `${dateLabel(block.startAt)} ${start.slice(11)} - ${end.slice(11)}`
    : `${dateLabel(block.startAt)} ${start.slice(11)} - ${dateLabel(block.endAt)} ${end.slice(11)}`;
};

const detailTimeBlockLabel = (block: AvailabilityTimeBlockInput) => {
  const date = (iso: string) =>
    new Intl.DateTimeFormat('ja-JP', {
      month: '2-digit',
      day: '2-digit',
      weekday: 'short',
      hour: '2-digit',
      minute: '2-digit',
      timeZone: TIMEZONE,
    }).format(new Date(iso));
  const end = new Intl.DateTimeFormat('ja-JP', {
    hour: '2-digit',
    minute: '2-digit',
    timeZone: TIMEZONE,
  }).format(new Date(block.endAt));
  return toScheduleInput(block.startAt).slice(0, 10) ===
    toScheduleInput(block.endAt).slice(0, 10)
    ? `${date(block.startAt)}〜${end}`
    : `${date(block.startAt)}〜${date(block.endAt)}`;
};

/** 利用者JWTのclientだけを渡し、所有sessionの親状態と確定枠を読み取る。 */
export const readScheduleSnapshot = async (
  client: SupabaseClient<Database>,
  sessionId: string,
) => {
  const [session, blocks] = await Promise.all([
    client
      .from('game_sessions')
      .select(
        'game_session_id,created_by_id,keeper_id,session_phase,schedule_phase,schedule_date,updated_at',
      )
      .eq('game_session_id', sessionId)
      .single(),
    client
      .from('game_schedule_time_blocks')
      .select(
        'game_schedule_time_block_id,session_id,start_at,end_at,block_order,created_by,created_at,updated_at',
      )
      .eq('session_id', sessionId)
      .order('block_order', { ascending: true }),
  ]);
  if (!isNil(session.error) || isNil(session.data))
    throw new Error('利用者JWTによるセッション状態の観測に失敗しました');
  if (!isNil(blocks.error) || isNil(blocks.data))
    throw new Error('利用者JWTによる確定枠の観測に失敗しました');
  return {
    session: {
      ...session.data,
      schedule_date: isNil(session.data.schedule_date)
        ? null
        : databaseTimestampIso(session.data.schedule_date),
    },
    blocks: blocks.data.map((block) => ({
      ...block,
      start_at: new Date(block.start_at).toISOString(),
      end_at: new Date(block.end_at).toISOString(),
    })),
  };
};

/** UI保存後、全枠の同値・順序・作成者と親のphase/dateを利用者JWTで検証する。 */
export const expectPersistedSchedule = async (
  client: SupabaseClient<Database>,
  sessionId: string,
  expected: readonly AvailabilityTimeBlockInput[],
  createdBy: string,
) => {
  const snapshot = await readScheduleSnapshot(client, sessionId);
  expect(snapshot.session).toMatchObject({
    game_session_id: sessionId,
    session_phase: 'PREPARATION',
    schedule_phase: 'CONFIRMED',
    schedule_date: expected[0]?.startAt,
  });
  expect(
    snapshot.blocks.map((block) => ({
      startAt: block.start_at,
      endAt: block.end_at,
      blockOrder: block.block_order,
      sessionId: block.session_id,
      createdBy: block.created_by,
    })),
  ).toEqual(
    expected.map((block, index) => ({
      ...block,
      blockOrder: index + 1,
      sessionId,
      createdBy,
    })),
  );
  return snapshot;
};

/** operator/observerとも、詳細ページの全確定枠を件数・日時・順序で照合する。 */
export const expectDetailSchedule = async (
  page: Page,
  sessionId: string,
  expected: readonly AvailabilityTimeBlockInput[],
) => {
  const detail = new SessionDetailPage(page);
  await detail.goto(sessionId);
  await expect(detail.basicInfoSection.getByRole('listitem')).toHaveText(
    expected.map(detailTimeBlockLabel),
  );
};
