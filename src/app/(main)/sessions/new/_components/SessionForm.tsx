'use client';

import {
  Controller,
  type FieldErrors,
  useForm,
  useWatch,
} from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  CalendarBlank,
  FilmSlate,
  NoteBlank,
  Users,
} from '@phosphor-icons/react/ssr';

import {
  type SessionFormInput,
  type SessionFormValues,
  sessionFormSchema,
} from '../schema';
import * as styles from './styles';

import { Button } from '@/components/elements/button/button';
import { FormField } from '@/components/elements/form-field';
import { Input } from '@/components/elements/input';
import { NumberInput } from '@/components/elements/number-input';
import {
  RadioGroup,
  type RadioGroupItem,
} from '@/components/elements/radio-group';
import { Switch } from '@/components/elements/switch';
import { Textarea } from '@/components/elements/textarea';

const visibilityItems: RadioGroupItem[] = [
  { label: '全体公開', value: 'PUBLIC' },
  { label: 'フォロワーのみ', value: 'FOLLOWERS_ONLY' },
];

const scheduleTypeItems: RadioGroupItem[] = [
  { label: '後で調整', value: 'later' },
  { label: '日時を指定', value: 'specify' },
];

type SessionFormProps = {
  onSubmit?: (data: SessionFormValues) => void;
  defaultValues?: Partial<SessionFormInput>;
  isSubmitting?: boolean;
  errors?: FieldErrors<SessionFormInput>;
};

export const SessionForm = ({
  onSubmit,
  defaultValues,
  isSubmitting = false,
  errors: externalErrors,
}: SessionFormProps) => {
  const {
    register,
    handleSubmit,
    control,
    setValue,
    formState: { errors },
  } = useForm<SessionFormInput>({
    resolver: zodResolver(sessionFormSchema),
    defaultValues: {
      sessionName: defaultValues?.sessionName ?? '',
      sessionDescription: defaultValues?.sessionDescription ?? '',
      scenarioId: defaultValues?.scenarioId ?? null,
      scheduledAt: defaultValues?.scheduledAt ?? null,
      recruitedPlayerCount: defaultValues?.recruitedPlayerCount ?? null,
      tools: defaultValues?.tools ?? null,
      isBeginnerFriendly: defaultValues?.isBeginnerFriendly ?? false,
      visibility: defaultValues?.visibility ?? 'PUBLIC',
      scheduleType: defaultValues?.scheduleType ?? 'later',
    },
  });

  const descriptionValue = useWatch({ name: 'sessionDescription', control });
  const scheduleType = useWatch({ name: 'scheduleType', control });

  const onFormSubmit = (data: SessionFormInput) => {
    const normalizedData: SessionFormValues = {
      sessionName: data.sessionName,
      sessionDescription: data.sessionDescription,
      scenarioId: data.scenarioId || null,
      scheduledAt:
        data.scheduleType === 'later' ? null : data.scheduledAt || null,
      recruitedPlayerCount: data.recruitedPlayerCount ?? null,
      tools: data.tools || null,
      isBeginnerFriendly: data.isBeginnerFriendly ?? false,
      visibility: data.visibility ?? 'PUBLIC',
      scheduleType: data.scheduleType ?? 'later',
    };
    onSubmit?.(normalizedData);
  };

  return (
    <form onSubmit={handleSubmit(onFormSubmit)} className={styles.form}>
      {/* セクション1: 基本情報 */}
      <section className={styles.form_section}>
        <h2 className={styles.form_sectionHeader}>
          <NoteBlank className={styles.form_sectionIcon} />
          基本情報
        </h2>

        <FormField
          id="sessionName"
          label="セッション名"
          required
          error={errors.sessionName ?? externalErrors?.sessionName}
        >
          <Input
            id="sessionName"
            {...register('sessionName')}
            placeholder="例: 週末CoC7版セッション"
            maxLength={100}
          />
        </FormField>

        <div>
          <FormField
            id="sessionDescription"
            label="募集文"
            required
            error={
              errors.sessionDescription ?? externalErrors?.sessionDescription
            }
          >
            <Textarea
              id="sessionDescription"
              {...register('sessionDescription')}
              placeholder="セッションの概要や参加者への呼びかけを書いてください"
              maxLength={500}
            />
          </FormField>
          <p className={styles.form_charCount} aria-live="polite">
            {descriptionValue?.length ?? 0}/500
          </p>
        </div>
      </section>

      <hr className={styles.form_divider} />

      {/* セクション2: 参加者（Batch 2で実装） */}
      <section className={styles.form_section}>
        <h2 className={styles.form_sectionHeader}>
          <Users className={styles.form_sectionIcon} />
          参加者
        </h2>
        {/* Batch 2で実装 */}
      </section>

      <hr className={styles.form_divider} />

      {/* セクション3: シナリオ（Batch 3で実装） */}
      <section className={styles.form_section}>
        <h2 className={styles.form_sectionHeader}>
          <FilmSlate className={styles.form_sectionIcon} />
          シナリオ
        </h2>
        <input type="hidden" {...register('scenarioId')} />
        {/* Batch 3で実装 */}
      </section>

      <hr className={styles.form_divider} />

      {/* セクション4: 日程・その他 */}
      <section className={styles.form_section}>
        <h2 className={styles.form_sectionHeader}>
          <CalendarBlank className={styles.form_sectionIcon} />
          日程・その他
        </h2>

        {/* 開催日時 */}
        <div className={styles.form_scheduleRadio}>
          <FormField label="開催日時">
            <Controller
              name="scheduleType"
              control={control}
              render={({ field }) => (
                <RadioGroup
                  items={scheduleTypeItems}
                  value={field.value ?? 'later'}
                  onValueChange={(d) => {
                    field.onChange(d.value);
                    if (d.value === 'later') {
                      setValue('scheduledAt', null);
                    }
                  }}
                />
              )}
            />
          </FormField>
          {scheduleType === 'specify' && (
            <Input
              type="datetime-local"
              id="scheduledAt"
              aria-label="開催日時"
              {...register('scheduledAt')}
            />
          )}
        </div>

        {/* 使用ツール */}
        <FormField id="tools" label="使用ツール">
          <Input
            id="tools"
            {...register('tools')}
            placeholder="例: Discord + ココフォリア"
            maxLength={200}
          />
        </FormField>

        {/* 追加募集人数 */}
        <FormField label="追加募集人数" error={errors.recruitedPlayerCount}>
          <Controller
            name="recruitedPlayerCount"
            control={control}
            render={({ field }) => (
              <NumberInput
                value={field.value != null ? String(field.value) : ''}
                onValueChange={(d) => {
                  field.onChange(
                    Number.isNaN(d.valueAsNumber) ? null : d.valueAsNumber,
                  );
                }}
                min={0}
                max={10}
              />
            )}
          />
        </FormField>

        {/* 初心者歓迎 */}
        <div className={styles.form_optionCard}>
          <Controller
            name="isBeginnerFriendly"
            control={control}
            render={({ field }) => (
              <Switch
                checked={field.value ?? false}
                onCheckedChange={(d) => field.onChange(d.checked)}
              >
                初心者歓迎
              </Switch>
            )}
          />
        </div>

        {/* 公開範囲 */}
        <FormField label="公開範囲">
          <Controller
            name="visibility"
            control={control}
            render={({ field }) => (
              <RadioGroup
                items={visibilityItems}
                value={field.value ?? 'PUBLIC'}
                onValueChange={(d) => field.onChange(d.value)}
              />
            )}
          />
        </FormField>
      </section>

      {/* 送信ボタン */}
      <div className={styles.form_submitArea}>
        <Button
          type="submit"
          status="primary"
          disabled={isSubmitting}
          loading={isSubmitting}
          loadingText="作成中..."
        >
          セッションを作成
        </Button>
      </div>
    </form>
  );
};
