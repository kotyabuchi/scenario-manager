'use client';

import { useCallback, type WheelEvent } from 'react';
import {
  NumberInput as ArkNumberInput,
  type NumberInputRootProps,
  type NumberInputValueChangeDetails,
  useNumberInputContext,
} from '@ark-ui/react/number-input';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { isNil } from 'ramda';

import * as styles from './styles';

/**
 * ホイールスクロールで増減可能なコントロール部分
 */
const NumberInputControl = () => {
  const context = useNumberInputContext();

  const handleWheel = useCallback(
    (e: WheelEvent<HTMLDivElement>) => {
      e.preventDefault();
      if (e.deltaY < 0) {
        context.increment();
      } else if (e.deltaY > 0) {
        context.decrement();
      }
    },
    [context],
  );

  return (
    <ArkNumberInput.Control
      className={styles.numberInput_control}
      onWheel={handleWheel}
    >
      <ArkNumberInput.IncrementTrigger
        className={`${styles.numberInput_button} ${styles.numberInput_incrementButton}`}
      >
        <ChevronUp size={14} />
      </ArkNumberInput.IncrementTrigger>
      <ArkNumberInput.DecrementTrigger
        className={`${styles.numberInput_button} ${styles.numberInput_decrementButton}`}
      >
        <ChevronDown size={14} />
      </ArkNumberInput.DecrementTrigger>
    </ArkNumberInput.Control>
  );
};

type NumberInputProps = {
  /** 現在の値（文字列形式推奨） */
  value?: string;
  /** 値変更時のコールバック */
  onValueChange?: (details: NumberInputValueChangeDetails) => void;
  /** 最小値 */
  min?: number;
  /** 最大値 */
  max?: number;
  /** ステップ値 */
  step?: number;
  /** ラベル */
  label?: string;
  /** プレースホルダー */
  placeholder?: string;
  /** 無効状態 */
  disabled?: boolean;
  /** 入力要素のID */
  id?: string;
  /** 入力要素の名前 */
  name?: string;
} & Omit<NumberInputRootProps, 'value' | 'onValueChange'>;

/**
 * 数値入力コンポーネント
 *
 * Ark UI NumberInputをベースに、プロジェクトのデザインシステムに合わせてスタイリング
 *
 * @example
 * <NumberInput
 *   value={value}
 *   onValueChange={(details) => setValue(details.value)}
 *   min={1}
 *   max={20}
 *   placeholder="人数"
 * />
 */
export const NumberInput = ({
  value,
  onValueChange,
  min,
  max,
  step = 1,
  label,
  placeholder,
  disabled,
  id,
  name,
  ...rest
}: NumberInputProps) => {
  return (
    <ArkNumberInput.Root
      value={value}
      onValueChange={onValueChange}
      min={min}
      max={max}
      step={step}
      disabled={disabled}
      className={styles.numberInput_root}
      {...rest}
    >
      {!isNil(label) && (
        <ArkNumberInput.Label className={styles.numberInput_label}>
          {label}
        </ArkNumberInput.Label>
      )}
      <div className={styles.numberInput_wrapper}>
        <ArkNumberInput.Input
          id={id}
          name={name}
          placeholder={placeholder}
          className={styles.numberInput_input}
        />
        <NumberInputControl />
      </div>
    </ArkNumberInput.Root>
  );
};

export type { NumberInputProps, NumberInputValueChangeDetails };
