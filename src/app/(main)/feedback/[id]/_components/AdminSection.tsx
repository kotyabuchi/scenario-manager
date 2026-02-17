'use client';

import { useCallback, useTransition } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { FloppyDisk, GitMerge, ShieldCheck } from '@phosphor-icons/react/ssr';

import { updateStatusAction } from '../../actions';
import { type AdminSectionFormValues, adminSectionSchema } from '../schema';
import * as styles from './styles';

import { Button } from '@/components/elements/button/button';
import { FormField } from '@/components/elements/form-field';
import {
  Select,
  type SelectItem,
  type SelectValueChangeDetails,
} from '@/components/elements/select/select';
import { Textarea } from '@/components/elements/textarea';
import { FeedbackPriorities, FeedbackStatuses } from '@/db/enum';
import { useSystemMessageActions } from '@/hooks/useSystemMessage';

const statusItems: SelectItem[] = Object.values(FeedbackStatuses).map((s) => ({
  value: s.value,
  label: s.label,
}));

type AdminSectionProps = {
  feedbackId: string;
  currentStatus: string;
  currentPriority: string | null;
  currentAdminNote: string | null;
};

export const AdminSection = ({
  feedbackId,
  currentStatus,
  currentPriority,
  currentAdminNote,
}: AdminSectionProps) => {
  const [isPending, startTransition] = useTransition();
  const { addMessage } = useSystemMessageActions();

  const { register, handleSubmit, watch, setValue } =
    useForm<AdminSectionFormValues>({
      resolver: zodResolver(adminSectionSchema),
      defaultValues: {
        status: currentStatus,
        priority: currentPriority ?? undefined,
        adminNote: currentAdminNote ?? '',
      },
    });

  const status = watch('status');
  const priority = watch('priority');

  const handleStatusChange = useCallback(
    (details: SelectValueChangeDetails<SelectItem>) => {
      const newStatus = details.value[0];
      if (newStatus) setValue('status', newStatus);
    },
    [setValue],
  );

  const onSubmit = handleSubmit((data: AdminSectionFormValues) => {
    startTransition(async () => {
      const result = await updateStatusAction(
        feedbackId,
        data.status,
        data.priority || undefined,
        data.adminNote || undefined,
      );
      if (result.success) {
        addMessage('success', '設定を保存しました');
      } else {
        addMessage('danger', result.error.message);
      }
    });
  });

  return (
    <section className={styles.adminSection}>
      {/* ヘッダー */}
      <div className={styles.adminSection_header}>
        <ShieldCheck
          size={20}
          weight="fill"
          className={styles.adminSection_headerIcon}
        />
        <span className={styles.adminSection_title}>管理者設定</span>
        <span className={styles.adminSection_headerBadge}>Moderator Only</span>
      </div>
      <hr className={styles.adminSection_divider} />

      <form onSubmit={onSubmit}>
        {/* 2カラムグリッド */}
        <div className={styles.adminSection_grid}>
          {/* 左カラム: ステータス + 優先度 + 統合 */}
          <div className={styles.adminSection_leftCol}>
            <FormField label="ステータスを変更">
              <Select
                items={statusItems}
                value={[status]}
                onValueChange={handleStatusChange}
                aria-label="ステータスを変更"
              />
            </FormField>

            <FormField label="優先度">
              <div
                className={styles.adminSection_priorityPills}
                role="radiogroup"
                aria-label="優先度"
              >
                {Object.values(FeedbackPriorities).map((p) => (
                  // biome-ignore lint/a11y/useSemanticElements: カスタムスタイルのピルボタンにARIA radioパターンを適用
                  <button
                    key={p.value}
                    type="button"
                    role="radio"
                    aria-checked={priority === p.value}
                    className={styles.adminSection_priorityPill({
                      isActive: priority === p.value,
                    })}
                    onClick={() => setValue('priority', p.value)}
                  >
                    {p.label}
                  </button>
                ))}
              </div>
            </FormField>

            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled
              className={styles.adminSection_mergeButton}
            >
              <GitMerge size={16} />
              他の投稿と統合する
            </Button>
          </div>

          {/* 右カラム: 運営メモ */}
          <div className={styles.adminSection_rightCol}>
            <FormField id="admin-note" label="運営メモ（非公開）">
              <Textarea
                id="admin-note"
                {...register('adminNote')}
                placeholder="社内向けのメモを残すことができます..."
                maxLength={2000}
                css={styles.adminSection_textareaOverrides}
              />
            </FormField>
          </div>
        </div>

        {/* 保存ボタン */}
        <div className={styles.adminSection_actions}>
          <Button
            type="submit"
            status="primary"
            size="sm"
            disabled={isPending}
            loading={isPending}
            loadingText="保存中..."
          >
            <FloppyDisk size={16} />
            設定を保存する
          </Button>
        </div>
      </form>
    </section>
  );
};
