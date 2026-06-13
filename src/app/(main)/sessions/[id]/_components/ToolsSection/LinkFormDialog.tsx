'use client';

import { useEffect } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { WarningCircle } from '@phosphor-icons/react/ssr';
import { isNil } from 'ramda';

import { type SessionLinkValues, sessionLinkSchema } from '../../schema';
import * as dialogStyles from '../styles';
import * as styles from './styles';

import { Button } from '@/components/elements/button/button';
import { FieldError } from '@/components/elements/field-error/field-error';
import { Input } from '@/components/elements/input/input';
import { Modal } from '@/components/elements/modal';
import { Select } from '@/components/elements/select/select';
import { SessionLinkTypes } from '@/db/enum';

import type { SessionLink } from '../../../interface';

/** Select の選択肢 */
const linkTypeItems = Object.values(SessionLinkTypes).map((item) => ({
  label: item.label,
  value: item.value,
}));

type LinkFormDialogProps = {
  /** ダイアログの開閉状態 */
  open: boolean;
  /** ダイアログの開閉変更 */
  onOpenChange: (details: { open: boolean }) => void;
  /** 編集対象のリンク（新規追加時は undefined） */
  editingLink?: SessionLink | undefined;
  /** フォームデータの送信（親で Action を実行する） */
  onSubmit: (data: SessionLinkValues) => void;
  /** 送信中の状態 */
  isPending: boolean;
  /** サーバー側のエラーメッセージ */
  serverError: string | null;
};

export const LinkFormDialog = ({
  open,
  onOpenChange,
  editingLink,
  onSubmit,
  isPending,
  serverError,
}: LinkFormDialogProps) => {
  const isEditing = !isNil(editingLink);

  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors },
  } = useForm<SessionLinkValues>({
    resolver: zodResolver(sessionLinkSchema),
    defaultValues: {
      linkType: 'DISCORD',
      url: '',
      label: '',
    },
  });

  /** open / editingLink 変更時にフォームをリセット */
  useEffect(() => {
    if (open) {
      if (isEditing) {
        reset({
          linkId: editingLink.linkId,
          linkType: editingLink.linkType as SessionLinkValues['linkType'],
          url: editingLink.url,
          label: editingLink.label ?? '',
        });
      } else {
        reset({
          linkType: 'DISCORD',
          url: '',
          label: '',
        });
      }
    }
  }, [open, editingLink, isEditing, reset]);

  const handleClose = () => {
    onOpenChange({ open: false });
  };

  const handleFormSubmit = (data: SessionLinkValues) => {
    onSubmit(data);
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
        loadingText="保存中..."
        form="link-form"
      >
        {isEditing ? '更新' : '追加'}
      </Button>
    </>
  );

  return (
    <Modal
      open={open}
      onOpenChange={onOpenChange}
      title={isEditing ? 'リンクを編集' : 'リンクを追加'}
      footer={footer}
    >
      <form
        id="link-form"
        onSubmit={handleSubmit(handleFormSubmit)}
        className={dialogStyles.dialog_form}
      >
        {/* サーバーエラー */}
        {!isNil(serverError) && (
          <div className={dialogStyles.dialog_serverError} role="alert">
            <WarningCircle size={16} weight="fill" aria-hidden="true" />
            {serverError}
          </div>
        )}

        {/* リンクタイプ */}
        <div className={styles.linkForm_field}>
          <span className={styles.linkForm_label}>リンクタイプ</span>
          <Controller
            name="linkType"
            control={control}
            render={({ field }) => (
              <Select
                items={linkTypeItems}
                value={[field.value]}
                onValueChange={(details) => {
                  const selected = details.value[0];
                  if (selected) {
                    field.onChange(selected);
                  }
                }}
                placeholder="リンクタイプを選択"
                aria-label="リンクタイプ"
              />
            )}
          />
          <FieldError error={errors.linkType} />
        </div>

        {/* URL */}
        <div className={styles.linkForm_field}>
          <label htmlFor="link-url" className={styles.linkForm_label}>
            URL
          </label>
          <Input
            id="link-url"
            type="url"
            placeholder="https://..."
            {...register('url')}
          />
          <FieldError error={errors.url} />
        </div>

        {/* ラベル */}
        <div className={styles.linkForm_field}>
          <label htmlFor="link-label" className={styles.linkForm_label}>
            ラベル
            <span className={styles.linkForm_optionalBadge}>任意</span>
          </label>
          <Input
            id="link-label"
            placeholder="表示名（省略時はリンクタイプ名）"
            {...register('label')}
          />
          <FieldError error={errors.label} />
        </div>
      </form>
    </Modal>
  );
};

export type { LinkFormDialogProps };
