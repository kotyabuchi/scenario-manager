'use client';

import { useState } from 'react';
import { X } from '@phosphor-icons/react/ssr';

import { FilterSection } from './FilterSection';
import * as styles from './styles';

import { Slider } from '@/components/elements/slider/slider';

import type { FilterPanelProps } from './interface';

const INITIAL_SHOW_COUNT = 5;

// スライダーの範囲定数
const PLAYER_MIN = 1;
const PLAYER_MAX = 10;
const PLAYTIME_MIN = 1;
const PLAYTIME_MAX = 20;

/**
 * フィルターパネルコンポーネント
 * - variant: 'sidebar' (デスクトップ), 'bottomsheet' (モバイル)
 * - フィルターの状態管理はuseFilterState / useFilterDraftフックで行う
 */
export const FilterPanel = ({
  variant = 'sidebar',
  systems,
  tags,
  filterState,
  showSystems = true,
}: FilterPanelProps) => {
  const {
    params,
    toggleSystem,
    toggleTag,
    setPlayerRange,
    setPlaytimeRange,
    clearAll,
    activeFilterCount,
  } = filterState;

  // 「すべて表示」の展開状態
  const [expandedSystems, setExpandedSystems] = useState(false);
  const [expandedTags, setExpandedTags] = useState(false);

  // プレイ人数のローカル状態（スライダー操作中のUI更新用）
  const [playerRange, setPlayerRangeLocal] = useState<number[]>([
    params.minPlayer ?? PLAYER_MIN,
    params.maxPlayer ?? PLAYER_MAX,
  ]);

  // プレイ時間のローカル状態（スライダー操作中のUI更新用）
  const [playtimeRange, setPlaytimeRangeLocal] = useState<number[]>([
    params.minPlaytime ?? PLAYTIME_MIN,
    params.maxPlaytime ?? PLAYTIME_MAX,
  ]);

  // 表示するシステム
  const visibleSystems = expandedSystems
    ? systems
    : systems.slice(0, INITIAL_SHOW_COUNT);

  // 表示するタグ
  const visibleTags = expandedTags ? tags : tags.slice(0, INITIAL_SHOW_COUNT);

  // スライダー変更ハンドラ（UIは即座に更新、APIコールはdebounce）
  // 端の値（min/max）は null を送り「制限なし」を表す
  const handlePlayerRangeChange = (values: number[]) => {
    setPlayerRangeLocal(values);
    const min = values[0] ?? PLAYER_MIN;
    const max = values[1] ?? PLAYER_MAX;
    setPlayerRange(
      min === PLAYER_MIN ? null : min,
      max === PLAYER_MAX ? null : max,
    );
  };

  const handlePlaytimeRangeChange = (values: number[]) => {
    setPlaytimeRangeLocal(values);
    const min = values[0] ?? PLAYTIME_MIN;
    const max = values[1] ?? PLAYTIME_MAX;
    setPlaytimeRange(
      min === PLAYTIME_MIN ? null : min,
      max === PLAYTIME_MAX ? null : max,
    );
  };

  return (
    <div className={styles.filterPanel({ variant })}>
      {/* システム選択 */}
      {showSystems && (
        <FilterSection label="システム">
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
      )}

      {/* タグ選択 */}
      <FilterSection label="タグ">
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
            aria-label="プレイ人数"
            value={playerRange}
            onValueChange={(details) => handlePlayerRangeChange(details.value)}
            min={PLAYER_MIN}
            max={PLAYER_MAX}
            step={1}
            range
            showValue
            formatValue={(v) => (v === PLAYER_MAX ? `${v}人+` : `${v}人`)}
            minLabel={`${PLAYER_MIN}人`}
            maxLabel={`${PLAYER_MAX}人+`}
          />
        </div>
      </FilterSection>

      {/* プレイ時間 */}
      <FilterSection label="プレイ時間">
        <div className={styles.sliderContainer}>
          <Slider
            aria-label="プレイ時間"
            value={playtimeRange}
            onValueChange={(details) =>
              handlePlaytimeRangeChange(details.value)
            }
            min={PLAYTIME_MIN}
            max={PLAYTIME_MAX}
            step={1}
            range
            showValue
            formatValue={(v) => (v === PLAYTIME_MAX ? `${v}h+` : `${v}h`)}
            minLabel={`${PLAYTIME_MIN}h`}
            maxLabel={`${PLAYTIME_MAX}h+`}
          />
        </div>
      </FilterSection>

      {/* クリアボタン（bottomsheetは3ボタンフッターと重複するため非表示） */}
      {variant !== 'bottomsheet' && activeFilterCount > 0 && (
        <button type="button" onClick={clearAll} className={styles.clearButton}>
          フィルターをクリア
        </button>
      )}
    </div>
  );
};
