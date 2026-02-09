'use client';

import { Search } from 'lucide-react';

import * as styles from './styles';

import { Button } from '@/components/elements/button/button';
import {
  Select,
  type SelectItem,
  type SelectValueChangeDetails,
} from '@/components/elements/select/select';

import type { SystemItem } from '@/components/blocks/FilterPanel';
import type { UseFilterDraftReturn } from '@/components/blocks/FilterPanel/useFilterDraft';

type MobileSearchBarProps = {
  systems: SystemItem[];
  draftState: UseFilterDraftReturn;
};

export const MobileSearchBar = ({
  systems,
  draftState,
}: MobileSearchBarProps) => {
  const { draft, setSystems, setKeyword, commit } = draftState;

  const systemSelectItems: SelectItem[] = systems.map((s) => ({
    value: s.systemId,
    label: s.name,
  }));

  const handleSystemChange = (
    details: SelectValueChangeDetails<SelectItem>,
  ) => {
    setSystems(details.value);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') commit();
  };

  return (
    <div className={styles.mobileSearchBar}>
      <input
        type="text"
        placeholder="シナリオを検索..."
        aria-label="シナリオ名で検索"
        className={styles.keywordSearchInput}
        value={draft.q}
        onChange={(e) => setKeyword(e.target.value)}
        onKeyDown={handleKeyDown}
      />

      <div className={styles.mobileSearchBar_row}>
        <div className={styles.mobileSearchBar_systemSelect}>
          <Select
            items={systemSelectItems}
            value={draft.systems}
            onValueChange={handleSystemChange}
            placeholder="システム"
            multiple
          />
        </div>
        <Button type="button" status="primary" onClick={commit}>
          <Search size={16} />
          検索
        </Button>
      </div>
    </div>
  );
};
