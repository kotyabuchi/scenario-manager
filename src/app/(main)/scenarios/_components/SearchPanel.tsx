'use client';

import { type SubmitHandler, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { isNil } from 'ramda';

import { type SearchFormValues, searchFormSchema } from './schema';
import * as styles from './styles';

import { Button } from '@/components/elements/button/button';
import { css } from '@/styled-system/css';

import type { SearchPanelProps, SearchParams } from '../interface';

const inputStyle = css({
  px: 'sm',
  py: 'xs',
  border: '1px solid',
  borderColor: 'border.500',
  borderRadius: 'sm',
  bg: 'bg.primary',
  color: 'text.primary',
  fontSize: 'sm',
  outline: 'none',
  _focus: {
    borderColor: 'primary.500',
  },
  _placeholder: {
    color: 'text.muted',
  },
});

export const SearchPanel = ({
  systems,
  tags,
  defaultParams,
  onSearch,
}: SearchPanelProps) => {
  const { register, handleSubmit, watch, setValue, reset } = useForm({
    resolver: zodResolver(searchFormSchema),
    defaultValues: {
      systemIds: defaultParams?.systemIds ?? [],
      tagIds: defaultParams?.tagIds ?? [],
      minPlayer: defaultParams?.playerCount?.min,
      maxPlayer: defaultParams?.playerCount?.max,
      minPlaytime: defaultParams?.playtime?.min,
      maxPlaytime: defaultParams?.playtime?.max,
      scenarioName: defaultParams?.scenarioName ?? '',
    },
  });

  const selectedSystemIds = watch('systemIds') as string[];
  const selectedTagIds = watch('tagIds') as string[];

  const toggleSystem = (systemId: string) => {
    const current = selectedSystemIds;
    if (current.includes(systemId)) {
      setValue(
        'systemIds',
        current.filter((id) => id !== systemId),
      );
    } else {
      setValue('systemIds', [...current, systemId]);
    }
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

  const onSubmit: SubmitHandler<SearchFormValues> = (data) => {
    const systemIds = data.systemIds ?? [];
    const tagIds = data.tagIds ?? [];
    const scenarioName = data.scenarioName ?? '';

    const params: SearchParams = {};

    if (systemIds.length > 0) {
      params.systemIds = systemIds;
    }

    if (tagIds.length > 0) {
      params.tagIds = tagIds;
    }

    if (scenarioName.trim() !== '') {
      params.scenarioName = scenarioName.trim();
    }

    if (!isNil(data.minPlayer) || !isNil(data.maxPlayer)) {
      params.playerCount = {
        min: (data.minPlayer as number) ?? 1,
        max: (data.maxPlayer as number) ?? 20,
      };
    }

    if (!isNil(data.minPlaytime) || !isNil(data.maxPlaytime)) {
      params.playtime = {
        min: (data.minPlaytime as number) ?? 1,
        max: (data.maxPlaytime as number) ?? 24,
      };
    }

    onSearch(params);
  };

  const handleReset = () => {
    reset({
      systemIds: [],
      tagIds: [],
      minPlayer: undefined,
      maxPlayer: undefined,
      minPlaytime: undefined,
      maxPlaytime: undefined,
      scenarioName: '',
    });
    onSearch({});
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className={styles.searchPanel}>
      {/* システム選択 */}
      <fieldset className={styles.searchPanelField}>
        <legend className={styles.searchPanelLabel}>システム</legend>
        <div className={styles.searchPanelChips}>
          {systems.map((system) => (
            <button
              key={system.systemId}
              type="button"
              className={styles.chip({
                selected: selectedSystemIds.includes(system.systemId),
              })}
              onClick={() => toggleSystem(system.systemId)}
            >
              {system.name}
              {selectedSystemIds.includes(system.systemId) && (
                <span className={styles.chipRemove}>×</span>
              )}
            </button>
          ))}
        </div>
      </fieldset>

      {/* プレイ人数・時間 */}
      <div className={styles.searchPanelRow}>
        <fieldset className={styles.searchPanelField}>
          <legend className={styles.searchPanelLabel}>プレイ人数</legend>
          <div className={styles.rangeInput}>
            <input
              type="number"
              min={1}
              max={20}
              placeholder="最小"
              className={`${inputStyle} ${styles.rangeInputField}`}
              {...register('minPlayer')}
            />
            <span>〜</span>
            <input
              type="number"
              min={1}
              max={20}
              placeholder="最大"
              className={`${inputStyle} ${styles.rangeInputField}`}
              {...register('maxPlayer')}
            />
            <span>人</span>
          </div>
        </fieldset>

        <fieldset className={styles.searchPanelField}>
          <legend className={styles.searchPanelLabel}>プレイ時間</legend>
          <div className={styles.rangeInput}>
            <input
              type="number"
              min={1}
              max={24}
              placeholder="最小"
              className={`${inputStyle} ${styles.rangeInputField}`}
              {...register('minPlaytime')}
            />
            <span>〜</span>
            <input
              type="number"
              min={1}
              max={24}
              placeholder="最大"
              className={`${inputStyle} ${styles.rangeInputField}`}
              {...register('maxPlaytime')}
            />
            <span>時間</span>
          </div>
        </fieldset>
      </div>

      {/* タグ選択 */}
      <fieldset className={styles.searchPanelField}>
        <legend className={styles.searchPanelLabel}>タグ</legend>
        <div className={styles.searchPanelChips}>
          {tags.map((tag) => (
            <button
              key={tag.tagId}
              type="button"
              className={styles.chip({
                selected: selectedTagIds.includes(tag.tagId),
              })}
              onClick={() => toggleTag(tag.tagId)}
            >
              {tag.name}
              {selectedTagIds.includes(tag.tagId) && (
                <span className={styles.chipRemove}>×</span>
              )}
            </button>
          ))}
        </div>
      </fieldset>

      {/* シナリオ名検索 */}
      <div className={styles.searchPanelField}>
        <label htmlFor="scenarioName" className={styles.searchPanelLabel}>
          シナリオ名
        </label>
        <input
          id="scenarioName"
          type="text"
          placeholder="シナリオ名で検索..."
          className={inputStyle}
          {...register('scenarioName')}
        />
      </div>

      {/* 検索ボタン */}
      <div className={styles.searchActions}>
        <Button type="submit" status="primary">
          検索
        </Button>
        <Button type="button" variant="outline" onClick={handleReset}>
          条件クリア
        </Button>
      </div>
    </form>
  );
};
