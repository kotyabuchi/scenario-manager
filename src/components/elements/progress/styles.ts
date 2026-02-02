import { css } from '@/styled-system/css';

/**
 * バー形式のルートスタイル
 */
export const progressBarRoot = css({
  w: 'full',
});

/**
 * ラベル行スタイル
 */
export const progressLabel = css({
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  mb: '1',
});

/**
 * ラベルテキストスタイル
 */
export const progressLabelText = css({
  fontSize: '[13px]',
  color: 'gray.700',
});

/**
 * 値テキストスタイル
 */
export const progressValueText = css({
  fontSize: '[13px]',
  fontWeight: 'medium',
  color: 'primary.500',
});

/**
 * トラックスタイル
 */
export const progressTrack = css({
  w: 'full',
  h: '2',
  bg: 'gray.200',
  borderRadius: 'xs',
  overflow: 'hidden',
});

/**
 * フィルスタイル
 */
export const progressFill = css({
  h: 'full',
  bg: 'primary.500',
  borderRadius: 'xs',
  transitionProperty: 'size',
  transitionDuration: 'slow',
  transitionTimingFunction: 'ease-in-out',
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
  borderRadius: 'full',
  bg: 'gray.200',
});

/**
 * サークル内側スタイル
 */
export const progressCircleInner = css({
  position: 'absolute',
  borderRadius: 'full',
  bg: 'white',
});

/**
 * サークル値テキストスタイル
 */
export const progressCircleValue = css({
  position: 'relative',
  color: 'primary.500',
  fontWeight: 'semibold',
});

/**
 * サイズマップ
 */
export const circleSizeMap = {
  sm: { outer: 48, inner: 40, fontSize: '[12px]' },
  md: { outer: 64, inner: 56, fontSize: '[14px]' },
  lg: { outer: 80, inner: 72, fontSize: '[16px]' },
} as const;
