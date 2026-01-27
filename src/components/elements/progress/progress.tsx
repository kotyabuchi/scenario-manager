'use client';

import * as styles from './styles';

export type ProgressProps = {
  /**
   * 現在の値
   * @default 0
   */
  value?: number;

  /**
   * 最大値
   * @default 100
   */
  max?: number;

  /**
   * 表示形式
   * @default 'bar'
   */
  variant?: 'bar' | 'circle';

  /**
   * 値を表示するか
   * @default true
   */
  showValue?: boolean;

  /**
   * ラベル
   */
  label?: string;

  /**
   * サイズ（circle形式のみ）
   * @default 'md'
   */
  size?: 'sm' | 'md' | 'lg';

  /**
   * 追加のクラス名
   */
  className?: string;
};

/**
 * プログレスコンポーネント
 *
 * 進捗状況を視覚的に表示する。
 *
 * @example
 * // バー形式
 * <Progress value={65} label="Progress" />
 *
 * @example
 * // サークル形式
 * <Progress value={65} variant="circle" />
 */
export const Progress = ({
  value = 0,
  max = 100,
  variant = 'bar',
  showValue = true,
  label,
  size = 'md',
  className,
}: ProgressProps) => {
  const percentage = Math.min(100, Math.max(0, (value / max) * 100));

  if (variant === 'circle') {
    const { outer, inner, fontSize } = styles.circleSizeMap[size];

    return (
      <div
        role="progressbar"
        aria-valuenow={value}
        aria-valuemin={0}
        aria-valuemax={max}
        aria-label={label || '進捗'}
        className={`${styles.progressCircleRoot} ${className ?? ''}`}
        style={{ width: outer, height: outer }}
      >
        {/* Background circle */}
        <div
          className={styles.progressCircleBg}
          style={{ width: outer, height: outer }}
        />
        {/* Inner white circle */}
        <div
          className={styles.progressCircleInner}
          style={{ width: inner, height: inner }}
        />
        {/* Value */}
        {showValue && (
          <span className={styles.progressCircleValue} style={{ fontSize }}>
            {Math.round(percentage)}%
          </span>
        )}
      </div>
    );
  }

  return (
    <div
      role="progressbar"
      aria-valuenow={value}
      aria-valuemin={0}
      aria-valuemax={max}
      aria-label={label || '進捗'}
      className={`${styles.progressBarRoot} ${className ?? ''}`}
    >
      {/* Label row */}
      {(label || showValue) && (
        <div className={styles.progressLabel}>
          {label && <span className={styles.progressLabelText}>{label}</span>}
          {showValue && (
            <span className={styles.progressValueText}>
              {Math.round(percentage)}%
            </span>
          )}
        </div>
      )}
      {/* Track */}
      <div className={styles.progressTrack}>
        {/* Fill */}
        <div
          className={styles.progressFill}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
};
