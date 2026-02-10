'use client';

import {
  Slider as ArkSlider,
  type SliderRootProps,
  type SliderValueChangeDetails,
  useSliderContext,
} from '@ark-ui/react/slider';
import { isNil } from 'ramda';

import * as styles from './styles';

type SliderMarker = {
  value: number;
  label?: string;
};

type SliderProps = {
  /** 現在の値（配列形式） */
  value?: number[];
  /** デフォルト値 */
  defaultValue?: number[];
  /** 値変更時のコールバック */
  onValueChange?: (details: SliderValueChangeDetails) => void;
  /** 最小値 */
  min?: number;
  /** 最大値 */
  max?: number;
  /** ステップ値 */
  step?: number;
  /** ラベル（表示用） */
  label?: string;
  /** スクリーンリーダー用ラベル（labelが未指定の場合に使用） */
  'aria-label'?: string;
  /** 値を表示 */
  showValue?: boolean;
  /** 値のフォーマット関数 */
  formatValue?: (value: number) => string;
  /** マーカー */
  markers?: SliderMarker[];
  /** 無効状態 */
  disabled?: boolean;
  /** 入力要素の名前 */
  name?: string;
  /** 範囲スライダー（2つのサム） */
  range?: boolean;
  /** 最小値ラベル（スライダー上部左側に表示） */
  minLabel?: string;
  /** 最大値ラベル（スライダー上部右側に表示） */
  maxLabel?: string;
} & Omit<SliderRootProps, 'value' | 'onValueChange' | 'aria-label'>;

// 固定のthumb識別子（indexをkeyとして使用するのを避けるため）
const THUMB_IDS = ['thumb-first', 'thumb-second'] as const;

// 値表示用の内部コンポーネント
const SliderValueDisplay = ({
  range,
  formatValue,
}: {
  range: boolean;
  formatValue: (value: number) => string;
}) => {
  const context = useSliderContext();
  const firstValue = context.value[0] ?? 0;
  const secondValue = context.value[1] ?? 0;
  const displayValue = range
    ? `${formatValue(firstValue)} ～ ${formatValue(secondValue)}`
    : formatValue(firstValue);

  return <span className={styles.slider_output}>{displayValue}</span>;
};

/**
 * スライダーコンポーネント
 *
 * Ark UI Sliderをベースに、プロジェクトのデザインシステムに合わせてスタイリング。
 * 単一値スライダーと範囲スライダーの両方に対応。
 *
 * ## レイアウト構造
 * 1. ラベル（label）
 * 2. 範囲テキスト（minLabel / maxLabel）- スライダー上部に左右配置
 * 3. スライダートラック
 * 4. 選択値表示（showValue）- スライダー下部に中央配置
 *
 * @example
 * // 基本的な使用法
 * <Slider
 *   value={[50]}
 *   onValueChange={(details) => setValue(details.value)}
 *   min={0}
 *   max={100}
 *   label="音量"
 *   showValue
 * />
 *
 * @example
 * // 範囲スライダー
 * <Slider
 *   value={[20, 80]}
 *   onValueChange={(details) => setRange(details.value)}
 *   range
 *   min={0}
 *   max={100}
 * />
 *
 * @example
 * // 範囲テキスト付きスライダー（検索条件向け）
 * <Slider
 *   label="プレイ人数"
 *   value={[2, 6]}
 *   onValueChange={(details) => setPlayerCount(details.value)}
 *   min={1}
 *   max={10}
 *   step={1}
 *   range
 *   showValue
 *   formatValue={(v) => `${v}人`}
 *   minLabel="1人"
 *   maxLabel="10人+"
 * />
 */

export const Slider = ({
  value,
  defaultValue,
  onValueChange,
  min = 0,
  max = 100,
  step = 1,
  label,
  'aria-label': ariaLabel,
  showValue = false,
  formatValue = (v) => String(v),
  markers,
  disabled,
  name,
  range = false,
  minLabel,
  maxLabel,
  ...rest
}: SliderProps) => {
  const thumbIds = range ? THUMB_IDS : [THUMB_IDS[0]];
  const initialValue = defaultValue ?? (range ? [min, max] : [min]);
  const hasRangeLabels = !isNil(minLabel) || !isNil(maxLabel);

  return (
    <ArkSlider.Root
      value={value}
      defaultValue={initialValue}
      onValueChange={onValueChange}
      min={min}
      max={max}
      step={step}
      disabled={disabled}
      name={name}
      className={styles.slider_root}
      {...rest}
    >
      <ArkSlider.Label
        className={label ? styles.slider_label : styles.slider_labelHidden}
      >
        {label ?? ariaLabel ?? 'スライダー'}
      </ArkSlider.Label>
      {hasRangeLabels && (
        <div className={styles.slider_rangeLabels}>
          <span className={styles.slider_rangeLabel}>{minLabel}</span>
          <span className={styles.slider_rangeLabel}>{maxLabel}</span>
        </div>
      )}
      <ArkSlider.Control className={styles.slider_control}>
        <ArkSlider.Track className={styles.slider_track}>
          <ArkSlider.Range className={styles.slider_range} />
        </ArkSlider.Track>
        {thumbIds.map((thumbId, index) => (
          <ArkSlider.Thumb
            key={thumbId}
            index={index}
            className={styles.slider_thumb}
          >
            <ArkSlider.HiddenInput />
          </ArkSlider.Thumb>
        ))}
      </ArkSlider.Control>
      {showValue && (
        <div className={styles.slider_valueContainer}>
          <SliderValueDisplay range={range} formatValue={formatValue} />
        </div>
      )}
      {!isNil(markers) && markers.length > 0 && (
        <ArkSlider.MarkerGroup className={styles.slider_markerGroup}>
          {markers.map((marker) => (
            <ArkSlider.Marker
              key={marker.value}
              value={marker.value}
              className={styles.slider_marker}
            >
              {marker.label ?? marker.value}
            </ArkSlider.Marker>
          ))}
        </ArkSlider.MarkerGroup>
      )}
    </ArkSlider.Root>
  );
};

export type { SliderProps, SliderMarker, SliderValueChangeDetails };
