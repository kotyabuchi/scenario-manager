import { defineTokens } from '@pandacss/dev';

export const zIndex = defineTokens.zIndex({
  /** 基本レイヤー */
  base: { value: 0 },
  /** 粘着要素（sticky header等） */
  sticky: { value: 100 },
  /** ドロップダウン、ポップオーバー、セレクト等 */
  dropdown: { value: 1000 },
  /** 固定要素（FAB等） */
  fixed: { value: 1100 },
  /** オーバーレイ背景 */
  overlay: { value: 1200 },
  /** モーダル、ダイアログ */
  modal: { value: 1300 },
  /** トースト通知 */
  toast: { value: 1400 },
  /** ツールチップ（最上位） */
  tooltip: { value: 1500 },
});
