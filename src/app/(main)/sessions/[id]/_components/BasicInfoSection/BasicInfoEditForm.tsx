'use client';

import { useState, useTransition } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { MagnifyingGlass, Trash } from '@phosphor-icons/react/ssr';
import { isNil } from 'ramda';

import { updateBasicInfoAction } from '../../actions';
import {
  type SessionBasicInfoValues,
  sessionBasicInfoSchema,
} from '../../schema';
import * as styles from '../../styles';

import { ScenarioSearchModal } from '@/app/(main)/sessions/new/_components/ScenarioSelectSection/ScenarioSearchModal';
import { Button } from '@/components/elements/button/button';
import { FormField } from '@/components/elements/form-field/form-field';
import { Input } from '@/components/elements/input';
import { NumberInput } from '@/components/elements/number-input';
import { Switch } from '@/components/elements/switch';
import { Textarea } from '@/components/elements/textarea/textarea';

import type { ScenarioSummary } from '@/app/(main)/sessions/new/interface';
import type { ScenarioSystem, SessionDetail } from '../../../interface';

type BasicInfoEditFormProps = {
  sessionId: string;
  initialValues: SessionBasicInfoValues;
  expectedUpdatedAt: string;
  onSaved: () => void;
  onCancel: () => void;
  onOptimisticUpdate: (data: SessionBasicInfoValues) => void;
  /** 現在のシナリオ情報 */
  scenario?: SessionDetail['scenario'];
  /** シナリオ変更可能な場合にシステム一覧を渡す */
  systems?: ScenarioSystem[] | undefined;
};

export const BasicInfoEditForm = ({
  sessionId,
  initialValues,
  expectedUpdatedAt,
  onSaved,
  onCancel,
  onOptimisticUpdate,
  scenario,
  systems,
}: BasicInfoEditFormProps) => {
  const [isPending, startTransition] = useTransition();
  const [serverError, setServerError] = useState<string | null>(null);
  const [isScenarioModalOpen, setIsScenarioModalOpen] = useState(false);
  /** 表示用のシナリオ名（RHF外で管理。名前はフォーム値ではない） */
  const [displayScenarioName, setDisplayScenarioName] = useState(
    scenario?.name ?? 'シナリオ未設定',
  );

  const canEditScenario = !isNil(systems);

  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
    watch,
    setValue,
  } = useForm<SessionBasicInfoValues>({
    resolver: zodResolver(sessionBasicInfoSchema),
    defaultValues: initialValues,
  });

  const watchedScenarioId = watch('scenarioId');

  const handleScenarioSelect = (selected: ScenarioSummary) => {
    setValue('scenarioId', selected.scenarioId, { shouldDirty: true });
    setDisplayScenarioName(selected.name);
    setIsScenarioModalOpen(false);
  };

  const handleScenarioRemove = () => {
    setValue('scenarioId', null, { shouldDirty: true });
    setDisplayScenarioName('シナリオ未設定');
  };

  const handleCancel = () => {
    setDisplayScenarioName(scenario?.name ?? 'シナリオ未設定');
    onCancel();
  };

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
      {/* シナリオ変更 */}
      {canEditScenario && (
        <div className={styles.basicInfoEdit_scenarioField}>
          <p className={styles.info_scenarioLabel}>シナリオ</p>
          <div className={styles.basicInfoEdit_scenarioValue}>
            <p className={styles.info_valueText}>{displayScenarioName}</p>
            <div className={styles.basicInfoEdit_scenarioActions}>
              <Button
                type="button"
                size="sm"
                variant="ghost"
                status="primary"
                prefix={<MagnifyingGlass size={14} />}
                onClick={() => setIsScenarioModalOpen(true)}
                aria-label="シナリオを変更"
              >
                変更
              </Button>
              {!isNil(watchedScenarioId) && (
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  status="danger"
                  prefix={<Trash size={14} />}
                  onClick={handleScenarioRemove}
                  aria-label="シナリオを解除"
                >
                  解除
                </Button>
              )}
            </div>
          </div>
        </div>
      )}

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
        <div className={styles.basicInfoEdit_narrowNumber}>
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
        </div>
      </FormField>

      <div className={styles.basicInfoEdit_switchRow}>
        <Controller
          name="isBeginnerFriendly"
          control={control}
          render={({ field }) => (
            <Switch
              checked={field.value}
              onCheckedChange={(d) => field.onChange(d.checked)}
            >
              初心者歓迎
            </Switch>
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
          onClick={handleCancel}
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
      {/* シナリオ検索モーダル */}
      {canEditScenario && (
        <ScenarioSearchModal
          open={isScenarioModalOpen}
          onOpenChange={({ open }) => setIsScenarioModalOpen(open)}
          onSelect={handleScenarioSelect}
          systems={systems}
          invitedMembers={[]}
        />
      )}
    </form>
  );
};

export type { BasicInfoEditFormProps };
