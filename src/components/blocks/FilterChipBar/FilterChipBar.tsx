'use client';

import { ChevronDown, X } from 'lucide-react';

import * as styles from './styles';

import type {
  FilterStateBase,
  SystemItem,
  TagItem,
} from '@/components/blocks/FilterPanel';

type FilterChipBarProps = {
  /** 利用可能なシステム一覧 */
  systems: SystemItem[];
  /** 利用可能なタグ一覧 */
  tags: TagItem[];
  /** フィルター状態 */
  filterState: FilterStateBase;
  /** ドロップダウンを開くコールバック */
  onOpenDropdown?: (type: 'system' | 'tag' | 'player' | 'time') => void;
};

/**
 * タブレット用フィルターチップバー
 * ドロップダウントリガーと選択済みチップを横並びで表示
 */
export const FilterChipBar = ({
  systems,
  tags,
  filterState,
  onOpenDropdown,
}: FilterChipBarProps) => {
  const { params, toggleSystem, toggleTag } = filterState;

  return (
    <div className={styles.container}>
      {/* システムドロップダウン */}
      <button
        type="button"
        onClick={() => onOpenDropdown?.('system')}
        className={styles.dropdownTrigger}
      >
        システム
        <ChevronDown size={14} />
      </button>

      {/* タグドロップダウン */}
      <button
        type="button"
        onClick={() => onOpenDropdown?.('tag')}
        className={styles.dropdownTrigger}
      >
        タグ
        <ChevronDown size={14} />
      </button>

      {/* プレイ人数ドロップダウン */}
      <button
        type="button"
        onClick={() => onOpenDropdown?.('player')}
        className={styles.dropdownTrigger}
      >
        プレイ人数
        <ChevronDown size={14} />
      </button>

      {/* プレイ時間ドロップダウン */}
      <button
        type="button"
        onClick={() => onOpenDropdown?.('time')}
        className={styles.dropdownTrigger}
      >
        プレイ時間
        <ChevronDown size={14} />
      </button>

      {/* 選択済みシステムチップ */}
      {params.systems.map((systemId) => {
        const system = systems.find((s) => s.systemId === systemId);
        if (!system) return null;
        return (
          <div key={systemId} className={styles.selectedChip}>
            {system.name}
            <button
              type="button"
              onClick={() => toggleSystem(systemId)}
              className={styles.chipRemoveButton}
              aria-label={`${system.name}を削除`}
            >
              <X size={14} />
            </button>
          </div>
        );
      })}

      {/* 選択済みタグチップ */}
      {params.tags.map((tagId) => {
        const tag = tags.find((t) => t.tagId === tagId);
        if (!tag) return null;
        return (
          <div key={tagId} className={styles.selectedChip}>
            {tag.name}
            <button
              type="button"
              onClick={() => toggleTag(tagId)}
              className={styles.chipRemoveButton}
              aria-label={`${tag.name}を削除`}
            >
              <X size={14} />
            </button>
          </div>
        );
      })}
    </div>
  );
};
