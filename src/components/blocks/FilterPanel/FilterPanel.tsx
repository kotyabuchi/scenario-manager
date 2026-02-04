'use client';

import { useState } from 'react';
import { X } from 'lucide-react';

import { FilterSection } from './FilterSection';
import { DURATION_OPTIONS, type FilterPanelProps } from './interface';
import * as styles from './styles';

import { Slider } from '@/components/elements/slider/slider';

const INITIAL_SHOW_COUNT = 5;

/**
 * フィルターパネルコンポーネント
 * - variant: 'sidebar' (デスクトップ), 'inline' (タブレット), 'bottomsheet' (モバイル)
 * - フィルターの状態管理はuseFilterStateフックで行う
 */
export const FilterPanel = ({
  variant = 'sidebar',
  systems,
  tags,
  filterState,
}: FilterPanelProps) => {
  const {
    params,
    toggleSystem,
    toggleTag,
    setPlayerRange,
    setDuration,
    clearAll,
    activeFilterCount,
  } = filterState;

  // 「すべて表示」の展開状態
  const [expandedSystems, setExpandedSystems] = useState(false);
  const [expandedTags, setExpandedTags] = useState(false);

  // プレイ人数のローカル状態（スライダー操作中のUI更新用）
  const [playerRange, setPlayerRangeLocal] = useState<number[]>([
    params.minPlayer ?? 1,
    params.maxPlayer ?? 10,
  ]);

  // 表示するシステム
  const visibleSystems = expandedSystems
    ? systems
    : systems.slice(0, INITIAL_SHOW_COUNT);

  // 表示するタグ
  const visibleTags = expandedTags ? tags : tags.slice(0, INITIAL_SHOW_COUNT);

  // スライダー変更ハンドラ（UIは即座に更新、APIコールはdebounce）
  const handlePlayerRangeChange = (values: number[]) => {
    setPlayerRangeLocal(values);
    const min = values[0] ?? 1;
    const max = values[1] ?? 10;
    setPlayerRange(min, max);
  };

  return (
    <div className={styles.filterPanel({ variant })}>
      {/* システム選択 */}
      <FilterSection
        label="システム"
        totalCount={systems.length}
        initialShowCount={INITIAL_SHOW_COUNT}
      >
        <div className={styles.chipContainer}>
          {visibleSystems.map((system) => {
            const isSelected = params.systems.includes(system.systemId);
            return (
              <button
                key={system.systemId}
                type="button"
                onClick={() => toggleSystem(system.systemId)}
                className={styles.selectableChip({ selected: isSelected })}
              >
                {system.name}
                {isSelected && (
                  <X size={14} className={styles.chipRemoveIcon} />
                )}
              </button>
            );
          })}
          {systems.length > INITIAL_SHOW_COUNT && (
            <button
              type="button"
              onClick={() => setExpandedSystems(!expandedSystems)}
              className={styles.showAllButton}
            >
              {expandedSystems
                ? '閉じる'
                : `+${systems.length - INITIAL_SHOW_COUNT}`}
            </button>
          )}
        </div>
      </FilterSection>

      {/* タグ選択 */}
      <FilterSection
        label="タグ"
        totalCount={tags.length}
        initialShowCount={INITIAL_SHOW_COUNT}
      >
        <div className={styles.chipContainer}>
          {visibleTags.map((tag) => {
            const isSelected = params.tags.includes(tag.tagId);
            return (
              <button
                key={tag.tagId}
                type="button"
                onClick={() => toggleTag(tag.tagId)}
                className={styles.selectableChip({ selected: isSelected })}
              >
                {tag.name}
                {isSelected && (
                  <X size={14} className={styles.chipRemoveIcon} />
                )}
              </button>
            );
          })}
          {tags.length > INITIAL_SHOW_COUNT && (
            <button
              type="button"
              onClick={() => setExpandedTags(!expandedTags)}
              className={styles.showAllButton}
            >
              {expandedTags ? '閉じる' : `+${tags.length - INITIAL_SHOW_COUNT}`}
            </button>
          )}
        </div>
      </FilterSection>

      {/* プレイ人数 */}
      <FilterSection label="プレイ人数">
        <div className={styles.sliderContainer}>
          <Slider
            value={playerRange}
            onValueChange={(details) => handlePlayerRangeChange(details.value)}
            min={1}
            max={10}
            step={1}
            range
            showValue
            formatValue={(v) => `${v}人`}
            minLabel="1人"
            maxLabel="10人+"
          />
        </div>
      </FilterSection>

      {/* プレイ時間 */}
      <FilterSection label="プレイ時間">
        <div className={styles.durationChips}>
          {DURATION_OPTIONS.map((option) => {
            const isSelected = params.duration === option.value;
            return (
              <button
                key={option.value}
                type="button"
                onClick={() => setDuration(isSelected ? null : option.value)}
                className={styles.selectableChip({ selected: isSelected })}
              >
                {option.label}
              </button>
            );
          })}
        </div>
      </FilterSection>

      {/* クリアボタン（サイドバー・ボトムシートのみ） */}
      {(variant === 'sidebar' || variant === 'bottomsheet') &&
        activeFilterCount > 0 && (
          <button
            type="button"
            onClick={clearAll}
            className={styles.clearButton}
          >
            フィルターをクリア
          </button>
        )}
    </div>
  );
};
