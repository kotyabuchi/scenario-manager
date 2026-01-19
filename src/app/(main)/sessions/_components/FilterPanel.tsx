'use client';

import { X } from 'lucide-react';

import * as styles from './styles';

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

  const handleRoleRemove = (role: RoleFilterValue) => {
    onFilterChange(
      selectedRoles.filter((r) => r !== role),
      selectedStatuses,
      selectedSystems,
    );
  };

  const handleStatusToggle = (status: StatusFilterValue) => {
    const newStatuses = selectedStatuses.includes(status)
      ? selectedStatuses.filter((s) => s !== status)
      : [...selectedStatuses, status];
    onFilterChange(selectedRoles, newStatuses, selectedSystems);
  };

  const handleStatusRemove = (status: StatusFilterValue) => {
    onFilterChange(
      selectedRoles,
      selectedStatuses.filter((s) => s !== status),
      selectedSystems,
    );
  };

  const handleSystemToggle = (systemId: string) => {
    const newSystems = selectedSystems.includes(systemId)
      ? selectedSystems.filter((id) => id !== systemId)
      : [...selectedSystems, systemId];
    onFilterChange(selectedRoles, selectedStatuses, newSystems);
  };

  const handleSystemRemove = (systemId: string) => {
    onFilterChange(
      selectedRoles,
      selectedStatuses,
      selectedSystems.filter((id) => id !== systemId),
    );
  };

  const getSystemName = (systemId: string) => {
    return systems.find((s) => s.systemId === systemId)?.name ?? systemId;
  };

  return (
    <div className={styles.filterPanel}>
      <fieldset className={styles.searchPanelField}>
        <legend className={styles.searchPanelLabel}>役割</legend>
        <div className={styles.searchPanelChips}>
          {selectedRoles.map((role) => (
            <button
              key={role}
              type="button"
              className={styles.chip({ selected: true })}
              onClick={() => handleRoleRemove(role)}
            >
              {roleOptions.find((o) => o.value === role)?.label}
              <X size={14} />
            </button>
          ))}
          {roleOptions
            .filter((o) => !selectedRoles.includes(o.value))
            .map((option) => (
              <button
                key={option.value}
                type="button"
                className={styles.chip({ selected: false })}
                onClick={() => handleRoleToggle(option.value)}
              >
                {option.label}
              </button>
            ))}
        </div>
      </fieldset>

      <fieldset className={styles.searchPanelField}>
        <legend className={styles.searchPanelLabel}>状態</legend>
        <div className={styles.searchPanelChips}>
          {selectedStatuses.map((status) => (
            <button
              key={status}
              type="button"
              className={styles.chip({ selected: true })}
              onClick={() => handleStatusRemove(status)}
            >
              {statusOptions.find((o) => o.value === status)?.label}
              <X size={14} />
            </button>
          ))}
          {statusOptions
            .filter((o) => !selectedStatuses.includes(o.value))
            .map((option) => (
              <button
                key={option.value}
                type="button"
                className={styles.chip({ selected: false })}
                onClick={() => handleStatusToggle(option.value)}
              >
                {option.label}
              </button>
            ))}
        </div>
      </fieldset>

      <fieldset className={styles.searchPanelField}>
        <legend className={styles.searchPanelLabel}>システム</legend>
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
