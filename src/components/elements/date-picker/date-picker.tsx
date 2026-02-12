'use client';

import {
  DatePicker as ArkDatePicker,
  type DatePickerRootProps,
  type DatePickerValueChangeDetails,
} from '@ark-ui/react/date-picker';
import { Portal } from '@ark-ui/react/portal';
import { Calendar, CaretLeft, CaretRight, X } from '@phosphor-icons/react/ssr';
import { isNil } from 'ramda';

import * as styles from './styles';

// Ark UI DatePickerからparseDate関数をre-export
export { parseDate } from '@ark-ui/react/date-picker';

type DatePickerProps = {
  /** 選択中の日付（DateValue配列） */
  value?: DatePickerRootProps['value'];
  /** 値変更時のコールバック */
  onValueChange?: (details: DatePickerValueChangeDetails) => void;
  /** プレースホルダー */
  placeholder?: string;
  /** 無効状態 */
  disabled?: boolean;
  /** 入力要素の名前 */
  name?: string;
  /** 入力要素のID */
  id?: string;
  /** 最小日付 */
  min?: DatePickerRootProps['min'];
  /** 最大日付 */
  max?: DatePickerRootProps['max'];
  /** 範囲選択モード */
  selectionMode?: 'single' | 'multiple' | 'range';
  /** ロケール */
  locale?: string;
} & Omit<DatePickerRootProps, 'value' | 'onValueChange'>;

/**
 * 日付選択コンポーネント
 *
 * Ark UI DatePickerをベースに、プロジェクトのデザインシステムに合わせてスタイリング
 *
 * @example
 * import { DatePicker, parseDate } from '@/components/elements';
 *
 * const [value, setValue] = useState([parseDate('2024-01-01')]);
 *
 * <DatePicker
 *   value={value}
 *   onValueChange={(details) => setValue(details.value)}
 *   placeholder="日付を選択"
 * />
 */
export const DatePicker = ({
  value,
  onValueChange,
  placeholder = '日付を選択',
  disabled,
  name,
  id,
  min,
  max,
  selectionMode = 'single',
  locale = 'ja-JP',
  ...rest
}: DatePickerProps) => {
  return (
    <ArkDatePicker.Root
      value={value}
      onValueChange={onValueChange}
      disabled={disabled}
      name={name}
      min={min}
      max={max}
      selectionMode={selectionMode}
      locale={locale}
      className={styles.datePicker_root}
      {...rest}
    >
      <ArkDatePicker.Control className={styles.datePicker_control}>
        <ArkDatePicker.Input
          id={id}
          placeholder={placeholder}
          className={styles.datePicker_input}
        />
        {!isNil(value) && value.length > 0 && (
          <ArkDatePicker.ClearTrigger
            className={styles.datePicker_clearTrigger}
          >
            <X size={16} />
          </ArkDatePicker.ClearTrigger>
        )}
        <ArkDatePicker.Trigger className={styles.datePicker_trigger}>
          <Calendar size={16} />
        </ArkDatePicker.Trigger>
      </ArkDatePicker.Control>
      <Portal>
        <ArkDatePicker.Positioner className={styles.datePicker_positioner}>
          <ArkDatePicker.Content className={styles.datePicker_content}>
            <ArkDatePicker.View view="day">
              <ArkDatePicker.Context>
                {(context) => (
                  <>
                    <ArkDatePicker.ViewControl
                      className={styles.datePicker_header}
                    >
                      <ArkDatePicker.PrevTrigger
                        className={styles.datePicker_navButton}
                      >
                        <CaretLeft size={16} />
                      </ArkDatePicker.PrevTrigger>
                      <ArkDatePicker.ViewTrigger
                        className={styles.datePicker_viewTrigger}
                      >
                        <ArkDatePicker.RangeText />
                      </ArkDatePicker.ViewTrigger>
                      <ArkDatePicker.NextTrigger
                        className={styles.datePicker_navButton}
                      >
                        <CaretRight size={16} />
                      </ArkDatePicker.NextTrigger>
                    </ArkDatePicker.ViewControl>
                    <ArkDatePicker.Table className={styles.datePicker_table}>
                      <ArkDatePicker.TableHead>
                        <ArkDatePicker.TableRow>
                          {context.weekDays.map((weekDay, index) => (
                            <ArkDatePicker.TableHeader
                              key={weekDay.short}
                              className={styles.datePicker_tableHeader}
                              data-holiday-type={
                                index === 0
                                  ? 'sunday'
                                  : index === 6
                                    ? 'saturday'
                                    : null
                              }
                            >
                              {weekDay.narrow}
                            </ArkDatePicker.TableHeader>
                          ))}
                        </ArkDatePicker.TableRow>
                      </ArkDatePicker.TableHead>
                      <ArkDatePicker.TableBody>
                        {context.weeks.map((week) => (
                          <ArkDatePicker.TableRow
                            key={`week-${week[0]?.year}-${week[0]?.month}-${week[0]?.day}`}
                          >
                            {week.map((day, index) => (
                              <ArkDatePicker.TableCell
                                key={`${day.year}-${day.month}-${day.day}`}
                                value={day}
                                className={styles.datePicker_tableCell}
                              >
                                <ArkDatePicker.TableCellTrigger
                                  className={styles.datePicker_day}
                                  data-holiday-type={
                                    index === 0
                                      ? 'sunday'
                                      : index === 6
                                        ? 'saturday'
                                        : null
                                  }
                                >
                                  {day.day}
                                </ArkDatePicker.TableCellTrigger>
                              </ArkDatePicker.TableCell>
                            ))}
                          </ArkDatePicker.TableRow>
                        ))}
                      </ArkDatePicker.TableBody>
                    </ArkDatePicker.Table>
                  </>
                )}
              </ArkDatePicker.Context>
            </ArkDatePicker.View>

            <ArkDatePicker.View view="month">
              <ArkDatePicker.Context>
                {(context) => (
                  <>
                    <ArkDatePicker.ViewControl
                      className={styles.datePicker_header}
                    >
                      <ArkDatePicker.PrevTrigger
                        className={styles.datePicker_navButton}
                      >
                        <CaretLeft size={16} />
                      </ArkDatePicker.PrevTrigger>
                      <ArkDatePicker.ViewTrigger
                        className={styles.datePicker_viewTrigger}
                      >
                        <ArkDatePicker.RangeText />
                      </ArkDatePicker.ViewTrigger>
                      <ArkDatePicker.NextTrigger
                        className={styles.datePicker_navButton}
                      >
                        <CaretRight size={16} />
                      </ArkDatePicker.NextTrigger>
                    </ArkDatePicker.ViewControl>
                    <ArkDatePicker.Table className={styles.datePicker_table}>
                      <ArkDatePicker.TableBody>
                        {context
                          .getMonthsGrid({ columns: 4, format: 'short' })
                          .map((months) => (
                            <ArkDatePicker.TableRow
                              key={`month-row-${months[0]?.label}`}
                            >
                              {months.map((month) => (
                                <ArkDatePicker.TableCell
                                  key={`month-${month.label}`}
                                  value={month.value}
                                  className={styles.datePicker_tableCell}
                                >
                                  <ArkDatePicker.TableCellTrigger
                                    className={styles.datePicker_monthYearCell}
                                  >
                                    {month.label}
                                  </ArkDatePicker.TableCellTrigger>
                                </ArkDatePicker.TableCell>
                              ))}
                            </ArkDatePicker.TableRow>
                          ))}
                      </ArkDatePicker.TableBody>
                    </ArkDatePicker.Table>
                  </>
                )}
              </ArkDatePicker.Context>
            </ArkDatePicker.View>

            <ArkDatePicker.View view="year">
              <ArkDatePicker.Context>
                {(context) => (
                  <>
                    <ArkDatePicker.ViewControl
                      className={styles.datePicker_header}
                    >
                      <ArkDatePicker.PrevTrigger
                        className={styles.datePicker_navButton}
                      >
                        <CaretLeft size={16} />
                      </ArkDatePicker.PrevTrigger>
                      <ArkDatePicker.ViewTrigger
                        className={styles.datePicker_viewTrigger}
                      >
                        <ArkDatePicker.RangeText />
                      </ArkDatePicker.ViewTrigger>
                      <ArkDatePicker.NextTrigger
                        className={styles.datePicker_navButton}
                      >
                        <CaretRight size={16} />
                      </ArkDatePicker.NextTrigger>
                    </ArkDatePicker.ViewControl>
                    <ArkDatePicker.Table className={styles.datePicker_table}>
                      <ArkDatePicker.TableBody>
                        {context.getYearsGrid({ columns: 4 }).map((years) => (
                          <ArkDatePicker.TableRow
                            key={`year-row-${years[0]?.label}`}
                          >
                            {years.map((year) => (
                              <ArkDatePicker.TableCell
                                key={`year-${year.label}`}
                                value={year.value}
                                className={styles.datePicker_tableCell}
                              >
                                <ArkDatePicker.TableCellTrigger
                                  className={styles.datePicker_monthYearCell}
                                >
                                  {year.label}
                                </ArkDatePicker.TableCellTrigger>
                              </ArkDatePicker.TableCell>
                            ))}
                          </ArkDatePicker.TableRow>
                        ))}
                      </ArkDatePicker.TableBody>
                    </ArkDatePicker.Table>
                  </>
                )}
              </ArkDatePicker.Context>
            </ArkDatePicker.View>
          </ArkDatePicker.Content>
        </ArkDatePicker.Positioner>
      </Portal>
    </ArkDatePicker.Root>
  );
};

export type { DatePickerProps, DatePickerValueChangeDetails };
