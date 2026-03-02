'use client';

import { useState, useTransition } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { X } from '@phosphor-icons/react/ssr';
import { isNil } from 'ramda';

import { updateBasicInfoAction } from '../../../actions';
import {
  type SessionBasicInfoValues,
  sessionBasicInfoSchema,
} from '../../../schema';
import * as styles from '../../../styles';

import { Button } from '@/components/elements/button/button';
import { FormField } from '@/components/elements/form-field/form-field';
import { Input } from '@/components/elements/input';
import { NumberInput } from '@/components/elements/number-input';
import { Switch } from '@/components/elements/switch';
import { Textarea } from '@/components/elements/textarea/textarea';

type BasicInfoEditFormProps = {
  sessionId: string;
  initialValues: SessionBasicInfoValues;
  expectedUpdatedAt: string;
  onSaved: () => void;
  onCancel: () => void;
  onOptimisticUpdate: (data: SessionBasicInfoValues) => void;
};

export const BasicInfoEditForm = ({
  sessionId,
  initialValues,
  expectedUpdatedAt,
  onSaved,
  onCancel,
  onOptimisticUpdate,
}: BasicInfoEditFormProps) => {
  const [isPending, startTransition] = useTransition();
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
    watch,
  } = useForm<SessionBasicInfoValues>({
    resolver: zodResolver(sessionBasicInfoSchema),
    defaultValues: initialValues,
  });

  const watchedDescription = watch('sessionDescription');

  const onSubmit = (data: SessionBasicInfoValues) => {
    setServerError(null);

    startTransition(async () => {
      onOptimisticUpdate(data);
      try {
        const result = await updateBasicInfoAction(
          sessionId,
          expectedUpdatedAt,
          data,
        );
        if (!result.success) {
          setServerError(
            result.error?.message ?? '基本情報の更新に失敗しました',
          );
        } else {
          onSaved();
        }
      } catch {
        setServerError('基本情報の更新に失敗しました');
      }
    });
  };

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className={styles.basicInfoEdit_form}
    >
      <FormField
        id="sessionName"
        label="セッション名"
        required
        error={errors.sessionName}
      >
        <Input id="sessionName" maxLength={100} {...register('sessionName')} />
      </FormField>

      <FormField
        id="sessionDescription"
        label="募集文"
        required
        error={errors.sessionDescription}
      >
        <Textarea
          id="sessionDescription"
          rows={4}
          maxLength={500}
          {...register('sessionDescription')}
        />
        <span className={styles.basicInfoEdit_charCount}>
          {watchedDescription.length} / 500
        </span>
      </FormField>

      <FormField
        id="maxParticipantCount"
        label="参加上限数"
        error={errors.maxParticipantCount}
        hint="0 = 制限なし"
      >
        <Controller
          name="maxParticipantCount"
          control={control}
          render={({ field }) => (
            <NumberInput
              id="maxParticipantCount"
              value={field.value != null ? String(field.value) : ''}
              onValueChange={(d) => {
                field.onChange(
                  Number.isNaN(d.valueAsNumber) ? 0 : d.valueAsNumber,
                );
              }}
              min={0}
              max={20}
            />
          )}
        />
      </FormField>

      <div className={styles.basicInfoEdit_switchRow}>
        <span>初心者歓迎</span>
        <Controller
          name="isBeginnerFriendly"
          control={control}
          render={({ field }) => (
            <Switch
              checked={field.value}
              onCheckedChange={(d) => field.onChange(d.checked)}
              ariaLabel="初心者歓迎"
            />
          )}
        />
      </div>

      {!isNil(serverError) && (
        <p className={styles.basicInfoEdit_error}>{serverError}</p>
      )}

      <div className={styles.basicInfoEdit_actions}>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          disabled={isPending}
          onClick={onCancel}
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
};

export type { BasicInfoEditFormProps };
