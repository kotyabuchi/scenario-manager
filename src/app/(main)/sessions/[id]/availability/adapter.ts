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
  AvailabilitySlotInput,
  AvailabilitySlotRow,
  AvailabilitySlotWithUser,
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
  a: AvailabilitySlotInput,
  b: AvailabilitySlotInput,
): boolean => {
  const aStart = new Date(a.startAt).getTime();
  const aEnd = new Date(a.endAt).getTime();
  const bStart = new Date(b.startAt).getTime();
  const bEnd = new Date(b.endAt).getTime();
  return aStart < bEnd && bStart < aEnd;
};

const validateAvailabilitySlots = (
  slots: AvailabilitySlotInput[],
): Result<void> => {
  for (const slot of slots) {
    const startMs = new Date(slot.startAt).getTime();
    const endMs = new Date(slot.endAt).getTime();
    if (!Number.isFinite(startMs) || !Number.isFinite(endMs)) {
      return err(new Error('日時形式が不正です'));
    }
    if (startMs >= endMs) {
      return err(new Error('開始日時は終了日時より前である必要があります'));
    }
    if (
      !hasThirtyMinuteBoundary(slot.startAt) ||
      !hasThirtyMinuteBoundary(slot.endAt)
    ) {
      return err(new Error('日時は30分単位で指定してください'));
    }
  }

  const sorted = [...slots].sort(
    (a, b) => new Date(a.startAt).getTime() - new Date(b.startAt).getTime(),
  );
  for (let index = 1; index < sorted.length; index += 1) {
    const prev = sorted[index - 1];
    const current = sorted[index];
    if (isNil(prev) || isNil(current)) {
      continue;
    }
    if (isOverlapping(prev, current)) {
      return err(new Error('提出枠同士が重複しています'));
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
      { data: currentParticipant },
      { data: allParticipants },
      { data: allSlots },
      { data: confirmedSlots, error: confirmedSlotsError },
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
        .from('session_availability_slots')
        .select('*')
        .eq('session_id', sessionId)
        .order('start_at', { ascending: true }),
      supabase
        .from('game_schedule_slots')
        .select('*')
        .eq('session_id', sessionId)
        .order('slot_order', { ascending: true }),
    ]);

    if (confirmedSlotsError) {
      logger.error`ワークスペース初期データ取得(確定枠)エラー: ${confirmedSlotsError.message}`;
      return err(new Error(confirmedSlotsError.message));
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

    const activeSlots = (allSlots ?? []).filter((slot) => {
      const participant = participantMap.get(slot.user_id);
      return (
        participant?.participantStatus === ParticipantStatuses.CONFIRMED.value
      );
    });

    const userIds = [...new Set(activeSlots.map((slot) => slot.user_id))];
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

    const myAvailabilitySlots = activeSlots
      .filter((slot) => slot.user_id === currentUserId)
      .map((slot) => camelCaseKeys(toRecord(slot)) as AvailabilitySlotRow);

    const otherUserAvailabilitySlots: AvailabilitySlotWithUser[] = activeSlots
      .filter((slot) => slot.user_id !== currentUserId)
      .map((slot) => {
        const participant = participantMap.get(slot.user_id);
        return {
          ...(camelCaseKeys(toRecord(slot)) as AvailabilitySlotRow),
          userName: userNameMap.get(slot.user_id) ?? '退会済みユーザー',
          participantType: participant?.participantType ?? 'PLAYER',
          isHost: slot.user_id === session.created_by_id,
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
      myAvailabilitySlots,
      otherUserAvailabilitySlots,
      confirmedScheduleSlots: toRecordArray(confirmedSlots).map(
        (slot) =>
          camelCaseKeys(
            slot,
          ) as AvailabilityWorkspaceData['confirmedScheduleSlots'][number],
      ),
    });
  } catch (e) {
    logger.error`getAvailabilityWorkspaceData 予期しないエラー: ${e}`;
    return err(e instanceof Error ? e : new Error('Unknown error'));
  }
};

/**
 * 自分の可用枠を全置換で保存する
 */
export const replaceAvailabilitySlots = async (
  sessionId: string,
  userId: string,
  slots: AvailabilitySlotInput[],
): Promise<Result<AvailabilitySlotRow[]>> => {
  try {
    const validation = validateAvailabilitySlots(slots);
    if (!validation.success) {
      return err(validation.error);
    }

    const supabase = await createDbClient();

    const { error: deleteError } = await supabase
      .from('session_availability_slots')
      .delete()
      .eq('session_id', sessionId)
      .eq('user_id', userId);

    if (deleteError) {
      logger.error`可用枠削除エラー: ${deleteError.message}`;
      return err(new Error(deleteError.message));
    }

    if (slots.length === 0) {
      return ok([]);
    }

    const rows: Database['public']['Tables']['session_availability_slots']['Insert'][] =
      slots.map((slot) => ({
        availability_slot_id: ulid(),
        session_id: sessionId,
        user_id: userId,
        start_at: slot.startAt,
        end_at: slot.endAt,
      }));

    const { data, error: insertError } = await supabase
      .from('session_availability_slots')
      .insert(rows)
      .select('*')
      .order('start_at', { ascending: true });

    if (insertError) {
      logger.error`可用枠保存エラー: ${insertError.message}`;
      return err(new Error(insertError.message));
    }

    return ok(
      toRecordArray(data).map(
        (slot) => camelCaseKeys(slot) as AvailabilitySlotRow,
      ),
    );
  } catch (e) {
    logger.error`replaceAvailabilitySlots 予期しないエラー: ${e}`;
    return err(e instanceof Error ? e : new Error('Unknown error'));
  }
};
