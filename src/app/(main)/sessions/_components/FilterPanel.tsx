'use client';

import * as styles from './styles';

import { Chip } from '@/components/elements/Chip';

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

const roleOptions: { value: RoleFilterValue; label: string }[] = [
  { value: 'keeper', label: 'GM' },
  { value: 'player', label: 'PL' },
  { value: 'spectator', label: '観戦' },
];

const statusOptions: { value: StatusFilterValue; label: string }[] = [
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
  const handleRoleToggle = (role: RoleFilterValue) => {
    const newRoles = selectedRoles.includes(role)
      ? selectedRoles.filter((r) => r !== role)
      : [...selectedRoles, role];
    onFilterChange(newRoles, selectedStatuses, selectedSystems);
  };

  const handleStatusToggle = (status: StatusFilterValue) => {
    const newStatuses = selectedStatuses.includes(status)
      ? selectedStatuses.filter((s) => s !== status)
      : [...selectedStatuses, status];
    onFilterChange(selectedRoles, newStatuses, selectedSystems);
  };

  const handleSystemToggle = (systemId: string) => {
    const newSystems = selectedSystems.includes(systemId)
      ? selectedSystems.filter((id) => id !== systemId)
      : [...selectedSystems, systemId];
    onFilterChange(selectedRoles, selectedStatuses, newSystems);
  };

  return (
    <div className={styles.filterPanel}>
      <fieldset className={styles.searchPanelField}>
        <legend className={styles.searchPanelLabel}>役割</legend>
        <div className={styles.searchPanelChips}>
          {roleOptions.map((option) => (
            <Chip
              key={option.value}
              label={option.label}
              selected={selectedRoles.includes(option.value)}
              onClick={() => handleRoleToggle(option.value)}
            />
          ))}
        </div>
      </fieldset>

      <fieldset className={styles.searchPanelField}>
        <legend className={styles.searchPanelLabel}>状態</legend>
        <div className={styles.searchPanelChips}>
          {statusOptions.map((option) => (
            <Chip
              key={option.value}
              label={option.label}
              selected={selectedStatuses.includes(option.value)}
              onClick={() => handleStatusToggle(option.value)}
            />
          ))}
        </div>
      </fieldset>

      <fieldset className={styles.searchPanelField}>
        <legend className={styles.searchPanelLabel}>システム</legend>
        <div className={styles.searchPanelChips}>
          {systems.slice(0, 5).map((system) => (
            <Chip
              key={system.systemId}
              label={system.name}
              selected={selectedSystems.includes(system.systemId)}
              onClick={() => handleSystemToggle(system.systemId)}
            />
          ))}
        </div>
      </fieldset>
    </div>
  );
};
