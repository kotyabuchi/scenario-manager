import { css } from '@/styled-system/css';

/**
 * バー形式のルートスタイル
 */
export const progressBarRoot = css({
  w: '100%',
});

/**
 * ラベル行スタイル
 */
export const progressLabel = css({
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  mb: '4px',
});

/**
 * ラベルテキストスタイル
 */
export const progressLabelText = css({
  fontSize: '13px',
  color: '#374151',
});

/**
 * 値テキストスタイル
 */
export const progressValueText = css({
  fontSize: '13px',
  fontWeight: 500,
  color: '#10B981',
});

/**
 * トラックスタイル
 */
export const progressTrack = css({
  w: '100%',
  h: '8px',
  bg: '#E5E7EB',
  borderRadius: '4px',
  overflow: 'hidden',
});

/**
 * フィルスタイル
 */
export const progressFill = css({
  h: '100%',
  bg: '#10B981',
  borderRadius: '4px',
  transition: 'width 0.3s ease',
});

/**
 * サークル形式のルートスタイル
 */
export const progressCircleRoot = css({
  position: 'relative',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
});

/**
 * サークル背景スタイル
 */
export const progressCircleBg = css({
  position: 'absolute',
  borderRadius: '50%',
  bg: '#E5E7EB',
});

/**
 * サークル内側スタイル
 */
export const progressCircleInner = css({
  position: 'absolute',
  borderRadius: '50%',
  bg: 'white',
});

/**
 * サークル値テキストスタイル
 */
export const progressCircleValue = css({
  position: 'relative',
  color: '#10B981',
  fontWeight: 600,
});

/**
 * サイズマップ
 */
export const circleSizeMap = {
  sm: { outer: 48, inner: 40, fontSize: '12px' },
  md: { outer: 64, inner: 56, fontSize: '14px' },
  lg: { outer: 80, inner: 72, fontSize: '16px' },
} as const;
