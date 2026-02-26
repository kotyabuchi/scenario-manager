import { Controller, useFormContext, useWatch } from 'react-hook-form';
import { DotsThreeOutline, Wrench } from '@phosphor-icons/react/ssr';

import * as styles from '../../styles';

import { FormField } from '@/components/elements/form-field';
import { Input } from '@/components/elements/input';
import { NumberInput } from '@/components/elements/number-input';
import { Switch } from '@/components/elements/switch';

import type { SessionFormInput } from '../../../schema';

export const OtherSection = () => {
  const {
    control,
    register,
    setValue,
    formState: { errors },
  } = useFormContext<SessionFormInput>();
  const scheduleType = useWatch({ name: 'scheduleType', control });

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
              hint="日時を1つ指定できます。後で日程調整する場合はオフのままにしてください"
            >
              <Input
                type="datetime-local"
                id="scheduledAt"
                aria-label="開催日時"
                {...register('scheduledAt')}
              />
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
