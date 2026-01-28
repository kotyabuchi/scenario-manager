'use client';

import * as styles from './styles';

import { Select } from '@/components/elements/select/select';

import type { SelectValueChangeDetails } from '@/components/elements/select/select';
import type {
  RoleFilterValue,
  ScenarioSystem,
  StatusFilterValue,
} from '../interface';

type FilterPanelProps = {
  systems: ScenarioSystem[];
  selectedRoles: RoleFilterValue[];
  selectedStatuses: StatusFilterValue[];
  selectedSystems: string[];
  onFilterChange: (
    roles: RoleFilterValue[],
    statuses: StatusFilterValue[],
    systems: string[],
  ) => void;
};

const roleItems = [
  { value: 'keeper', label: 'GM' },
  { value: 'player', label: 'PL' },
  { value: 'spectator', label: '観戦' },
];

const statusItems = [
  { value: 'completed', label: '完了' },
  { value: 'cancelled', label: 'キャンセル' },
];

export const FilterPanel = ({
  systems,
  selectedRoles,
  selectedStatuses,
  selectedSystems,
  onFilterChange,
}: FilterPanelProps) => {
  const systemItems = systems.slice(0, 5).map((s) => ({
    label: s.name,
    value: s.systemId,
  }));

  const handleSystemChange = (
    details: SelectValueChangeDetails<{ label: string; value: string }>,
  ) => {
    onFilterChange(selectedRoles, selectedStatuses, details.value as string[]);
  };

  const handleRoleChange = (
    details: SelectValueChangeDetails<{ label: string; value: string }>,
  ) => {
    onFilterChange(
      details.value as RoleFilterValue[],
      selectedStatuses,
      selectedSystems,
    );
  };

  const handleStatusChange = (
    details: SelectValueChangeDetails<{ label: string; value: string }>,
  ) => {
    onFilterChange(
      selectedRoles,
      details.value as StatusFilterValue[],
      selectedSystems,
    );
  };

  return (
    <div className={styles.filterPanel}>
      <div className={styles.filterPanel_row}>
        {/* システム: width 180 */}
        <div className={styles.filterPanel_fieldSystem}>
          <span className={styles.filterPanel_label}>システム</span>
          <Select
            items={systemItems}
            value={selectedSystems}
            onValueChange={handleSystemChange}
            placeholder="すべて"
            multiple
            variant="form"
          />
        </div>

        {/* 役割: width 140 */}
        <div className={styles.filterPanel_fieldRole}>
          <span className={styles.filterPanel_label}>役割</span>
          <Select
            items={roleItems}
            value={selectedRoles}
            onValueChange={handleRoleChange}
            placeholder="すべて"
            multiple
            variant="form"
          />
        </div>

        {/* ステータス: width 140 */}
        <div className={styles.filterPanel_fieldStatus}>
          <span className={styles.filterPanel_label}>ステータス</span>
          <Select
            items={statusItems}
            value={selectedStatuses}
            onValueChange={handleStatusChange}
            placeholder="すべて"
            multiple
            variant="form"
          />
        </div>
      </div>
    </div>
  );
};
