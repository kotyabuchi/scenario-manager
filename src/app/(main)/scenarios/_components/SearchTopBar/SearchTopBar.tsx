'use client';

import { Search, X } from 'lucide-react';

import * as styles from './styles';

import { Button } from '@/components/elements/button/button';
import {
  Select,
  type SelectItem,
  type SelectValueChangeDetails,
} from '@/components/elements/select/select';

import type { SystemItem } from '@/components/blocks/FilterPanel';
import type { UseFilterDraftReturn } from '@/components/blocks/FilterPanel/useFilterDraft';

type SearchTopBarProps = {
  systems: SystemItem[];
  draftState: UseFilterDraftReturn;
};

export const SearchTopBar = ({ systems, draftState }: SearchTopBarProps) => {
  const { draft, setSystems, setKeyword, clearAll, commit } = draftState;

  // Select 用のアイテム変換
  const systemSelectItems: SelectItem[] = systems.map((s) => ({
    value: s.systemId,
    label: s.name,
  }));

  const handleSystemChange = (
    details: SelectValueChangeDetails<SelectItem>,
  ) => {
    setSystems(details.value);
  };

  const handleClear = () => {
    clearAll();
    commit();
  };

  const handleSearch = () => {
    commit();
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      commit();
    }
  };

  return (
    <div className={styles.searchTopBar}>
      <div className={styles.searchTopBar_systemSelect}>
        <Select
          items={systemSelectItems}
          value={draft.systems}
          onValueChange={handleSystemChange}
          placeholder="システムを選択"
          aria-label="TRPGシステムで絞り込み"
          multiple
        />
      </div>

      <input
        type="text"
        placeholder="シナリオを検索..."
        aria-label="シナリオ名で検索"
        className={styles.searchTopBar_keywordInput}
        value={draft.q}
        onChange={(e) => setKeyword(e.target.value)}
        onKeyDown={handleKeyDown}
      />

      <div className={styles.searchTopBar_actions}>
        <Button
          type="button"
          variant="outline"
          status="primary"
          onClick={handleClear}
        >
          <X size={16} />
          クリア
        </Button>

        <Button type="button" status="primary" onClick={handleSearch}>
          <Search size={16} />
          検索
        </Button>
      </div>
    </div>
  );
};
