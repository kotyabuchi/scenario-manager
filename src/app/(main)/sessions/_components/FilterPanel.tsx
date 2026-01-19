'use client';

import * as styles from './styles';

import { css } from '@/styled-system/css';

import type { RoleFilter, StatusFilter } from '../interface';

type FilterPanelProps = {
  selectedRole: RoleFilter;
  selectedStatus: StatusFilter;
  onFilterChange: (role: RoleFilter, status: StatusFilter) => void;
};

const selectStyle = css({
  px: 'sm',
  py: 'xs',
  border: '1px solid',
  borderColor: 'border.500',
  borderRadius: 'sm',
  bg: 'bg.primary',
  color: 'text.primary',
  fontSize: 'sm',
  outline: 'none',
  cursor: 'pointer',
  _focus: {
    borderColor: 'primary.500',
  },
});

export const FilterPanel = ({
  selectedRole,
  selectedStatus,
  onFilterChange,
}: FilterPanelProps) => {
  return (
    <div className={styles.filterPanel}>
      <div className={styles.filterRow}>
        <div className={styles.filterItem}>
          <label htmlFor="role-filter" className={styles.filterLabel}>
            役割:
          </label>
          <select
            id="role-filter"
            value={selectedRole}
            onChange={(e) =>
              onFilterChange(e.target.value as RoleFilter, selectedStatus)
            }
            className={selectStyle}
          >
            <option value="all">すべて</option>
            <option value="keeper">GM</option>
            <option value="player">PL</option>
            <option value="spectator">観戦</option>
          </select>
        </div>

        <div className={styles.filterItem}>
          <label htmlFor="status-filter" className={styles.filterLabel}>
            状態:
          </label>
          <select
            id="status-filter"
            value={selectedStatus}
            onChange={(e) =>
              onFilterChange(selectedRole, e.target.value as StatusFilter)
            }
            className={selectStyle}
          >
            <option value="all">すべて</option>
            <option value="completed">完了のみ</option>
            <option value="cancelled">キャンセルのみ</option>
          </select>
        </div>
      </div>
    </div>
  );
};
