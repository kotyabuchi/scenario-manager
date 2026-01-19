'use client';

import { X } from 'lucide-react';

import * as styles from './styles';

import { css } from '@/styled-system/css';

import type { RoleFilter, ScenarioSystem, StatusFilter } from '../interface';

type FilterPanelProps = {
  systems: ScenarioSystem[];
  selectedRole: RoleFilter;
  selectedStatus: StatusFilter;
  selectedSystems: string[];
  onFilterChange: (
    role: RoleFilter,
    status: StatusFilter,
    systems: string[],
  ) => void;
};

// セレクトのスタイル（ボーダーレス、背景色で区別）
const selectStyle = css({
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
  cursor: 'pointer',
  _hover: {
    bg: 'bg.emphasized',
  },
  _focus: {
    bg: 'bg.emphasized',
    shadow: '0 0 0 2px {colors.primary.focusRing}',
  },
});

export const FilterPanel = ({
  systems,
  selectedRole,
  selectedStatus,
  selectedSystems,
  onFilterChange,
}: FilterPanelProps) => {
  const handleSystemToggle = (systemId: string) => {
    const newSystems = selectedSystems.includes(systemId)
      ? selectedSystems.filter((id) => id !== systemId)
      : [...selectedSystems, systemId];
    onFilterChange(selectedRole, selectedStatus, newSystems);
  };

  const handleSystemRemove = (systemId: string) => {
    onFilterChange(
      selectedRole,
      selectedStatus,
      selectedSystems.filter((id) => id !== systemId),
    );
  };

  const getSystemName = (systemId: string) => {
    return systems.find((s) => s.systemId === systemId)?.name ?? systemId;
  };

  return (
    <div className={styles.filterPanel}>
      <div className={styles.filterRow}>
        <div className={styles.filterItem}>
          <label htmlFor="role-filter" className={styles.filterLabel}>
            役割
          </label>
          <select
            id="role-filter"
            value={selectedRole}
            onChange={(e) =>
              onFilterChange(
                e.target.value as RoleFilter,
                selectedStatus,
                selectedSystems,
              )
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
            状態
          </label>
          <select
            id="status-filter"
            value={selectedStatus}
            onChange={(e) =>
              onFilterChange(
                selectedRole,
                e.target.value as StatusFilter,
                selectedSystems,
              )
            }
            className={selectStyle}
          >
            <option value="all">すべて</option>
            <option value="completed">完了のみ</option>
            <option value="cancelled">キャンセルのみ</option>
          </select>
        </div>
      </div>

      <fieldset className={styles.filterField}>
        <legend className={styles.filterLabel}>システム</legend>
        <div className={styles.searchPanelChips}>
          {selectedSystems.map((systemId) => (
            <button
              key={systemId}
              type="button"
              className={styles.chip({ selected: true })}
              onClick={() => handleSystemRemove(systemId)}
            >
              {getSystemName(systemId)}
              <X size={14} />
            </button>
          ))}
          {systems
            .filter((s) => !selectedSystems.includes(s.systemId))
            .slice(0, 5)
            .map((system) => (
              <button
                key={system.systemId}
                type="button"
                className={styles.chip({ selected: false })}
                onClick={() => handleSystemToggle(system.systemId)}
              >
                {system.name}
              </button>
            ))}
        </div>
      </fieldset>
    </div>
  );
};
