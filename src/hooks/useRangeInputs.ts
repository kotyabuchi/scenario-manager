import { useState } from 'react';

import type { NumberInputValueChangeDetails } from '@/components/elements/number-input';
import type { SliderValueChangeDetails } from '@/components/elements/slider';

type RangeConfig = {
  /** 範囲の初期最小値 */
  initialMin: number;
  /** 範囲の初期最大値 */
  initialMax: number;
  /** フォームの最小値フィールドに値をセットする関数 */
  setMinValue: (value: number) => void;
  /** フォームの最大値フィールドに値をセットする関数 */
  setMaxValue: (value: number) => void;
};

/**
 * スライダーとNumberInputを連動させるカスタムフック
 *
 * ローカルの range state とフォームの値を同期する
 */
export const useRangeInputs = (config: RangeConfig) => {
  const { initialMin, initialMax, setMinValue, setMaxValue } = config;

  const [range, setRange] = useState<[number, number]>([
    initialMin,
    initialMax,
  ]);

  const handleSliderChange = (details: SliderValueChangeDetails) => {
    const [min, max] = details.value;
    setRange([min ?? initialMin, max ?? initialMax]);
    setMinValue(min ?? initialMin);
    setMaxValue(max ?? initialMax);
  };

  const handleMinChange = (details: NumberInputValueChangeDetails) => {
    const val = details.valueAsNumber;
    if (!Number.isNaN(val)) {
      setRange([val, range[1]]);
      setMinValue(val);
    }
  };

  const handleMaxChange = (details: NumberInputValueChangeDetails) => {
    const val = details.valueAsNumber;
    if (!Number.isNaN(val)) {
      setRange([range[0], val]);
      setMaxValue(val);
    }
  };

  return {
    range,
    handleSliderChange,
    handleMinChange,
    handleMaxChange,
  };
};
