'use client';

import { useMemo, useState } from 'react';
import {
  type FieldErrors,
  FormProvider,
  useForm,
  useWatch,
} from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { MegaphoneIcon } from '@phosphor-icons/react/ssr';

import {
  type SessionFormInput,
  type SessionFormValues,
  sessionFormSchema,
} from '../schema';
import { BasicInfoSection } from './sections/basic-info/BasicInfoSection';
import { OtherSection } from './sections/other/OtherSection';
import { ParticipantsSection } from './sections/participants/ParticipantsSection';
import { ScenarioSelectSection } from './sections/scenario/ScenarioSelectSection';
import * as styles from './styles';

import { Button } from '@/components/elements/button/button';

import type { ScenarioSummary, SystemSummary } from '../interface';

type SessionFormProps = {
  onSubmit?: (data: SessionFormValues) => void;
  defaultValues?: Partial<SessionFormInput>;
  isSubmitting?: boolean;
  errors?: FieldErrors<SessionFormInput>;
  systems: SystemSummary[];
  currentUserId?: string;
};
export const SessionForm = ({
  onSubmit,
  defaultValues,
  isSubmitting = false,
  errors: externalErrors,
  systems,
  currentUserId,
}: SessionFormProps) => {
  const formMethod = useForm<SessionFormInput>({
    resolver: zodResolver(sessionFormSchema),
    defaultValues: {
      sessionName: defaultValues?.sessionName ?? '',
      sessionDescription: defaultValues?.sessionDescription ?? '',
      scenarioId: defaultValues?.scenarioId ?? null,
      scheduledAt: defaultValues?.scheduledAt ?? null,
      recruitedPlayerCount: defaultValues?.recruitedPlayerCount ?? 0,
      tools: defaultValues?.tools ?? null,
      isBeginnerFriendly: defaultValues?.isBeginnerFriendly ?? false,
      visibility: defaultValues?.visibility ?? 'PUBLIC',
      scheduleType: defaultValues?.scheduleType ?? 'later',
      creatorParticipantType: defaultValues?.creatorParticipantType ?? 'KEEPER',
    },
  });
  const { handleSubmit, control, setValue } = formMethod;

  const [selectedScenario, setSelectedScenario] =
    useState<ScenarioSummary | null>(null);

  const invitedMembers = useWatch({ name: 'invitedMembers', control }) ?? [];
  const creatorParticipantType =
    useWatch({ name: 'creatorParticipantType', control }) ?? 'KEEPER';
  const invitedMembersWithCreator = useMemo(() => {
    const merged = [...invitedMembers];
    if (currentUserId) {
      merged.unshift({
        userId: currentUserId,
        participantType: creatorParticipantType,
      });
    }
    const seen = new Set<string>();
    return merged.filter((member) => {
      if (seen.has(member.userId)) return false;
      seen.add(member.userId);
      return true;
    });
  }, [creatorParticipantType, currentUserId, invitedMembers]);

  const handleScenarioSelect = (scenario: ScenarioSummary | null) => {
    setValue('scenarioId', scenario?.scenarioId ?? null);
    setSelectedScenario(scenario);
  };

  const onFormSubmit = (data: SessionFormInput) => {
    const scheduledAt =
      data.scheduleType === 'later' ? null : data.scheduledAt || null;
    const normalizedData: SessionFormValues = {
      sessionName: data.sessionName,
      sessionDescription: data.sessionDescription,
      scenarioId: data.scenarioId || null,
      scheduledAt,
      recruitedPlayerCount: data.recruitedPlayerCount ?? null,
      tools: data.tools || null,
      isBeginnerFriendly: data.isBeginnerFriendly ?? false,
      visibility: data.visibility ?? 'PUBLIC',
      invitedMembers: data.invitedMembers ?? [],
      scheduleType: data.scheduleType ?? 'later',
      creatorParticipantType: data.creatorParticipantType ?? 'KEEPER',
    };
    onSubmit?.(normalizedData);
  };

  return (
    <div className={styles.form_card}>
      <FormProvider {...formMethod}>
        <form onSubmit={handleSubmit(onFormSubmit)}>
          <div className={styles.form_body}>
            <BasicInfoSection
              {...(externalErrors ? { errors: externalErrors } : {})}
            />

            <hr className={styles.form_divider} />

            <ParticipantsSection />

            <hr className={styles.form_divider} />

            <ScenarioSelectSection
              systems={systems}
              selectedScenario={selectedScenario}
              onSelect={handleScenarioSelect}
              invitedMembers={invitedMembersWithCreator}
            />

            <hr className={styles.form_divider} />

            <OtherSection />

            <hr className={styles.form_divider} />

            {/* 送信ボタン */}
            <div className={styles.form_submitArea}>
              <Button
                type="submit"
                status="primary"
                disabled={isSubmitting}
                loading={isSubmitting}
                loadingText="作成中..."
                prefix={<MegaphoneIcon weight="fill" size={16} />}
              >
                セッションを作成
              </Button>
            </div>
          </div>
        </form>
      </FormProvider>
    </div>
  );
};
