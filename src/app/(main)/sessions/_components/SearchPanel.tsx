'use client';

import { useCallback, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

import { type SearchFormValues, searchFormSchema } from './schema';
import * as styles from './styles';

import { Button } from '@/components/elements/button/button';
import { Chip } from '@/components/elements/Chip';
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

// 日付プリセットオプション
type DatePreset = 'none' | 'weekend' | 'nextWeek' | 'thisMonth' | 'custom';

const datePresetOptions: { value: DatePreset; label: string }[] = [
  { value: 'none', label: '指定なし' },
  { value: 'weekend', label: '今週末' },
  { value: 'nextWeek', label: '来週' },
  { value: 'thisMonth', label: '今月' },
  { value: 'custom', label: '日付指定' },
];

// 日付プリセットから範囲を計算
const getDateRangeFromPreset = (
  preset: DatePreset,
): { from: string; to: string } => {
  const today = new Date();
  const formatDate = (d: Date): string => {
    const result = d.toISOString().split('T')[0];
    return result ?? '';
  };

  switch (preset) {
    case 'weekend': {
      // 今週の土曜〜日曜
      const dayOfWeek = today.getDay();
      const daysUntilSaturday = (6 - dayOfWeek + 7) % 7 || 7;
      const saturday = new Date(today);
      saturday.setDate(today.getDate() + daysUntilSaturday);
      const sunday = new Date(saturday);
      sunday.setDate(saturday.getDate() + 1);
      return { from: formatDate(saturday), to: formatDate(sunday) };
    }
    case 'nextWeek': {
      // 来週の月曜〜日曜
      const dayOfWeek = today.getDay();
      const daysUntilNextMonday = (8 - dayOfWeek) % 7 || 7;
      const nextMonday = new Date(today);
      nextMonday.setDate(today.getDate() + daysUntilNextMonday);
      const nextSunday = new Date(nextMonday);
      nextSunday.setDate(nextMonday.getDate() + 6);
      return { from: formatDate(nextMonday), to: formatDate(nextSunday) };
    }
    case 'thisMonth': {
      // 今月の今日〜月末
      const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);
      return { from: formatDate(today), to: formatDate(endOfMonth) };
    }
    default:
      return { from: '', to: '' };
  }
};

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
  const watchDateFrom = watch('dateFrom');
  const watchDateTo = watch('dateTo');

  // 現在の日付範囲からプリセットを推測
  const currentPreset = useMemo((): DatePreset => {
    if (!watchDateFrom && !watchDateTo) return 'none';

    // 各プリセットの範囲と比較
    for (const preset of ['weekend', 'nextWeek', 'thisMonth'] as const) {
      const range = getDateRangeFromPreset(preset);
      if (range.from === watchDateFrom && range.to === watchDateTo) {
        return preset;
      }
    }
    return 'custom';
  }, [watchDateFrom, watchDateTo]);

  const handleDatePresetChange = useCallback(
    (preset: DatePreset) => {
      if (preset === 'none') {
        setValue('dateFrom', '');
        setValue('dateTo', '');
      } else if (preset === 'custom') {
        // カスタム選択時は現在の値を維持
      } else {
        const range = getDateRangeFromPreset(preset);
        setValue('dateFrom', range.from);
        setValue('dateTo', range.to);
      }
    },
    [setValue],
  );

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

  return (
    <form onSubmit={handleSubmit(onSubmit)} className={styles.searchPanel}>
      <div className={styles.searchPanelRow}>
        <fieldset className={styles.searchPanelField}>
          <legend className={styles.searchPanelLabel}>システム</legend>
          <div className={styles.searchPanelChips}>
            {systems.slice(0, 5).map((system) => (
              <Chip
                key={system.systemId}
                label={system.name}
                selected={watchSystems?.includes(system.systemId)}
                onClick={() => handleSystemToggle(system.systemId)}
              />
            ))}
          </div>
        </fieldset>
      </div>

      <div className={styles.searchPanelRow}>
        <fieldset className={styles.searchPanelField}>
          <legend className={styles.searchPanelLabel}>フェーズ</legend>
          <div className={styles.searchPanelChips}>
            {phaseOptions.map((phase) => (
              <Chip
                key={phase.value}
                label={phase.label}
                selected={watchPhases?.includes(phase.value)}
                onClick={() => handlePhaseToggle(phase.value)}
              />
            ))}
          </div>
        </fieldset>
      </div>

      <div className={styles.searchPanelField}>
        <span className={styles.searchPanelLabel}>開催日</span>
        <div className={styles.datePresetContainer}>
          <div className={styles.searchPanelChips}>
            {datePresetOptions.map((option) => (
              <Chip
                key={option.value}
                label={option.label}
                selected={currentPreset === option.value}
                onClick={() => handleDatePresetChange(option.value)}
              />
            ))}
          </div>
          {currentPreset === 'custom' && (
            <div className={styles.dateInputContainer}>
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
          )}
        </div>
      </div>

      <div className={styles.searchPanelField}>
        <label htmlFor="scenarioName" className={styles.searchPanelLabel}>
          シナリオ名
        </label>
        <input
          id="scenarioName"
          {...register('q')}
          placeholder="シナリオ名で検索..."
          className={inputStyle}
        />
      </div>

      <hr className={styles.searchDivider} />
      <div className={styles.searchActions}>
        <Button type="submit" status="primary">
          検索
        </Button>
        <Button type="button" variant="ghost" onClick={handleReset}>
          条件クリア
        </Button>
      </div>
    </form>
  );
};
