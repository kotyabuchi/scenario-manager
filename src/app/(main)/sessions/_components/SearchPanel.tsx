'use client';

import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Search } from 'lucide-react';
import { isNil } from 'ramda';

import { type SearchFormValues, searchFormSchema } from './schema';
import * as styles from './styles';

import { FieldError } from '@/components/elements';
import { Button } from '@/components/elements/button/button';
import {
  DatePicker,
  parseDate,
} from '@/components/elements/date-picker/date-picker';
import { Input } from '@/components/elements/input/input';
import { Select } from '@/components/elements/select/select';
import { SessionPhases } from '@/db/enum';

import type { DatePickerValueChangeDetails } from '@/components/elements/date-picker/date-picker';
import type { ScenarioSystem } from '../interface';

type SearchPanelProps = {
  systems: ScenarioSystem[];
  selectedSystems: string[];
  selectedPhases: string[];
  dateFrom: string;
  dateTo: string;
  scenarioName: string;
  onSearch: (values: SearchFormValues) => void;
};

const phaseItems = [
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
];

/** 日付文字列(YYYY-MM-DD)をArk UI DateValue配列に変換 */
const toDateValue = (dateStr: string) => {
  if (isNil(dateStr) || dateStr === '') return undefined;
  try {
    return [parseDate(dateStr)];
  } catch {
    return undefined;
  }
};

/** DatePickerの値を文字列に変換 */
const fromDateValue = (details: DatePickerValueChangeDetails): string => {
  if (details.valueAsString.length === 0) return '';
  return details.valueAsString[0] ?? '';
};

export const SearchPanel = ({
  systems,
  selectedSystems,
  selectedPhases,
  dateFrom,
  dateTo,
  scenarioName,
  onSearch,
}: SearchPanelProps) => {
  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = useForm<SearchFormValues>({
    resolver: zodResolver(searchFormSchema),
    defaultValues: {
      systems: selectedSystems,
      phases: selectedPhases,
      dateFrom,
      dateTo,
      q: scenarioName,
    },
  });

  const systemItems = systems.map((s) => ({
    label: s.name,
    value: s.systemId,
  }));

  const onSubmit = (data: SearchFormValues) => {
    onSearch(data);
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className={styles.searchPanel}>
      <div className={styles.searchPanel_row}>
        {/* システム: width 200 */}
        <div
          className={`${styles.searchPanel_field} ${styles.searchPanel_systemField}`}
        >
          <span className={styles.searchPanel_label}>システム</span>
          <Controller
            name="systems"
            control={control}
            render={({ field }) => (
              <Select
                items={systemItems}
                value={field.value ?? []}
                onValueChange={(details) => field.onChange(details.value)}
                placeholder="すべて"
                multiple
                variant="form"
              />
            )}
          />
        </div>

        {/* 開催日: width 280 */}
        <div
          className={`${styles.searchPanel_field} ${styles.searchPanel_dateField}`}
        >
          <span className={styles.searchPanel_label}>開催日</span>
          <div className={styles.searchPanel_dateRow}>
            <Controller
              name="dateFrom"
              control={control}
              render={({ field }) => (
                <DatePicker
                  value={toDateValue(field.value ?? '')}
                  onValueChange={(details) =>
                    field.onChange(fromDateValue(details))
                  }
                  placeholder="開始日"
                />
              )}
            />
            <span className={styles.searchPanel_dateSep}>〜</span>
            <Controller
              name="dateTo"
              control={control}
              render={({ field }) => (
                <DatePicker
                  value={toDateValue(field.value ?? '')}
                  onValueChange={(details) =>
                    field.onChange(fromDateValue(details))
                  }
                  placeholder="終了日"
                />
              )}
            />
          </div>
          <FieldError error={errors.dateFrom} />
          <FieldError error={errors.dateTo} />
        </div>

        {/* ステータス: width 160 */}
        <div
          className={`${styles.searchPanel_field} ${styles.searchPanel_statusField}`}
        >
          <span className={styles.searchPanel_label}>ステータス</span>
          <Controller
            name="phases"
            control={control}
            render={({ field }) => (
              <Select
                items={phaseItems}
                value={field.value ?? []}
                onValueChange={(details) => field.onChange(details.value)}
                placeholder="すべて"
                multiple
                variant="form"
              />
            )}
          />
        </div>

        {/* シナリオ名: fill */}
        <div
          className={`${styles.searchPanel_field} ${styles.searchPanel_scenarioField}`}
        >
          <label htmlFor="scenarioName" className={styles.searchPanel_label}>
            シナリオ名
          </label>
          <Input
            id="scenarioName"
            {...register('q')}
            placeholder="シナリオ名で検索..."
          />
        </div>

        {/* 検索ボタン: width 100 */}
        <div className={styles.searchPanel_fieldSearchButton}>
          <Button
            type="submit"
            status="primary"
            className={styles.searchPanel_submitButton}
          >
            <Search size={16} />
            検索
          </Button>
        </div>
      </div>
    </form>
  );
};
