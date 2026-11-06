import { isNil } from 'ramda';

import { SchedulePhases, SessionPhases } from '@/db/enum';
import { createDbClient } from '@/lib/supabase/server';
import { err, ok, type Result } from '@/types/result';

import type { Database } from '@/db/types';

type SessionPhase = Database['public']['Enums']['session_phase'];
type SchedulePhase = Database['public']['Enums']['schedule_phase'];

type SchedulingPhases = {
  sessionPhase: SessionPhase;
  schedulePhase: SchedulePhase;
};

export const getSchedulingPhases = async (
  sessionId: string,
): Promise<Result<SchedulingPhases>> => {
  try {
    const dbClient = await createDbClient();

    const { data: session, error: sessionError } = await dbClient
      .from('game_sessions')
      .select('session_phase, schedule_phase')
      .eq('game_session_id', sessionId)
      .maybeSingle();

    if (sessionError) {
      return err(new Error(sessionError.message));
    }
    if (isNil(session)) {
      return err(new Error('セッションが見つかりません'));
    }

    return ok({
      sessionPhase: session.session_phase,
      schedulePhase: session.schedule_phase,
    });
  } catch (e) {
    return err(e instanceof Error ? e : new Error('Unknown error'));
  }
};

export const canSubmitAvailabilityInCurrentPhase = (
  sessionPhase: SessionPhase,
  schedulePhase: SchedulePhase,
): boolean => {
  if (schedulePhase !== SchedulePhases.ADJUSTING.value) {
    return false;
  }

  return (
    sessionPhase === SessionPhases.RECRUITING.value ||
    sessionPhase === SessionPhases.PREPARATION.value
  );
};

export const canConfirmScheduleInCurrentPhase = (
  sessionPhase: SessionPhase,
): boolean => {
  return sessionPhase === SessionPhases.PREPARATION.value;
};
