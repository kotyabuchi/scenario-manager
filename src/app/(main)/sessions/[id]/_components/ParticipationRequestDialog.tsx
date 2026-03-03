'use client';

import { useState, useTransition } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  Crown,
  Eye,
  PaperPlaneTilt,
  User,
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
  hasKeeper: boolean;
  participantCount: number;
  maxParticipantCount: number;
  scheduleLabel: string;
  open: boolean;
  onOpenChange: (details: { open: boolean }) => void;
};

const PARTICIPANT_TYPE_OPTIONS = [
  {
    value: 'KEEPER' as const,
    label: 'GMとして参加',
    description: 'このセッションのGMを担当します',
    icon: Crown,
  },
  {
    value: 'PLAYER' as const,
    label: 'プレイヤーとして参加',
    description: 'キャラクターを操作して参加します',
    icon: User,
  },
  {
    value: 'SPECTATOR' as const,
    label: '観戦者として参加',
    description: 'セッションを見学します',
    icon: Eye,
  },
];

export const ParticipationRequestDialog = ({
  sessionId,
  sessionName: _sessionName,
  scenarioName,
  hasKeeper,
  participantCount,
  maxParticipantCount: _maxParticipantCount,
  scheduleLabel,
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

  const visibleOptions = PARTICIPANT_TYPE_OPTIONS.filter(
    (option) => option.value !== 'KEEPER' || !hasKeeper,
  );

  const memberLabel = hasKeeper
    ? `現${participantCount}人`
    : `現${participantCount}人 (GM募集中)`;

  return (
    <Modal open={open} onOpenChange={onOpenChange} title="セッションに参加申請">
      <form
        id="participation-request-form"
        onSubmit={handleSubmit(onSubmit)}
        className={styles.form}
      >
        {/* サブタイトル */}
        <p className={styles.dialog_subtitle}>
          希望する参加枠を選択してください
        </p>

        {/* サーバーエラー */}
        {!isNil(serverError) && (
          <div className={styles.serverError} role="alert">
            <WarningCircle size={16} weight="fill" aria-hidden="true" />
            <span>{serverError}</span>
          </div>
        )}

        {/* セッション情報サマリー */}
        <div className={styles.sessionSummary}>
          {!isNil(scenarioName) && (
            <div className={styles.sessionSummary_row}>
              <span className={styles.sessionSummary_rowLabel}>SCENARIO</span>
              <span className={styles.sessionSummary_rowValue}>
                {scenarioName}
              </span>
            </div>
          )}
          <div className={styles.sessionSummary_row}>
            <span className={styles.sessionSummary_rowLabel}>MEMBER</span>
            <span className={styles.sessionSummary_rowValue}>
              {memberLabel}
            </span>
          </div>
          <div className={styles.sessionSummary_row}>
            <span className={styles.sessionSummary_rowLabel}>DATE</span>
            <span className={styles.sessionSummary_rowValue}>
              {scheduleLabel}
            </span>
          </div>
        </div>

        {/* 参加タイプ選択 */}
        <div className={styles.fieldGroup}>
          <span className={styles.fieldLabel}>参加タイプ</span>
          <div
            className={styles.participantTypeCards}
            role="radiogroup"
            aria-label="参加タイプを選択"
          >
            {visibleOptions.map((option) => {
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
                  <div className={styles.participantTypeCard_content}>
                    <span className={styles.participantTypeCard_title}>
                      {option.label}
                    </span>
                    <span
                      className={styles.cx(
                        styles.participantTypeCard_description,
                        isSelected
                          ? styles.participantTypeCard_description_selected
                          : undefined,
                      )}
                    >
                      {option.description}
                    </span>
                  </div>
                  <div
                    className={styles.cx(
                      styles.participantTypeCard_radio,
                      isSelected
                        ? styles.participantTypeCard_radio_selected
                        : undefined,
                    )}
                    aria-hidden="true"
                  />
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
          </label>
          <Textarea
            id="participation-message"
            {...register('applicationMessage')}
            placeholder="よろしくお願いします！"
            maxLength={200}
            rows={3}
          />
          <FieldError error={errors.applicationMessage} />
        </div>

        {/* 送信セクション */}
        <div className={styles.dialog_submitSection}>
          <Button
            type="submit"
            status="primary"
            disabled={isPending}
            loading={isPending}
            loadingText="申請中..."
            className={styles.dialog_submitButton}
            prefix={<PaperPlaneTilt size={16} weight="fill" />}
          >
            申請を送る
          </Button>
          <button
            type="button"
            className={styles.dialog_cancelLink}
            onClick={handleClose}
            disabled={isPending}
          >
            キャンセル
          </button>
        </div>
      </form>
    </Modal>
  );
};
