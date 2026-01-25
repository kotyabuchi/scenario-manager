'use client';

import { useState } from 'react';
import { type SubmitHandler, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { ChevronDown, ChevronUp, Search, X } from 'lucide-react';
import { isNil } from 'ramda';

import { type SearchFormValues, searchFormSchema } from './schema';
import * as styles from './styles';

import { FieldError } from '@/components/elements';
import { Button } from '@/components/elements/button/button';
import { Chip } from '@/components/elements/Chip';
import { css } from '@/styled-system/css';

import type { SearchPanelProps, SearchParams } from '../interface';

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
        max: (data.maxPlaytime as number) ?? 240,
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

  // 選択されたシステムの名前を取得
  const getSystemName = (systemId: string) => {
    const system = systems.find((s) => s.systemId === systemId);
    return system?.name ?? systemId;
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className={styles.searchPanel}>
      {/* メイン検索行: システム選択、シナリオ名、ボタン */}
      <div className={styles.searchPanelMainRow}>
        {/* システム選択 */}
        <div className={styles.searchPanelSystemField}>
          <span className={styles.searchPanelLabel}>システム</span>
          <div className={styles.systemSelectContainer}>
            {selectedSystemIds.length > 0 ? (
              selectedSystemIds.map((systemId) => (
                <span key={systemId} className={styles.systemTag}>
                  {getSystemName(systemId)}
                  <X
                    size={12}
                    className={styles.systemTagRemove}
                    onClick={() => toggleSystem(systemId)}
                  />
                </span>
              ))
            ) : (
              <span
                className={css({
                  color: 'oklch(0.60 0.02 150)',
                  fontSize: 'sm',
                })}
              >
                システムを選択...
              </span>
            )}
          </div>
        </div>

        {/* シナリオ名 */}
        <div className={styles.searchPanelNameField}>
          <label htmlFor="scenarioName" className={styles.searchPanelLabel}>
            シナリオ名
          </label>
          <input
            id="scenarioName"
            type="text"
            placeholder="シナリオ名で検索..."
            className={styles.searchInput}
            {...register('scenarioName')}
          />
        </div>

        {/* ボタングループ */}
        <div className={styles.searchPanelButtons}>
          <Button type="button" variant="subtle" onClick={handleReset}>
            <X size={16} />
            クリア
          </Button>
          <Button type="submit" status="primary">
            <Search size={16} />
            検索
          </Button>
        </div>
      </div>

      {/* 詳細条件トグル */}
      <div className={styles.expandButtonRow}>
        <button
          type="button"
          onClick={() => setIsExpanded(!isExpanded)}
          className={styles.expandButton}
        >
          {isExpanded ? (
            <>
              <ChevronUp size={14} />
              詳細条件を閉じる
            </>
          ) : (
            <>
              <ChevronDown size={14} />
              詳細条件を開く
            </>
          )}
        </button>
      </div>

      {/* 詳細条件（折りたたみ可能） */}
      <div className={styles.detailedConditions({ expanded: isExpanded })}>
        <hr className={styles.searchDivider} />

        {/* システムチップ選択 */}
        <fieldset className={styles.searchPanelField}>
          <legend className={styles.searchPanelLabel}>
            システム（複数選択可）
          </legend>
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
                className={`${styles.searchInput} ${styles.rangeInputField}`}
                {...register('minPlayer')}
              />
              <span>〜</span>
              <input
                type="number"
                min={1}
                max={20}
                placeholder="最大"
                className={`${styles.searchInput} ${styles.rangeInputField}`}
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
                max={240}
                placeholder="最小"
                className={`${styles.searchInput} ${styles.rangeInputField}`}
                {...register('minPlaytime')}
              />
              <span>〜</span>
              <input
                type="number"
                min={1}
                max={240}
                placeholder="最大"
                className={`${styles.searchInput} ${styles.rangeInputField}`}
                {...register('maxPlaytime')}
              />
              <span>分</span>
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
      </div>
    </form>
  );
};
