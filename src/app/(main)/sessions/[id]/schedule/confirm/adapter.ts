import { ulid } from 'ulid';

import {
  ParticipantStatuses,
  ParticipantTypes,
  SchedulePhases,
} from '@/db/enum';
import { buildScheduleRecommendations } from '@/lib/availability/recommendation';
import { getAppLogger } from '@/lib/logger';
import { createDbClient } from '@/lib/supabase/server';
import { camelCaseKeys, toRecordArray } from '@/lib/supabase/transform';
import { err, ok, type Result } from '@/types/result';

import type { Database } from '@/db/types';
import type {
  AvailabilitySlotInput,
  ConfirmedScheduleSlotRow,
  RecommendationGroup,
  RecommendationParticipant,
  RecommendationSourceSlot,
} from '../../availability/interface';

const logger = getAppLogger(['app', 'sessions', 'schedule', 'confirm']);

const THIRTY_MINUTES_MS = 30 * 60 * 1000;

const validateConfirmedSlots = (
  slots: AvailabilitySlotInput[],
): Result<void> => {
  const sorted = [...slots].sort(
    (a, b) => new Date(a.startAt).getTime() - new Date(b.startAt).getTime(),
  );

  for (const slot of sorted) {
    const startMs = new Date(slot.startAt).getTime();
    const endMs = new Date(slot.endAt).getTime();
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
      return err(new Error('確定枠同士が重複しています'));
    }
  }

  return ok(undefined);
};

const ensureGameScheduleParent = async (
  sessionId: string,
  firstSlotStartAt: string,
): Promise<Result<void>> => {
  const supabase = await createDbClient();
  const { data: existing, error: selectError } = await supabase
    .from('game_schedules')
    .select('session_id')
    .eq('session_id', sessionId)
    .maybeSingle();

  if (selectError) {
    return err(new Error(selectError.message));
  }

  if (!existing) {
    const payload: Database['public']['Tables']['game_schedules']['Insert'] = {
      session_id: sessionId,
      schedule_date: firstSlotStartAt,
      schedule_phase: SchedulePhases.CONFIRMED.value,
    };
    const { error: insertError } = await supabase
      .from('game_schedules')
      .insert(payload);
    if (insertError) {
      return err(new Error(insertError.message));
    }
    return ok(undefined);
  }

  const { error: updateError } = await supabase
    .from('game_schedules')
    .update({
      schedule_date: firstSlotStartAt,
      schedule_phase: SchedulePhases.CONFIRMED.value,
    })
    .eq('session_id', sessionId);

  if (updateError) {
    return err(new Error(updateError.message));
  }

  return ok(undefined);
};

/**
 * 確定枠を全置換する（再編集可）
 */
export const replaceConfirmedScheduleSlots = async (
  sessionId: string,
  actorUserId: string,
  slots: AvailabilitySlotInput[],
): Promise<Result<ConfirmedScheduleSlotRow[]>> => {
  try {
    const validation = validateConfirmedSlots(slots);
    if (!validation.success) {
      return err(validation.error);
    }

    if (slots.length === 0) {
      return err(new Error('最低1つの日程枠を選択してください'));
    }

    const [firstSlot] = slots;
    if (!firstSlot) {
      return err(new Error('最低1つの日程枠を選択してください'));
    }

    const ensureParent = await ensureGameScheduleParent(
      sessionId,
      firstSlot.startAt,
    );
    if (!ensureParent.success) {
      logger.error`game_schedules 親レコード更新エラー: ${ensureParent.error}`;
      return err(ensureParent.error);
    }

    const supabase = await createDbClient();

    const { error: deleteError } = await supabase
      .from('game_schedule_slots')
      .delete()
      .eq('session_id', sessionId);

    if (deleteError) {
      logger.error`確定枠削除エラー: ${deleteError.message}`;
      return err(new Error(deleteError.message));
    }

    const rows: Database['public']['Tables']['game_schedule_slots']['Insert'][] =
      slots.map((slot, index) => ({
        game_schedule_slot_id: ulid(),
        session_id: sessionId,
        start_at: slot.startAt,
        end_at: slot.endAt,
        slot_order: index + 1,
        created_by: actorUserId,
      }));

    const { data, error: insertError } = await supabase
      .from('game_schedule_slots')
      .insert(rows)
      .select('*')
      .order('slot_order', { ascending: true });

    if (insertError) {
      logger.error`確定枠保存エラー: ${insertError.message}`;
      return err(new Error(insertError.message));
    }

    return ok(
      toRecordArray(data).map(
        (row) => camelCaseKeys(row) as ConfirmedScheduleSlotRow,
      ),
    );
  } catch (e) {
    logger.error`replaceConfirmedScheduleSlots 予期しないエラー: ${e}`;
    return err(e instanceof Error ? e : new Error('Unknown error'));
  }
};

/**
 * 確定UI用のおすすめ候補を取得する
 * 提出枠が0件の場合は空配列を返す（UI側で不足表示）
 */
export const getScheduleRecommendations = async (
  sessionId: string,
): Promise<Result<RecommendationGroup[]>> => {
  try {
    const supabase = await createDbClient();

    const [
      { data: session, error: sessionError },
      { data: participants, error: participantsError },
      { data: availabilitySlots, error: availabilitySlotsError },
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
        .from('session_availability_slots')
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
    if (availabilitySlotsError) {
      logger.error`おすすめ取得(提出枠)エラー: ${availabilitySlotsError.message}`;
      return err(new Error(availabilitySlotsError.message));
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

    const slotsForRecommendation: RecommendationSourceSlot[] = (
      availabilitySlots ?? []
    )
      .filter((slot) => participantUserIds.has(slot.user_id))
      .map((slot) => ({
        userId: slot.user_id,
        startAt: slot.start_at,
        endAt: slot.end_at,
      }));

    if (slotsForRecommendation.length === 0) {
      return ok([]);
    }

    const minPlaytimeMinutes =
      ((session.scenario as { min_playtime?: number | null } | null)
        ?.min_playtime as number | null | undefined) ?? null;

    const recommendations = buildScheduleRecommendations({
      participants: participantsForRecommendation,
      slots: slotsForRecommendation,
      minPlaytimeMinutes,
    });

    return ok(recommendations);
  } catch (e) {
    logger.error`getScheduleRecommendations 予期しないエラー: ${e}`;
    return err(e instanceof Error ? e : new Error('Unknown error'));
  }
};
