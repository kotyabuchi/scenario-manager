'use client';

import { useState, useTransition } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'next/navigation';
import { isNil } from 'ramda';

import { createScenarioAction } from '../actions';
import {
  type ScenarioFormInput,
  type ScenarioFormValues,
  scenarioFormSchema,
} from './schema';
import * as styles from './styles';

import { FieldError } from '@/components/elements';
import { Button } from '@/components/elements/button/button';
import { Chip } from '@/components/elements/Chip';
import { HandoutTypes } from '@/db/enum';

import type { ScenarioSystem, Tag } from '../../interface';

type ScenarioFormProps = {
  systems: ScenarioSystem[];
  tags: Tag[];
};

export const ScenarioForm = ({ systems, tags }: ScenarioFormProps) => {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<ScenarioFormInput, unknown, ScenarioFormValues>({
    resolver: zodResolver(scenarioFormSchema),
    defaultValues: {
      name: '',
      scenarioSystemId: '',
      handoutType: HandoutTypes.NONE.value,
      author: '',
      description: '',
      minPlayer: undefined,
      maxPlayer: undefined,
      minPlaytime: undefined,
      maxPlaytime: undefined,
      scenarioImageUrl: '',
      distributeUrl: '',
      tagIds: [],
    },
  });

  const selectedSystemId = watch('scenarioSystemId');
  const selectedTagIds = watch('tagIds') as string[];
  const selectedHandoutType = watch('handoutType');

  const handleSystemSelect = (systemId: string) => {
    setValue('scenarioSystemId', systemId);
  };

  const toggleTag = (tagId: string) => {
    const current = selectedTagIds;
    if (current.includes(tagId)) {
      setValue(
        'tagIds',
        current.filter((id) => id !== tagId),
      );
    } else {
      setValue('tagIds', [...current, tagId]);
    }
  };

  const onSubmit = (data: ScenarioFormValues) => {
    setServerError(null);

    startTransition(async () => {
      const result = await createScenarioAction(data);

      if (!result.success) {
        setServerError(result.error?.message ?? '登録に失敗しました');
      } else {
        router.push(`/scenarios/${result.data.scenarioId}`);
      }
    });
  };

  const handleCancel = () => {
    router.back();
  };

  return (
    <div className={styles.form_container}>
      {!isNil(serverError) && (
        <div className={styles.form_error}>{serverError}</div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className={styles.form_form}>
        {/* 基本情報セクション */}
        <div className={styles.form_section}>
          <h2 className={styles.form_sectionTitle}>基本情報</h2>

          {/* シナリオ名 */}
          <div className={styles.form_field}>
            <label htmlFor="name" className={styles.form_label}>
              シナリオ名
              <span className={styles.form_required}>*</span>
            </label>
            <input
              type="text"
              id="name"
              {...register('name')}
              className={styles.form_input}
              placeholder="シナリオ名を入力"
              maxLength={100}
            />
            <FieldError error={errors.name} />
          </div>

          {/* システム選択 */}
          <fieldset className={styles.form_field}>
            <legend className={styles.form_label}>
              システム
              <span className={styles.form_required}>*</span>
            </legend>
            <div className={styles.form_chips}>
              {systems.map((system) => (
                <Chip
                  key={system.systemId}
                  label={system.name}
                  selected={selectedSystemId === system.systemId}
                  onClick={() => handleSystemSelect(system.systemId)}
                />
              ))}
            </div>
            <FieldError error={errors.scenarioSystemId} />
          </fieldset>

          {/* ハンドアウト形式 */}
          <fieldset className={styles.form_field}>
            <legend className={styles.form_label}>
              ハンドアウト形式
              <span className={styles.form_required}>*</span>
            </legend>
            <div className={styles.form_radioGroup}>
              {Object.values(HandoutTypes).map((type) => (
                <label
                  key={type.value}
                  className={
                    selectedHandoutType === type.value
                      ? styles.form_radioLabelSelected
                      : styles.form_radioLabel
                  }
                >
                  <input
                    type="radio"
                    {...register('handoutType')}
                    value={type.value}
                    className={styles.form_radioInput}
                  />
                  {type.label}
                </label>
              ))}
            </div>
            <FieldError error={errors.handoutType} />
          </fieldset>
        </div>

        <hr className={styles.form_divider} />

        {/* 詳細情報セクション */}
        <div className={styles.form_section}>
          <h2 className={styles.form_sectionTitle}>詳細情報（任意）</h2>

          {/* 作者名 */}
          <div className={styles.form_field}>
            <label htmlFor="author" className={styles.form_label}>
              作者名
            </label>
            <input
              type="text"
              id="author"
              {...register('author')}
              className={styles.form_input}
              placeholder="作者名を入力"
              maxLength={100}
            />
            <FieldError error={errors.author} />
          </div>

          {/* 概要 */}
          <div className={styles.form_field}>
            <label htmlFor="description" className={styles.form_label}>
              概要
            </label>
            <textarea
              id="description"
              {...register('description')}
              className={styles.form_textarea}
              placeholder="シナリオの概要を入力"
              maxLength={2000}
            />
            <p className={styles.form_hint}>2000文字以内</p>
            <FieldError error={errors.description} />
          </div>

          {/* プレイ人数 */}
          <div className={styles.form_field}>
            <span className={styles.form_label}>プレイ人数</span>
            <div className={styles.form_rangeInput}>
              <input
                type="number"
                min={1}
                max={20}
                placeholder="最小"
                className={`${styles.form_input} ${styles.form_rangeInputField}`}
                {...register('minPlayer')}
              />
              <span>〜</span>
              <input
                type="number"
                min={1}
                max={20}
                placeholder="最大"
                className={`${styles.form_input} ${styles.form_rangeInputField}`}
                {...register('maxPlayer')}
              />
              <span>人</span>
            </div>
            <FieldError error={errors.minPlayer} />
            <FieldError error={errors.maxPlayer} />
          </div>

          {/* プレイ時間 */}
          <div className={styles.form_field}>
            <span className={styles.form_label}>プレイ時間</span>
            <div className={styles.form_rangeInput}>
              <input
                type="number"
                min={1}
                max={14400}
                placeholder="最小"
                className={`${styles.form_input} ${styles.form_rangeInputField}`}
                {...register('minPlaytime')}
              />
              <span>〜</span>
              <input
                type="number"
                min={1}
                max={14400}
                placeholder="最大"
                className={`${styles.form_input} ${styles.form_rangeInputField}`}
                {...register('maxPlaytime')}
              />
              <span>分</span>
            </div>
            <FieldError error={errors.minPlaytime} />
            <FieldError error={errors.maxPlaytime} />
          </div>

          {/* タグ選択 */}
          <fieldset className={styles.form_field}>
            <legend className={styles.form_label}>タグ</legend>
            <div className={styles.form_chips}>
              {tags.map((tag) => (
                <Chip
                  key={tag.tagId}
                  label={tag.name}
                  selected={selectedTagIds.includes(tag.tagId)}
                  onClick={() => toggleTag(tag.tagId)}
                />
              ))}
            </div>
          </fieldset>

          {/* サムネイルURL */}
          <div className={styles.form_field}>
            <label htmlFor="scenarioImageUrl" className={styles.form_label}>
              サムネイルURL
            </label>
            <input
              type="url"
              id="scenarioImageUrl"
              {...register('scenarioImageUrl')}
              className={styles.form_input}
              placeholder="https://example.com/image.jpg"
            />
            <FieldError error={errors.scenarioImageUrl} />
          </div>

          {/* 配布URL */}
          <div className={styles.form_field}>
            <label htmlFor="distributeUrl" className={styles.form_label}>
              配布URL
            </label>
            <input
              type="url"
              id="distributeUrl"
              {...register('distributeUrl')}
              className={styles.form_input}
              placeholder="https://booth.pm/ja/items/..."
            />
            <FieldError error={errors.distributeUrl} />
          </div>
        </div>

        {/* アクションボタン */}
        <hr className={styles.form_divider} />
        <div className={styles.form_actions}>
          <Button type="button" variant="ghost" onClick={handleCancel}>
            キャンセル
          </Button>
          <Button
            type="submit"
            status="primary"
            disabled={isPending}
            loading={isPending}
            loadingText="登録中..."
          >
            登録する
          </Button>
        </div>
      </form>
    </div>
  );
};
