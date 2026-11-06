'use client';

import { useState, useTransition } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  BookOpen,
  Calendar,
  Check,
  CheckCircle,
  PencilLine,
  WarningCircle,
} from '@phosphor-icons/react/ssr';
import { isNil } from 'ramda';

import { completeSessionAction } from '../actions';
import { type CompleteSessionValues, completeSessionSchema } from '../schema';
import * as styles from './styles';

import { Button } from '@/components/elements/button/button';
import { FieldError } from '@/components/elements/field-error/field-error';
import { Modal, ModalDismissButton } from '@/components/elements/modal';
import { Textarea } from '@/components/elements/textarea';

type CompleteSessionDialogView = 'confirm' | 'success';

type CompleteSessionDialogProps = {
  sessionId: string;
  expectedUpdatedAt: string;
  scenarioName: string;
  systemName: string;
  scheduleLabel: string;
  open: boolean;
  onOpenChange: (details: { open: boolean }) => void;
  /** Storybook用: 初期表示ビュー */
  initialView?: CompleteSessionDialogView;
};

const CHECKLIST_ITEMS = [
  '参加者のステータスを更新',
  '経験点の配布を実行',
  'セッションログをアーカイブ',
] as const;

export const CompleteSessionDialog = ({
  sessionId,
  expectedUpdatedAt,
  scenarioName,
  systemName,
  scheduleLabel,
  open,
  onOpenChange,
  initialView = 'confirm',
}: CompleteSessionDialogProps) => {
  const [view, setView] = useState<CompleteSessionDialogView>(initialView);
  const [isPending, startTransition] = useTransition();
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CompleteSessionValues>({
    resolver: zodResolver(completeSessionSchema),
    defaultValues: {
      note: '',
    },
  });

  const handleClose = () => {
    onOpenChange({ open: false });
  };

  const handleExitComplete = () => {
    reset();
    setServerError(null);
    setView('confirm');
  };

  const onSubmit = (data: CompleteSessionValues) => {
    setServerError(null);

    startTransition(async () => {
      const result = await completeSessionAction(
        sessionId,
        expectedUpdatedAt,
        data,
      );

      if (!result.success) {
        setServerError(
          result.error?.message ?? 'セッションの完了処理に失敗しました',
        );
      } else {
        reset();
        setView('success');
      }
    });
  };

  const confirmFooter = (
    <>
      <ModalDismissButton onClick={handleClose} disabled={isPending}>
        キャンセル
      </ModalDismissButton>
      <Button
        type="submit"
        status="primary"
        disabled={isPending}
        loading={isPending}
        loadingText="完了処理中..."
        form="complete-session-form"
      >
        <CheckCircle size={16} weight="fill" />
        完了する
      </Button>
    </>
  );

  if (view === 'success') {
    return (
      <Modal
        open={open}
        onOpenChange={handleClose}
        onExitComplete={handleExitComplete}
        title="完了"
      >
        <div className={styles.dialog_success_container}>
          <div className={styles.dialog_success_iconCircle}>
            <Check size={40} weight="bold" />
          </div>
          <h3 className={styles.dialog_success_title}>
            セッションが完了しました
          </h3>
          <p className={styles.dialog_success_description}>
            お疲れ様でした！参加者にレビューを書いてもらうことで、今後のセッション運営に役立てることができます。
          </p>
          <div className={styles.dialog_success_actions}>
            {/* TODO: レビュー機能実装後、disabled を外してリンクボタンに切り替える */}
            <Button
              type="button"
              status="primary"
              disabled
              prefix={<PencilLine size={16} />}
            >
              レビューを書く（準備中）
            </Button>
            <button
              type="button"
              className={styles.dialog_cancelLink}
              onClick={handleClose}
            >
              後で
            </button>
          </div>
        </div>
      </Modal>
    );
  }

  return (
    <Modal
      open={open}
      onOpenChange={(details) => {
        if (!details.open) handleClose();
      }}
      onExitComplete={handleExitComplete}
      title="セッションを完了にしますか？"
      footer={confirmFooter}
    >
      <form
        id="complete-session-form"
        onSubmit={handleSubmit(onSubmit)}
        className={styles.dialog_form}
      >
        {/* シナリオ情報カード */}
        <div className={styles.dialog_scenarioCard}>
          <div className={styles.dialog_scenarioCard_thumbnail}>
            <BookOpen size={28} />
          </div>
          <div className={styles.dialog_scenarioCard_info}>
            {systemName && (
              <span className={styles.dialog_scenarioCard_system}>
                {systemName}
              </span>
            )}
            <span className={styles.dialog_scenarioCard_title}>
              {scenarioName}
            </span>
            <span className={styles.dialog_scenarioCard_date}>
              <Calendar size={14} />
              {scheduleLabel}
            </span>
          </div>
        </div>

        {/* チェックリスト（装飾的） */}
        <div className={styles.dialog_checklist}>
          <span className={styles.dialog_checklist_label}>完了時の処理</span>
          <ul>
            {CHECKLIST_ITEMS.map((item) => (
              <li key={item} className={styles.dialog_checklist_item}>
                <span
                  className={styles.dialog_checklist_checkbox}
                  aria-hidden="true"
                >
                  <Check size={14} weight="bold" />
                </span>
                <span className={styles.dialog_checklist_itemText}>{item}</span>
              </li>
            ))}
          </ul>
        </div>

        {!isNil(serverError) && (
          <div className={styles.dialog_serverError} role="alert">
            <WarningCircle size={16} weight="fill" />
            {serverError}
          </div>
        )}

        {/* GMメモ */}
        <div className={styles.dialog_field}>
          <label htmlFor="complete-note" className={styles.dialog_label}>
            GMメモ
            <span className={styles.optionalBadge}>（任意・非公開）</span>
          </label>
          <Textarea
            id="complete-note"
            {...register('note')}
            placeholder="セッションの感想や次回への引き継ぎメモを残してください"
            rows={4}
          />
          <FieldError error={errors.note} />
        </div>
      </form>
    </Modal>
  );
};
