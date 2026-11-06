'use client';

import { useOptimistic, useState, useTransition } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { CheckCircle, Clock, PencilSimple, X } from '@phosphor-icons/react/ssr';
import { isNil } from 'ramda';

import { updateCharacterSheetAction } from '../../actions';
import { type CharacterSheetValues, characterSheetSchema } from '../../schema';
import * as styles from '../../styles';

import { Button } from '@/components/elements/button/button';
import { FieldError } from '@/components/elements/field-error/field-error';
import { IconButton } from '@/components/elements/icon-button/icon-button';
import { Input } from '@/components/elements/input/input';

type CharacterSheetEditProps = {
  sessionId: string;
  characterSheetUrl: string | null;
  participantType: string;
  isSessionCreator: boolean;
};

export const CharacterSheetEdit = ({
  sessionId,
  characterSheetUrl,
  participantType,
  isSessionCreator,
}: CharacterSheetEditProps) => {
  const [isEditing, setIsEditing] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [optimisticUrl, setOptimisticUrl] = useOptimistic(characterSheetUrl);
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<CharacterSheetValues>({
    resolver: zodResolver(characterSheetSchema),
    defaultValues: {
      url: characterSheetUrl ?? '',
    },
  });

  const onSubmit = (data: CharacterSheetValues) => {
    setServerError(null);
    const normalizedUrl = data.url === '' ? null : data.url;

    startTransition(async () => {
      setOptimisticUrl(normalizedUrl);
      try {
        const result = await updateCharacterSheetAction(sessionId, data.url);
        if (!result.success) {
          setServerError(result.error?.message ?? '更新に失敗しました');
        } else {
          setIsEditing(false);
          reset({ url: normalizedUrl ?? '' });
        }
      } catch {
        setServerError('更新に失敗しました');
      }
    });
  };

  const handleCancel = () => {
    setIsEditing(false);
    setServerError(null);
    reset({ url: characterSheetUrl ?? '' });
  };

  // 編集モード
  if (isEditing) {
    return (
      <form
        onSubmit={handleSubmit(onSubmit)}
        className={styles.participants_csEditForm}
      >
        <div className={styles.participants_csEditInputRow}>
          <Input
            type="url"
            placeholder="https://..."
            size="sm"
            {...register('url')}
          />
        </div>
        <FieldError error={errors.url} />
        {!isNil(serverError) && (
          <p className={styles.participants_csEditError}>{serverError}</p>
        )}
        <div className={styles.participants_csEditActions}>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={handleCancel}
            prefix={<X size={14} />}
          >
            キャンセル
          </Button>
          <Button
            type="submit"
            variant="solid"
            size="sm"
            loading={isPending}
            loadingText="保存中..."
          >
            保存
          </Button>
        </div>
      </form>
    );
  }

  // 通常モード
  const labels: React.ReactNode[] = [];

  if (isSessionCreator) {
    labels.push(
      <span key="creator" className={styles.participants_statusText}>
        主催者
      </span>,
    );
  }

  if (!isNil(optimisticUrl)) {
    labels.push(
      <span
        key="cs-submitted"
        className={`${styles.participants_characterSheet} ${styles.participants_csSubmitted}`}
      >
        <CheckCircle size={14} weight="fill" />
        CS提出済
      </span>,
    );
    labels.push(
      <a
        key="cs-link"
        href={optimisticUrl}
        target="_blank"
        rel="noopener noreferrer"
        className={styles.participants_csLink}
      >
        {optimisticUrl}
      </a>,
    );
    labels.push(
      <IconButton
        key="cs-edit"
        type="button"
        variant="ghost"
        size="sm"
        aria-label="キャラクターシートURLを編集"
        onClick={() => setIsEditing(true)}
      >
        <PencilSimple size={14} />
      </IconButton>,
    );
  } else if (participantType === 'PLAYER') {
    labels.push(
      <span
        key="cs-missing"
        className={`${styles.participants_characterSheet} ${styles.participants_csNone}`}
      >
        <Clock weight="fill" size={14} />
        CS未提出
      </span>,
    );
    labels.push(
      <button
        key="cs-register"
        type="button"
        className={styles.participants_csEditButton}
        onClick={() => setIsEditing(true)}
      >
        登録
      </button>,
    );
  } else {
    // SPECTATOR with no URL
    labels.push(
      <button
        key="cs-register"
        type="button"
        className={styles.participants_csEditButton}
        onClick={() => setIsEditing(true)}
      >
        登録
      </button>,
    );
  }

  return <div className={styles.participants_csEditWrap}>{labels}</div>;
};

export type { CharacterSheetEditProps };
