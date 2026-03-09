import { MagnifyingGlass } from '@phosphor-icons/react/ssr';

import * as styles from '../styles';

import { Input } from '@/components/elements/input';
import { Select } from '@/components/elements/select';

import type { SelectItem } from '@/components/elements/select/select';

/** ソート選択肢 */
const SORT_ITEMS: SelectItem[] = [
  { label: '申請日時（新しい順）', value: 'newest' },
  { label: '申請日時（古い順）', value: 'oldest' },
  { label: '名前順', value: 'name' },
];

/** フィルター選択肢 */
const FILTER_ITEMS: SelectItem[] = [
  { label: 'すべて', value: 'all' },
  { label: '承認待ち', value: 'pending' },
  { label: '承認済み', value: 'confirmed' },
];

type FilterBarProps = {
  searchQuery: string;
  onSearchChange: (value: string) => void;
  sortValue: string;
  onSortChange: (value: string) => void;
  filterValue: string;
  onFilterChange: (value: string) => void;
};

/**
 * フィルターバー: 検索・ソート・フィルターを横並びに配置
 */
export const FilterBar = ({
  searchQuery,
  onSearchChange,
  sortValue,
  onSortChange,
  filterValue,
  onFilterChange,
}: FilterBarProps) => {
  return (
    <div className={styles.filterBar_container}>
      <div className={styles.filterBar_searchArea}>
        <Input
          prefix={<MagnifyingGlass size={16} />}
          placeholder="名前で検索..."
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          size="sm"
          aria-label="申請者名で検索"
        />
      </div>
      <div className={styles.filterBar_selectArea}>
        <Select
          items={SORT_ITEMS}
          value={[sortValue]}
          onValueChange={(details) => {
            const selected = details.value[0];
            if (selected) onSortChange(selected);
          }}
          variant="minimal"
          aria-label="並び替え"
        />
        <Select
          items={FILTER_ITEMS}
          value={[filterValue]}
          onValueChange={(details) => {
            const selected = details.value[0];
            if (selected) onFilterChange(selected);
          }}
          variant="minimal"
          aria-label="ステータスでフィルター"
        />
      </div>
    </div>
  );
};
