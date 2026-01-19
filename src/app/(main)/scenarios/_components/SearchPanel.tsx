'use client';

import { useState } from 'react';
import { type SubmitHandler, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { isNil } from 'ramda';

import { type SearchFormValues, searchFormSchema } from './schema';
import * as styles from './styles';

import { FieldError } from '@/components/elements';
import { Button } from '@/components/elements/button/button';
import { Chip } from '@/components/elements/Chip';
import { css } from '@/styled-system/css';

import type { SearchPanelProps, SearchParams } from '../interface';

// 入力フィールドのスタイル（ボーダーレス、背景色で区別）
const inputStyle = css({
  px: 'md',
  py: 'sm',
  border: 'none',
  borderRadius: 'md',
  bg: 'bg.muted',
  color: 'text.primary',
  fontSize: 'sm',
  outline: 'none',
  transition: 'all 0.2s',
  shadow: 'sm',
  _hover: {
    bg: 'bg.emphasized',
  },
  _focus: {
    bg: 'bg.emphasized',
    shadow: '0 0 0 2px {colors.primary.focusRing}',
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
  // 初期状態：条件が1つでも設定されている場合は展開
  const hasInitialConditions =
    !isNil(defaultParams?.playerCount) ||
    !isNil(defaultParams?.playtime) ||
    (!isNil(defaultParams?.tagIds) && defaultParams.tagIds.length > 0) ||
    (!isNil(defaultParams?.scenarioName) && defaultParams.scenarioName !== '');

  const [isExpanded, setIsExpanded] = useState(hasInitialConditions);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors },
  } = useForm({
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
      {/* システム選択（常に表示） */}
      <fieldset className={styles.searchPanelField}>
        <legend className={styles.searchPanelLabel}>システム</legend>
        <div className={styles.searchPanelChips}>
          {systems.map((system) => (
            <Chip
              key={system.systemId}
              label={system.name}
              selected={selectedSystemIds.includes(system.systemId)}
              onClick={() => toggleSystem(system.systemId)}
            />
          ))}
        </div>
      </fieldset>

      {/* プレイ人数・時間（折りたたみ可能） */}
      <div className={styles.detailedConditions({ expanded: isExpanded })}>
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
            <FieldError error={errors.minPlayer} />
            <FieldError error={errors.maxPlayer} />
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
            <FieldError error={errors.minPlaytime} />
            <FieldError error={errors.maxPlaytime} />
          </fieldset>
        </div>

        {/* タグ選択 */}
        <fieldset className={styles.searchPanelField}>
          <legend className={styles.searchPanelLabel}>タグ</legend>
          <div className={styles.searchPanelChips}>
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
      </div>

      {/* 詳細条件の展開/折りたたみボタン */}
      <button
        type="button"
        onClick={() => setIsExpanded(!isExpanded)}
        className={styles.expandButton}
      >
        {isExpanded ? (
          <>
            詳細条件を閉じる <ChevronUp size={16} />
          </>
        ) : (
          <>
            詳細条件を開く <ChevronDown size={16} />
          </>
        )}
      </button>

      {/* 検索ボタン */}
      <hr className={styles.searchDivider} />
      <div className={styles.searchActions}>
        <Button type="submit" status="primary">
          検索
        </Button>
        <Button type="button" variant="ghost" onClick={handleReset}>
          条件クリア
        </Button>
      </div>
    </form>
  );
};
