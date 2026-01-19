'use client';

import { useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { X } from 'lucide-react';

import { type SearchFormValues, searchFormSchema } from './schema';
import * as styles from './styles';

import { Button } from '@/components/elements/button/button';
import { SessionPhases } from '@/db/enum';
import { css } from '@/styled-system/css';

import type { ScenarioSystem } from '../interface';

// 入力フィールドのスタイル（ボーダーレス、背景色で区別）
const inputStyle = css({
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
  w: 'full',
  _hover: {
    bg: 'bg.emphasized',
  },
  _focus: {
    bg: 'bg.emphasized',
    shadow: '0 0 0 2px {colors.primary.focusRing}',
  },
  _placeholder: {
    color: 'text.muted',
  },
});

type SearchPanelProps = {
  systems: ScenarioSystem[];
  selectedSystems: string[];
  selectedPhases: string[];
  dateFrom: string;
  dateTo: string;
  scenarioName: string;
  onSearch: (values: SearchFormValues) => void;
  onReset: () => void;
};

const phaseOptions = [
  {
    value: SessionPhases.RECRUITING.value,
    label: SessionPhases.RECRUITING.label,
  },
  {
    value: SessionPhases.PREPARATION.value,
    label: SessionPhases.PREPARATION.label,
  },
  {
    value: SessionPhases.IN_PROGRESS.value,
    label: SessionPhases.IN_PROGRESS.label,
  },
  {
    value: SessionPhases.COMPLETED.value,
    label: SessionPhases.COMPLETED.label,
  },
] as const;

export const SearchPanel = ({
  systems,
  selectedSystems,
  selectedPhases,
  dateFrom,
  dateTo,
  scenarioName,
  onSearch,
  onReset,
}: SearchPanelProps) => {
  const { register, handleSubmit, setValue, watch, reset } =
    useForm<SearchFormValues>({
      resolver: zodResolver(searchFormSchema),
      defaultValues: {
        systems: selectedSystems,
        phases: selectedPhases,
        dateFrom,
        dateTo,
        q: scenarioName,
      },
    });

  const watchSystems = watch('systems');
  const watchPhases = watch('phases');

  const handleSystemToggle = useCallback(
    (systemId: string) => {
      const current = watchSystems || [];
      const newSystems = current.includes(systemId)
        ? current.filter((id) => id !== systemId)
        : [...current, systemId];
      setValue('systems', newSystems);
    },
    [watchSystems, setValue],
  );

  const handleSystemRemove = useCallback(
    (systemId: string) => {
      const current = watchSystems || [];
      setValue(
        'systems',
        current.filter((id) => id !== systemId),
      );
    },
    [watchSystems, setValue],
  );

  const handlePhaseToggle = useCallback(
    (phase: string) => {
      const current = watchPhases || [];
      const newPhases = current.includes(phase)
        ? current.filter((p) => p !== phase)
        : [...current, phase];
      setValue('phases', newPhases);
    },
    [watchPhases, setValue],
  );

  const handleReset = useCallback(() => {
    reset({
      systems: [],
      phases: ['RECRUITING', 'PREPARATION'],
      dateFrom: '',
      dateTo: '',
      q: '',
    });
    onReset();
  }, [reset, onReset]);

  const onSubmit = (data: SearchFormValues) => {
    onSearch(data);
  };

  const getSystemName = (systemId: string) => {
    return systems.find((s) => s.systemId === systemId)?.name ?? systemId;
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className={styles.searchPanel}>
      <div className={styles.searchPanelRow}>
        <fieldset className={styles.searchPanelField}>
          <legend className={styles.searchPanelLabel}>システム</legend>
          <div className={styles.searchPanelChips}>
            {watchSystems?.map((systemId) => (
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
              .filter((s) => !watchSystems?.includes(s.systemId))
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

      <div className={styles.searchPanelRow}>
        <fieldset className={styles.searchPanelField}>
          <legend className={styles.searchPanelLabel}>フェーズ</legend>
          <div className={styles.searchPanelChips}>
            {phaseOptions.map((phase) => (
              <button
                key={phase.value}
                type="button"
                className={styles.chip({
                  selected: watchPhases?.includes(phase.value),
                })}
                onClick={() => handlePhaseToggle(phase.value)}
              >
                {phase.label}
              </button>
            ))}
          </div>
        </fieldset>
      </div>

      <div className={styles.searchPanelRow}>
        <div className={styles.searchPanelField}>
          <span className={styles.searchPanelLabel}>開催日</span>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <input
              type="date"
              {...register('dateFrom')}
              className={styles.dateInput}
              aria-label="開催日（開始）"
            />
            <span>〜</span>
            <input
              type="date"
              {...register('dateTo')}
              className={styles.dateInput}
              aria-label="開催日（終了）"
            />
          </div>
        </div>

        <div className={styles.searchPanelField}>
          <label htmlFor="scenarioName" className={styles.searchPanelLabel}>
            シナリオ名
          </label>
          <input
            id="scenarioName"
            {...register('q')}
            placeholder="シナリオ名で検索"
            className={inputStyle}
          />
        </div>
      </div>

      <div className={styles.searchActions}>
        <Button type="submit" status="primary">
          検索
        </Button>
        <Button type="button" variant="outline" onClick={handleReset}>
          条件クリア
        </Button>
      </div>
    </form>
  );
};
