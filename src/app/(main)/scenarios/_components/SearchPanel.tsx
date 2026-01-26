'use client';

import { useEffect, useState } from 'react';
import { type SubmitHandler, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { ChevronDown, ChevronUp, Search, X } from 'lucide-react';
import { isNil } from 'ramda';

import { type SearchFormValues, searchFormSchema } from './schema';
import * as styles from './styles';

import { Button } from '@/components/elements/button/button';
import {
  Combobox,
  type ComboboxItem,
  type ComboboxValueChangeDetails,
} from '@/components/elements/combobox/combobox';
import {
  Select,
  type SelectItem,
  type SelectValueChangeDetails,
} from '@/components/elements/select/select';
import { Slider } from '@/components/elements/slider/slider';
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
    (!isNil(defaultParams?.tagIds) && defaultParams.tagIds.length > 0);

  const [isExpanded, setIsExpanded] = useState(hasInitialConditions);

  // プレイ人数・プレイ時間のローカル状態（Slider用）
  const [playerCountRange, setPlayerCountRange] = useState<number[]>([
    defaultParams?.playerCount?.min ?? 2,
    defaultParams?.playerCount?.max ?? 6,
  ]);
  const [playtimeRange, setPlaytimeRange] = useState<number[]>([
    defaultParams?.playtime?.min ?? 30,
    defaultParams?.playtime?.max ?? 180,
  ]);

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

  // defaultParamsが変更されたらフォームとスライダーの状態を同期
  useEffect(() => {
    reset({
      systemIds: defaultParams?.systemIds ?? [],
      tagIds: defaultParams?.tagIds ?? [],
      minPlayer: defaultParams?.playerCount?.min,
      maxPlayer: defaultParams?.playerCount?.max,
      minPlaytime: defaultParams?.playtime?.min,
      maxPlaytime: defaultParams?.playtime?.max,
      scenarioName: defaultParams?.scenarioName ?? '',
    });
    setPlayerCountRange([
      defaultParams?.playerCount?.min ?? 2,
      defaultParams?.playerCount?.max ?? 6,
    ]);
    setPlaytimeRange([
      defaultParams?.playtime?.min ?? 30,
      defaultParams?.playtime?.max ?? 180,
    ]);
    const hasConditions =
      !isNil(defaultParams?.playerCount) ||
      !isNil(defaultParams?.playtime) ||
      (!isNil(defaultParams?.tagIds) && defaultParams.tagIds.length > 0);
    setIsExpanded(hasConditions);
  }, [defaultParams, reset]);

  // システム選択肢をSelectItem形式に変換
  const systemItems: SelectItem[] = systems.map((system) => ({
    label: system.name,
    value: system.systemId,
  }));

  // タグ選択肢をComboboxItem形式に変換
  const tagItems: ComboboxItem[] = tags.map((tag) => ({
    label: tag.name,
    value: tag.tagId,
  }));

  const handleSystemChange = (
    details: SelectValueChangeDetails<SelectItem>,
  ) => {
    setValue('systemIds', details.value);
  };

  const handleTagChange = (
    details: ComboboxValueChangeDetails<ComboboxItem>,
  ) => {
    setValue('tagIds', details.value);
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

    // スライダーの値を使用（デフォルト値と異なる場合のみ）
    const minPlayer = playerCountRange[0] ?? 2;
    const maxPlayer = playerCountRange[1] ?? 6;
    if (minPlayer !== 2 || maxPlayer !== 6) {
      params.playerCount = {
        min: minPlayer,
        max: maxPlayer,
      };
    }

    const minPlaytime = playtimeRange[0] ?? 30;
    const maxPlaytime = playtimeRange[1] ?? 180;
    if (minPlaytime !== 30 || maxPlaytime !== 180) {
      params.playtime = {
        min: minPlaytime,
        max: maxPlaytime,
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
    setPlayerCountRange([2, 6]);
    setPlaytimeRange([30, 180]);
    onSearch({});
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className={styles.searchPanel}>
      {/* メイン検索行: システム選択、シナリオ名、ボタン */}
      <div className={styles.searchPanelMainRow}>
        {/* システム選択 */}
        <div className={styles.searchPanelSystemField}>
          <span className={styles.searchPanelLabel}>システム</span>
          <Select
            items={systemItems}
            value={selectedSystemIds}
            onValueChange={handleSystemChange}
            placeholder="システムを選択..."
            multiple
          />
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
          <button
            type="button"
            onClick={handleReset}
            className={css({
              display: 'flex',
              alignItems: 'center',
              gap: 'xs',
              px: 'md',
              height: '44px',
              fontSize: 'sm',
              fontWeight: 'medium',
              color: '#374151',
              bg: 'white',
              border: 'none',
              borderRadius: 'md',
              cursor: 'pointer',
              boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
              whiteSpace: 'nowrap',
              _hover: {
                bg: '#F9FAFB',
              },
            })}
          >
            <X size={16} color="#6B7280" />
            クリア
          </button>
          <Button type="submit" status="primary">
            <Search size={18} />
            検索
          </Button>
        </div>
      </div>

      {/* 詳細条件（折りたたみ可能） */}
      <div className={styles.detailedConditions({ expanded: isExpanded })}>
        {/* 詳細条件行: プレイ人数、プレイ時間、タグ */}
        <div className={styles.detailedConditionsRow}>
          <div className={styles.sliderField}>
            <Slider
              label="プレイ人数"
              value={playerCountRange}
              onValueChange={(details) => setPlayerCountRange(details.value)}
              min={1}
              max={20}
              step={1}
              range
              showValue
              formatValue={(v) => `${v}人`}
            />
          </div>

          <div className={styles.sliderField}>
            <Slider
              label="プレイ時間"
              value={playtimeRange}
              onValueChange={(details) => setPlaytimeRange(details.value)}
              min={30}
              max={480}
              step={30}
              range
              showValue
              formatValue={(v) => `${v}分`}
            />
          </div>

          <div className={styles.tagField}>
            <span className={styles.searchPanelLabel}>タグ</span>
            <Combobox
              items={tagItems}
              value={selectedTagIds}
              onValueChange={handleTagChange}
              placeholder="タグを追加..."
              multiple
              noResultsText="該当するタグがありません"
            />
          </div>
        </div>
      </div>

      {/* 詳細条件トグル（詳細条件の下に配置） */}
      <div className={styles.expandButtonRow}>
        <button
          type="button"
          onClick={() => setIsExpanded(!isExpanded)}
          className={styles.expandButton({ expanded: isExpanded })}
        >
          {isExpanded ? (
            <>
              <ChevronUp size={10} />
              詳細条件を非表示
            </>
          ) : (
            <>
              <ChevronDown size={10} />
              詳細条件を表示
            </>
          )}
        </button>
      </div>
    </form>
  );
};
