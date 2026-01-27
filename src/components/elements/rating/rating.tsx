'use client';

import { useState } from 'react';
import { Star } from 'lucide-react';

import * as styles from './styles';

export type RatingProps = {
  /**
   * 現在の値
   * @default 0
   */
  value?: number;

  /**
   * 最大値
   * @default 5
   */
  max?: number;

  /**
   * 値が変更された時のコールバック
   */
  onValueChange?: (value: number) => void;

  /**
   * 読み取り専用
   * @default false
   */
  readOnly?: boolean;

  /**
   * サイズ
   * @default 'md'
   */
  size?: 'sm' | 'md' | 'lg';

  /**
   * 0.5刻みを許可
   * @default false
   */
  allowHalf?: boolean;

  /**
   * 追加のクラス名
   */
  className?: string;
};

/**
 * 評価コンポーネント
 *
 * 星アイコンで評価を表示・入力する。
 *
 * @example
 * // 表示のみ
 * <Rating value={4} readOnly />
 *
 * @example
 * // インタラクティブ
 * const [value, setValue] = useState(0);
 * <Rating value={value} onValueChange={setValue} />
 */
export const Rating = ({
  value = 0,
  max = 5,
  onValueChange,
  readOnly = false,
  size = 'md',
  className,
}: RatingProps) => {
  const [hoverValue, setHoverValue] = useState<number | null>(null);
  const { iconSize, gap } = styles.sizeMap[size];

  const displayValue = hoverValue ?? value;

  const handleClick = (index: number) => {
    if (readOnly) return;
    onValueChange?.(index + 1);
  };

  const handleMouseEnter = (index: number) => {
    if (readOnly) return;
    setHoverValue(index + 1);
  };

  const handleMouseLeave = () => {
    setHoverValue(null);
  };

  return (
    <div
      role="radiogroup"
      aria-label="評価"
      aria-valuenow={value}
      aria-valuemin={0}
      aria-valuemax={max}
      className={`${styles.ratingRoot} ${className ?? ''}`}
      style={{ gap }}
      onMouseLeave={handleMouseLeave}
    >
      {Array.from({ length: max }).map((_, index) => {
        const isFilled = index < displayValue;

        return (
          <button
            key={index}
            type="button"
            onClick={() => handleClick(index)}
            onMouseEnter={() => handleMouseEnter(index)}
            disabled={readOnly}
            aria-label={`${index + 1}つ星`}
            className={styles.ratingButton}
          >
            <Star
              size={iconSize}
              fill={isFilled ? styles.colors.filled : 'none'}
              stroke={isFilled ? styles.colors.filled : styles.colors.empty}
              strokeWidth={2}
            />
          </button>
        );
      })}
    </div>
  );
};
