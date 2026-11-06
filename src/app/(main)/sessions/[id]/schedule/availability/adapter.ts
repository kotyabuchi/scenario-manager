import { isNil } from 'ramda';
import { ulid } from 'ulid';

import { ParticipantStatuses } from '@/db/enum';
import { getAppLogger } from '@/lib/logger';
import { createDbClient } from '@/lib/supabase/server';
import {
  camelCaseKeys,
  toRecord,
  toRecordArray,
} from '@/lib/supabase/transform';
import { err, ok, type Result } from '@/types/result';

import type { Database } from '@/db/types';
import type {
  AvailabilityTimeBlockInput,
  AvailabilityTimeBlockRow,
  AvailabilityTimeBlockWithUser,
  AvailabilityWorkspaceData,
  ParticipantType,
} from './interface';

const logger = getAppLogger(['app', 'sessions', 'availability']);

const THIRTY_MINUTES_MS = 30 * 60 * 1000;

const hasThirtyMinuteBoundary = (value: string): boolean => {
  const time = new Date(value).getTime();
  return Number.isFinite(time) && time % THIRTY_MINUTES_MS === 0;
};

const isOverlapping = (
  a: AvailabilityTimeBlockInput,
  b: AvailabilityTimeBlockInput,
): boolean => {
  const aStart = new Date(a.startAt).getTime();
  const aEnd = new Date(a.endAt).getTime();
  const bStart = new Date(b.startAt).getTime();
  const bEnd = new Date(b.endAt).getTime();
  return aStart < bEnd && bStart < aEnd;
};

const validateAvailabilityTimeBlocks = (
  timeBlocks: AvailabilityTimeBlockInput[],
): Result<void> => {
  for (const timeBlock of timeBlocks) {
    const startMs = new Date(timeBlock.startAt).getTime();
    const endMs = new Date(timeBlock.endAt).getTime();
    if (!Number.isFinite(startMs) || !Number.isFinite(endMs)) {
      return err(new Error('日時形式が不正です'));
    }
    if (startMs >= endMs) {
      return err(new Error('開始日時は終了日時より前である必要があります'));
    }
    if (
      !hasThirtyMinuteBoundary(timeBlock.startAt) ||
      !hasThirtyMinuteBoundary(timeBlock.endAt)
    ) {
      return err(new Error('日時は30分単位で指定してください'));
    }
  }

  const sorted = [...timeBlocks].sort(
    (a, b) => new Date(a.startAt).getTime() - new Date(b.startAt).getTime(),
  );
  for (let index = 1; index < sorted.length; index += 1) {
    const prev = sorted[index - 1];
    const current = sorted[index];
    if (isNil(prev) || isNil(current)) {
      continue;
    }
    if (isOverlapping(prev, current)) {
      return err(new Error('スケジュール同士が重複しています'));
    }
  }

  return ok(undefined);
};

/**
 * 提出UI / 確定UI で共通利用するワークスペース初期データを取得
 */
export const getAvailabilityWorkspaceData = async (
  sessionId: string,
  currentUserId: string,
): Promise<Result<AvailabilityWorkspaceData>> => {
  try {
    const supabase = await createDbClient();

    const { data: session, error: sessionError } = await supabase
      .from('game_sessions')
      .select(
        'game_session_id, session_name, created_by_id, scenario:scenarios(min_playtime)',
      )
      .eq('game_session_id', sessionId)
      .maybeSingle();

    if (sessionError) {
      logger.error`ワークスペース初期データ取得(セッション)エラー: ${sessionError.message}`;
      return err(new Error(sessionError.message));
    }

    if (isNil(session)) {
      return err(new Error('セッションが見つかりません'));
    }

    const [
      { data: currentParticipant, error: currentParticipantError },
      { data: allParticipants, error: allParticipantsError },
      { data: allTimeBlocks, error: allTimeBlocksError },
      { data: confirmedTimeBlocks, error: confirmedTimeBlocksError },
    ] = await Promise.all([
      supabase
        .from('session_participants')
        .select('participant_type, participant_status')
        .eq('session_id', sessionId)
        .eq('user_id', currentUserId)
        .neq('participant_status', ParticipantStatuses.WITHDRAWN.value)
        .maybeSingle(),
      supabase
        .from('session_participants')
        .select('user_id, participant_type, participant_status')
        .eq('session_id', sessionId),
      supabase
        .from('session_availability_time_blocks')
        .select('*')
        .eq('session_id', sessionId)
        .order('start_at', { ascending: true }),
      supabase
        .from('game_schedule_time_blocks')
        .select('*')
        .eq('session_id', sessionId)
        .order('block_order', { ascending: true }),
    ]);

    if (currentParticipantError) {
      logger.error`ワークスペース初期データ取得(現在参加者)エラー: ${currentParticipantError.message}`;
      return err(new Error(currentParticipantError.message));
    }
    if (allParticipantsError) {
      logger.error`ワークスペース初期データ取得(全参加者)エラー: ${allParticipantsError.message}`;
      return err(new Error(allParticipantsError.message));
    }
    if (allTimeBlocksError) {
      logger.error`ワークスペース初期データ取得(スケジュール)エラー: ${allTimeBlocksError.message}`;
      return err(new Error(allTimeBlocksError.message));
    }
    if (confirmedTimeBlocksError) {
      logger.error`ワークスペース初期データ取得(確定日程)エラー: ${confirmedTimeBlocksError.message}`;
      return err(new Error(confirmedTimeBlocksError.message));
    }

    const participantMap = new Map<
      string,
      {
        participantType: ParticipantType;
        participantStatus: Database['public']['Enums']['participant_status'];
      }
    >(
      (allParticipants ?? []).map((participant) => [
        participant.user_id,
        {
          participantType: participant.participant_type,
          participantStatus: participant.participant_status,
        },
      ]),
    );

    const activeTimeBlocks = (allTimeBlocks ?? []).filter((timeBlock) => {
      const participant = participantMap.get(timeBlock.user_id);
      return (
        participant?.participantStatus === ParticipantStatuses.CONFIRMED.value
      );
    });

    const userIds = [
      ...new Set(activeTimeBlocks.map((timeBlock) => timeBlock.user_id)),
    ];
    const { data: users, error: usersError } = userIds.length
      ? await supabase
          .from('users')
          .select('user_id, user_name')
          .in('user_id', userIds)
      : { data: [], error: null };

    if (usersError) {
      logger.error`ワークスペース初期データ取得(ユーザー)エラー: ${usersError.message}`;
      return err(new Error(usersError.message));
    }

    const userNameMap = new Map(
      (users ?? []).map((user) => [user.user_id, user.user_name]),
    );

    const myAvailabilityTimeBlocks = activeTimeBlocks
      .filter((timeBlock) => timeBlock.user_id === currentUserId)
      .map(
        (timeBlock) =>
          camelCaseKeys(toRecord(timeBlock)) as AvailabilityTimeBlockRow,
      );

    const otherUserAvailabilityTimeBlocks: AvailabilityTimeBlockWithUser[] =
      activeTimeBlocks
        .filter((timeBlock) => timeBlock.user_id !== currentUserId)
        .map((timeBlock) => {
          const participant = participantMap.get(timeBlock.user_id);
          return {
            ...(camelCaseKeys(toRecord(timeBlock)) as AvailabilityTimeBlockRow),
            userName: userNameMap.get(timeBlock.user_id) ?? '退会済みユーザー',
            participantType: participant?.participantType ?? 'PLAYER',
            isHost: timeBlock.user_id === session.created_by_id,
          };
        });

    const scenarioRecord = toRecord(session.scenario);
    const minPlaytimeMinutes = isNil(session.scenario)
      ? null
      : ((scenarioRecord.min_playtime as number | null) ?? null);

    return ok({
      sessionId: session.game_session_id,
      sessionName: session.session_name,
      minPlaytimeMinutes,
      currentUserId,
      currentUserParticipantType:
        currentParticipant?.participant_status ===
        ParticipantStatuses.CONFIRMED.value
          ? currentParticipant.participant_type
          : null,
      currentUserIsHost: session.created_by_id === currentUserId,
      myAvailabilityTimeBlocks,
      otherUserAvailabilityTimeBlocks,
      confirmedScheduleTimeBlocks: toRecordArray(confirmedTimeBlocks).map(
        (timeBlock) =>
          camelCaseKeys(
            timeBlock,
          ) as AvailabilityWorkspaceData['confirmedScheduleTimeBlocks'][number],
      ),
    });
  } catch (e) {
    logger.error`getAvailabilityWorkspaceData 予期しないエラー: ${e}`;
    return err(e instanceof Error ? e : new Error('Unknown error'));
  }
};

/**
 * 現在ユーザーがスケジュールを1件以上提出済みかどうか
 */
export const hasUserAvailabilitySubmission = async (
  sessionId: string,
  userId: string,
): Promise<Result<boolean>> => {
  try {
    const supabase = await createDbClient();
    const { count, error } = await supabase
      .from('session_availability_time_blocks')
      .select('availability_time_block_id', { count: 'exact', head: true })
      .eq('session_id', sessionId)
      .eq('user_id', userId);

    if (error) {
      logger.error`スケジュール提出有無取得エラー: ${error.message}`;
      return err(new Error(error.message));
    }

    return ok((count ?? 0) > 0);
  } catch (e) {
    logger.error`hasUserAvailabilitySubmission 予期しないエラー: ${e}`;
    return err(e instanceof Error ? e : new Error('Unknown error'));
  }
};

/**
 * 自分のスケジュールを全置換で保存する（RPC でアトミック実行）
 */
export const replaceAvailabilityTimeBlocks = async (
  sessionId: string,
  userId: string,
  timeBlocks: AvailabilityTimeBlockInput[],
): Promise<Result<AvailabilityTimeBlockRow[]>> => {
  try {
    const validation = validateAvailabilityTimeBlocks(timeBlocks);
    if (!validation.success) {
      return err(validation.error);
    }

    const supabase = await createDbClient();

    const timeBlocksPayload = timeBlocks.map((timeBlock) => ({
      availabilityTimeBlockId: ulid(),
      startAt: timeBlock.startAt,
      endAt: timeBlock.endAt,
    }));

    const { data, error } = await supabase.rpc(
      'replace_availability_time_blocks',
      {
        p_session_id: sessionId,
        p_user_id: userId,
        p_time_blocks: timeBlocksPayload,
      },
    );

    if (error) {
      logger.error`スケジュール置換RPCエラー: ${error.message}`;
      return err(new Error(error.message));
    }

    return ok(
      toRecordArray(data).map(
        (timeBlock) => camelCaseKeys(timeBlock) as AvailabilityTimeBlockRow,
      ),
    );
  } catch (e) {
    logger.error`replaceAvailabilityTimeBlocks 予期しないエラー: ${e}`;
    return err(e instanceof Error ? e : new Error('Unknown error'));
  }
};
