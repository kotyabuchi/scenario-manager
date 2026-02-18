'use client';

import { useState, useTransition } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  Eye,
  FilmSlate,
  Users,
  WarningCircle,
} from '@phosphor-icons/react/ssr';
import { isNil } from 'ramda';

import { applyToSessionAction } from '../actions';
import {
  type ParticipationRequestValues,
  participationRequestSchema,
} from '../schema';
import * as styles from './styles';

import { Button } from '@/components/elements/button/button';
import { FieldError } from '@/components/elements/field-error/field-error';
import { Modal } from '@/components/elements/modal';
import { Textarea } from '@/components/elements/textarea';

type ParticipationRequestDialogProps = {
  sessionId: string;
  sessionName: string;
  scenarioName?: string | undefined;
  open: boolean;
  onOpenChange: (details: { open: boolean }) => void;
};

const PARTICIPANT_TYPE_OPTIONS = [
  {
    value: 'PLAYER' as const,
    label: 'プレイヤー',
    description: 'セッションに参加してプレイします',
    icon: Users,
  },
  {
    value: 'SPECTATOR' as const,
    label: '観戦者',
    description: 'セッションを観戦します',
    icon: Eye,
  },
] as const;

export const ParticipationRequestDialog = ({
  sessionId,
  sessionName,
  scenarioName,
  open,
  onOpenChange,
}: ParticipationRequestDialogProps) => {
  const [isPending, startTransition] = useTransition();
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors },
  } = useForm<ParticipationRequestValues>({
    resolver: zodResolver(participationRequestSchema),
    defaultValues: {
      participantType: 'PLAYER',
      applicationMessage: '',
    },
  });

  const selectedType = watch('participantType');
  const applicationMessage = watch('applicationMessage') ?? '';

  const handleClose = () => {
    reset();
    setServerError(null);
    onOpenChange({ open: false });
  };

  const onSubmit = (data: ParticipationRequestValues) => {
    setServerError(null);

    startTransition(async () => {
      const result = await applyToSessionAction(sessionId, data);

      if (!result.success) {
        setServerError(result.error?.message ?? '参加申請に失敗しました');
      } else {
        reset();
        onOpenChange({ open: false });
      }
    });
  };

  const footer = (
    <>
      <Button
        type="button"
        variant="outline"
        status="primary"
        onClick={handleClose}
        disabled={isPending}
      >
        キャンセル
      </Button>
      <Button
        type="submit"
        status="primary"
        disabled={isPending}
        loading={isPending}
        loadingText="申請中..."
        form="participation-request-form"
      >
        <FilmSlate size={16} weight="fill" />
        参加申請する
      </Button>
    </>
  );

  return (
    <Modal
      open={open}
      onOpenChange={onOpenChange}
      title="セッションへの参加申請"
      footer={footer}
    >
      <form
        id="participation-request-form"
        onSubmit={handleSubmit(onSubmit)}
        className={styles.form}
      >
        {/* サーバーエラー */}
        {!isNil(serverError) && (
          <div className={styles.serverError} role="alert">
            <WarningCircle size={16} weight="fill" aria-hidden="true" />
            <span>{serverError}</span>
          </div>
        )}

        {/* セッション情報サマリー */}
        <div className={styles.sessionSummary}>
          <span className={styles.sessionSummary_label}>
            申請するセッション
          </span>
          <span className={styles.sessionSummary_sessionName}>
            {sessionName}
          </span>
          {!isNil(scenarioName) && (
            <div className={styles.sessionSummary_scenarioRow}>
              <span className={styles.sessionSummary_scenarioLabel}>
                シナリオ:
              </span>
              <span className={styles.sessionSummary_scenarioName}>
                {scenarioName}
              </span>
            </div>
          )}
        </div>

        {/* 参加タイプ選択 */}
        <div className={styles.fieldGroup}>
          <span className={styles.fieldLabel}>参加タイプ</span>
          <div
            className={styles.participantTypeCards}
            role="radiogroup"
            aria-label="参加タイプを選択"
          >
            {PARTICIPANT_TYPE_OPTIONS.map((option) => {
              const Icon = option.icon;
              const isSelected = selectedType === option.value;

              return (
                <label
                  key={option.value}
                  className={styles.cx(
                    styles.participantTypeCard,
                    isSelected
                      ? styles.participantTypeCard_selected
                      : undefined,
                  )}
                >
                  <input
                    type="radio"
                    value={option.value}
                    className={styles.participantTypeCard_radioInput}
                    checked={isSelected}
                    {...register('participantType')}
                    onChange={() => setValue('participantType', option.value)}
                  />
                  <div
                    className={styles.cx(
                      styles.participantTypeCard_iconWrapper,
                      isSelected
                        ? styles.participantTypeCard_iconWrapper_selected
                        : undefined,
                    )}
                    aria-hidden="true"
                  >
                    <Icon size={18} weight={isSelected ? 'fill' : 'regular'} />
                  </div>
                  <span className={styles.participantTypeCard_title}>
                    {option.label}
                  </span>
                  <span className={styles.participantTypeCard_description}>
                    {option.description}
                  </span>
                </label>
              );
            })}
          </div>
          <FieldError error={errors.participantType} />
        </div>

        {/* 一言メッセージ */}
        <div className={styles.fieldGroup}>
          <label htmlFor="participation-message" className={styles.fieldLabel}>
            一言メッセージ
            <span className={styles.optionalBadge}>（任意）</span>
          </label>
          <Textarea
            id="participation-message"
            {...register('applicationMessage')}
            placeholder="自己紹介や意気込みなど、GMへのメッセージをどうぞ"
            maxLength={200}
            rows={3}
          />
          <div
            className={styles.cx(
              styles.charCount,
              applicationMessage.length >= 190
                ? styles.charCount_warning
                : undefined,
            )}
            aria-live="polite"
          >
            <span className="sr-only">
              {applicationMessage.length}文字入力済み（最大200文字）
            </span>
            <span aria-hidden="true">{applicationMessage.length} / 200</span>
          </div>
          <FieldError error={errors.applicationMessage} />
        </div>
      </form>
    </Modal>
  );
};
