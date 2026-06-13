import { useEffect, useRef } from 'react';
import {
  Controller,
  useFieldArray,
  useFormContext,
  useWatch,
} from 'react-hook-form';
import { DotsThreeOutline, Wrench, XIcon } from '@phosphor-icons/react/ssr';

import * as styles from './styles';

import { FormField } from '@/components/elements/form-field';
import { IconButton } from '@/components/elements/icon-button/icon-button';
import { Input } from '@/components/elements/input';
import { NumberInput } from '@/components/elements/number-input';
import { Switch } from '@/components/elements/switch';

import type { SessionFormInput } from '../schema';

export const OtherSection = () => {
  const {
    control,
    register,
    setValue,
    formState: { errors },
  } = useFormContext<SessionFormInput>();
  const scheduleType = useWatch({ name: 'scheduleType', control });
  const scheduleCandidates = useWatch({
    name: 'scheduleCandidates',
    control,
  });
  const { fields, append, remove, replace } = useFieldArray({
    control,
    name: 'scheduleCandidates',
  });
  const lastAppendKeyRef = useRef<string | null>(null);

  useEffect(() => {
    if (scheduleType !== 'specify') {
      if (fields.length > 0) {
        replace([]);
      }
      lastAppendKeyRef.current = null;
      return;
    }
    if (fields.length === 0) {
      append({ from: '', to: '' }, { shouldFocus: false });
    }
  }, [append, fields.length, replace, scheduleType]);

  useEffect(() => {
    if (scheduleType !== 'specify' || fields.length === 0) return;

    const current = scheduleCandidates ?? [];
    const last = current[current.length - 1] ?? { from: '', to: '' };
    const secondLast = current[current.length - 2] ?? { from: '', to: '' };
    const lastComplete = last.from.trim() !== '';
    const lastEmpty = last.from.trim() === '' && (last.to?.trim() ?? '') === '';
    const secondLastEmpty =
      secondLast.from.trim() === '' && (secondLast.to?.trim() ?? '') === '';

    const appendKey = `${current.length}:${last.from}:${last.to ?? ''}`;
    if (lastComplete && lastAppendKeyRef.current !== appendKey) {
      lastAppendKeyRef.current = appendKey;
      append({ from: '', to: '' }, { shouldFocus: false });
      return;
    }
    if (!lastComplete) {
      lastAppendKeyRef.current = null;
    }
    if (current.length > 1 && lastEmpty && secondLastEmpty) {
      remove(current.length - 1);
    }
  }, [append, fields.length, remove, scheduleCandidates, scheduleType]);

  return (
    <section className={styles.form_section}>
      <h2 className={styles.form_sectionHeader}>
        <DotsThreeOutline className={styles.form_sectionIcon} />
        その他
      </h2>

      <div className={styles.form_miscGrid}>
        {/* 開催日時 */}
        <div className={styles.form_miscSpan}>
          <div className={styles.form_optionRow}>
            <div className={styles.form_optionText}>
              <div className={styles.form_optionTitle}>
                <span>開催日時</span>
              </div>
              <p className={styles.form_optionDescription}>
                日時を指定する場合はオンにしてください
              </p>
            </div>
            <Controller
              name="scheduleType"
              control={control}
              render={({ field }) => (
                <Switch
                  checked={field.value === 'specify'}
                  onCheckedChange={(d) => {
                    const nextType = d.checked ? 'specify' : 'later';
                    field.onChange(nextType);
                    if (!d.checked) {
                      setValue('scheduledAt', null);
                      replace([]);
                      return;
                    }
                    const current = scheduleCandidates ?? [];
                    if (current.length === 0) {
                      replace([{ from: '', to: '' }]);
                    }
                  }}
                  ariaLabel="開催日時を指定"
                />
              )}
            />
          </div>
          {scheduleType === 'specify' && (
            <FormField
              label="日時の入力"
              hint="複数行で入力できます。終了時刻は必要な行だけ入力してください"
            >
              <div className={styles.form_scheduleList}>
                {fields.map((field, index) => {
                  const value = scheduleCandidates?.[index] ?? {
                    from: '',
                    to: '',
                  };
                  const hasValue = value.from.trim() !== '';
                  return (
                    <div
                      key={field.id}
                      className={styles.form_scheduleRow}
                      data-has-value={hasValue}
                    >
                      <div className={styles.form_scheduleRange}>
                        <Input
                          type="datetime-local"
                          id={`scheduledFrom-${index + 1}`}
                          aria-label={`開催開始日時 ${index + 1}`}
                          {...register(
                            `scheduleCandidates.${index}.from` as const,
                          )}
                          className={styles.form_scheduleInput}
                        />
                        <span className={styles.form_scheduleRangeSeparator}>
                          〜
                        </span>
                        <Input
                          type="datetime-local"
                          id={`scheduledTo-${index + 1}`}
                          aria-label={`開催終了日時 ${index + 1}`}
                          {...register(
                            `scheduleCandidates.${index}.to` as const,
                          )}
                          className={styles.form_scheduleInput}
                        />
                      </div>
                      <span className={styles.form_scheduleRemoveWrap}>
                        <IconButton
                          type="button"
                          variant="ghost"
                          status="danger"
                          size="sm"
                          className={styles.form_scheduleRemoveButton}
                          aria-label="日時を削除"
                          onClick={() => remove(index)}
                          disabled={!hasValue}
                        >
                          <XIcon />
                        </IconButton>
                      </span>
                    </div>
                  );
                })}
              </div>
            </FormField>
          )}
        </div>

        {/* 使用ツール */}
        <FormField id="tools" label="使用ツール">
          <Input
            id="tools"
            {...register('tools')}
            placeholder="例: Discord + ココフォリア"
            maxLength={200}
            prefix={<Wrench />}
          />
        </FormField>

        {/* 追加募集人数 */}
        <div>
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
          <p className={styles.form_helperText}>
            ※ 0人の場合、募集は開始されません
          </p>
        </div>
      </div>

      <div className={styles.form_optionCard}>
        {/* 初心者歓迎 */}
        <div className={styles.form_optionRow}>
          <div className={styles.form_optionText}>
            <div className={styles.form_optionTitle}>
              <span>初心者歓迎</span>
              <span className={styles.form_optionBadge}>おすすめ</span>
            </div>
            <p className={styles.form_optionDescription}>
              TRPGに不慣れな方の参加も歓迎します
            </p>
          </div>
          <Controller
            name="isBeginnerFriendly"
            control={control}
            render={({ field }) => (
              <Switch
                checked={field.value ?? false}
                onCheckedChange={(d) => field.onChange(d.checked)}
                ariaLabel="初心者歓迎"
              />
            )}
          />
        </div>

        <div className={styles.form_optionDivider} />

        {/* 公開範囲 */}
        <div className={styles.form_optionRow}>
          <div className={styles.form_optionText}>
            <div className={styles.form_optionTitle}>
              <span>フォロワー限定公開</span>
            </div>
            <p className={styles.form_optionDescription}>
              フォロワー限定に切り替えると非フォロワーには表示されません
            </p>
          </div>
          <Controller
            name="visibility"
            control={control}
            render={({ field }) => (
              <Switch
                checked={field.value === 'FOLLOWERS_ONLY'}
                onCheckedChange={(d) =>
                  field.onChange(d.checked ? 'FOLLOWERS_ONLY' : 'PUBLIC')
                }
                ariaLabel="フォロワー限定公開"
              />
            )}
          />
        </div>
      </div>
    </section>
  );
};
