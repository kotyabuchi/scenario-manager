import { ulid } from 'ulid';

import { ParticipantStatuses, ParticipantTypes } from '@/db/enum';
import { buildScheduleRecommendations } from '@/lib/availability/recommendation';
import { getAppLogger } from '@/lib/logger';
import { createDbClient } from '@/lib/supabase/server';
import { camelCaseKeys, toRecordArray } from '@/lib/supabase/transform';
import { err, ok, type Result } from '@/types/result';

import type {
  AvailabilityTimeBlockInput,
  ConfirmedScheduleTimeBlockRow,
  RecommendationGroup,
  RecommendationParticipant,
  RecommendationSourceTimeBlock,
} from '../availability/interface';

const logger = getAppLogger(['app', 'sessions', 'schedule', 'confirm']);

const THIRTY_MINUTES_MS = 30 * 60 * 1000;

const validateConfirmedTimeBlocks = (
  timeBlocks: AvailabilityTimeBlockInput[],
): Result<void> => {
  const sorted = [...timeBlocks].sort(
    (a, b) => new Date(a.startAt).getTime() - new Date(b.startAt).getTime(),
  );

  for (const timeBlock of sorted) {
    const startMs = new Date(timeBlock.startAt).getTime();
    const endMs = new Date(timeBlock.endAt).getTime();
    if (!Number.isFinite(startMs) || !Number.isFinite(endMs)) {
      return err(new Error('日時形式が不正です'));
    }
    if (startMs >= endMs) {
      return err(new Error('開始日時は終了日時より前である必要があります'));
    }
    if (startMs % THIRTY_MINUTES_MS !== 0 || endMs % THIRTY_MINUTES_MS !== 0) {
      return err(new Error('日時は30分単位で指定してください'));
    }
  }

  for (let index = 1; index < sorted.length; index += 1) {
    const prev = sorted[index - 1];
    const current = sorted[index];
    if (!prev || !current) {
      continue;
    }
    if (
      new Date(prev.startAt).getTime() < new Date(current.endAt).getTime() &&
      new Date(current.startAt).getTime() < new Date(prev.endAt).getTime()
    ) {
      return err(new Error('確定日程同士が重複しています'));
    }
  }

  return ok(undefined);
};

/**
 * 確定日程を全置換する（RPC でアトミック実行、再編集可）
 */
export const replaceConfirmedScheduleTimeBlocks = async (
  sessionId: string,
  actorUserId: string,
  timeBlocks: AvailabilityTimeBlockInput[],
): Promise<Result<ConfirmedScheduleTimeBlockRow[]>> => {
  try {
    const validation = validateConfirmedTimeBlocks(timeBlocks);
    if (!validation.success) {
      return err(validation.error);
    }

    if (timeBlocks.length === 0) {
      return err(new Error('最低1つのスケジュールを選択してください'));
    }

    const earliestTimeBlock = [...timeBlocks].sort(
      (a, b) => new Date(a.startAt).getTime() - new Date(b.startAt).getTime(),
    )[0];
    if (!earliestTimeBlock) {
      return err(new Error('最低1つのスケジュールを選択してください'));
    }

    const supabase = await createDbClient();

    const scheduleTimeBlocks = timeBlocks.map((timeBlock, index) => ({
      gameScheduleTimeBlockId: ulid(),
      startAt: timeBlock.startAt,
      endAt: timeBlock.endAt,
      blockOrder: index + 1,
    }));

    const { data, error } = await supabase.rpc(
      'replace_confirmed_schedule_time_blocks',
      {
        p_session_id: sessionId,
        p_actor_user_id: actorUserId,
        p_time_blocks: scheduleTimeBlocks,
        p_schedule_date: earliestTimeBlock.startAt,
      },
    );

    if (error) {
      logger.error`確定日程置換RPCエラー: ${error.message}`;
      return err(new Error(error.message));
    }

    return ok(
      toRecordArray(data).map(
        (row) => camelCaseKeys(row) as ConfirmedScheduleTimeBlockRow,
      ),
    );
  } catch (e) {
    logger.error`replaceConfirmedScheduleTimeBlocks 予期しないエラー: ${e}`;
    return err(e instanceof Error ? e : new Error('Unknown error'));
  }
};

/**
 * 確定UI用のおすすめ候補を取得する
 * 提出日時が0件の場合は空配列を返す（UI側で不足表示）
 */
export const getScheduleRecommendations = async (
  sessionId: string,
): Promise<Result<RecommendationGroup[]>> => {
  try {
    const supabase = await createDbClient();

    const [
      { data: session, error: sessionError },
      { data: participants, error: participantsError },
      { data: availabilityTimeBlocks, error: availabilityTimeBlocksError },
    ] = await Promise.all([
      supabase
        .from('game_sessions')
        .select(
          'game_session_id, created_by_id, scenario:scenarios(min_playtime)',
        )
        .eq('game_session_id', sessionId)
        .maybeSingle(),
      supabase
        .from('session_participants')
        .select('user_id, participant_type, participant_status')
        .eq('session_id', sessionId)
        .eq('participant_status', ParticipantStatuses.CONFIRMED.value),
      supabase
        .from('session_availability_time_blocks')
        .select('user_id, start_at, end_at')
        .eq('session_id', sessionId)
        .order('start_at', { ascending: true }),
    ]);

    if (sessionError) {
      logger.error`おすすめ取得(セッション)エラー: ${sessionError.message}`;
      return err(new Error(sessionError.message));
    }
    if (!session) {
      return err(new Error('セッションが見つかりません'));
    }
    if (participantsError) {
      logger.error`おすすめ取得(参加者)エラー: ${participantsError.message}`;
      return err(new Error(participantsError.message));
    }
    if (availabilityTimeBlocksError) {
      logger.error`おすすめ取得(提出日時)エラー: ${availabilityTimeBlocksError.message}`;
      return err(new Error(availabilityTimeBlocksError.message));
    }

    const participantMap = new Map<string, RecommendationParticipant>();
    for (const participant of participants ?? []) {
      participantMap.set(participant.user_id, {
        userId: participant.user_id,
        participantType: participant.participant_type,
        isHost: participant.user_id === session.created_by_id,
      });
    }

    // 主催者が session_participants に存在しないケースを考慮して required user として補完
    if (!participantMap.has(session.created_by_id)) {
      participantMap.set(session.created_by_id, {
        userId: session.created_by_id,
        participantType: ParticipantTypes.KEEPER.value,
        isHost: true,
      });
    }

    const participantsForRecommendation = [...participantMap.values()];
    const participantUserIds = new Set(
      participantsForRecommendation.map((participant) => participant.userId),
    );

    const timeBlocksForRecommendation: RecommendationSourceTimeBlock[] = (
      availabilityTimeBlocks ?? []
    )
      .filter((block) => participantUserIds.has(block.user_id))
      .map((block) => ({
        userId: block.user_id,
        startAt: block.start_at,
        endAt: block.end_at,
      }));

    if (timeBlocksForRecommendation.length === 0) {
      return ok([]);
    }

    const minPlaytimeMinutes =
      ((session.scenario as { min_playtime?: number | null } | null)
        ?.min_playtime as number | null | undefined) ?? null;

    const recommendations = buildScheduleRecommendations({
      participants: participantsForRecommendation,
      timeBlocks: timeBlocksForRecommendation,
      minPlaytimeMinutes,
    });

    return ok(recommendations);
  } catch (e) {
    logger.error`getScheduleRecommendations 予期しないエラー: ${e}`;
    return err(e instanceof Error ? e : new Error('Unknown error'));
  }
};
