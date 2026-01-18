import { defineTokens } from '@pandacss/dev';

export const colors = defineTokens.colors({
  // Primary: 緑系（色相145°）
  primary: {
    50: { value: 'oklch(0.97 0.03 145)' },
    100: { value: 'oklch(0.94 0.06 145)' },
    200: { value: 'oklch(0.88 0.09 145)' },
    300: { value: 'oklch(0.82 0.11 145)' },
    400: { value: 'oklch(0.76 0.13 145)' },
    500: { value: 'oklch(0.70 0.14 145)' },
    600: { value: 'oklch(0.62 0.13 145)' },
    700: { value: 'oklch(0.52 0.11 145)' },
    800: { value: 'oklch(0.42 0.09 145)' },
    900: { value: 'oklch(0.32 0.07 145)' },
    950: { value: 'oklch(0.22 0.05 145)' },
  },

  // Success: ティールグリーン系（色相160°）- primaryと区別
  success: {
    50: { value: 'oklch(0.97 0.03 160)' },
    100: { value: 'oklch(0.94 0.06 160)' },
    200: { value: 'oklch(0.88 0.09 160)' },
    300: { value: 'oklch(0.82 0.11 160)' },
    400: { value: 'oklch(0.76 0.13 160)' },
    500: { value: 'oklch(0.70 0.14 160)' },
    600: { value: 'oklch(0.62 0.13 160)' },
    700: { value: 'oklch(0.52 0.11 160)' },
    800: { value: 'oklch(0.42 0.09 160)' },
    900: { value: 'oklch(0.32 0.07 160)' },
    950: { value: 'oklch(0.22 0.05 160)' },
  },

  // Warning: 黄系（色相90°）- 少し緑寄りのパステルイエロー
  warning: {
    50: { value: 'oklch(0.98 0.04 90)' },
    100: { value: 'oklch(0.95 0.07 90)' },
    200: { value: 'oklch(0.91 0.10 90)' },
    300: { value: 'oklch(0.86 0.12 90)' },
    400: { value: 'oklch(0.82 0.14 90)' },
    500: { value: 'oklch(0.78 0.15 90)' },
    600: { value: 'oklch(0.70 0.14 90)' },
    700: { value: 'oklch(0.60 0.12 90)' },
    800: { value: 'oklch(0.50 0.10 90)' },
    900: { value: 'oklch(0.40 0.08 90)' },
    950: { value: 'oklch(0.30 0.06 90)' },
  },

  // Danger: コーラルピンク系（色相 20°）- 柔らかい赤
  danger: {
    50: { value: 'oklch(0.97 0.03 20)' },
    100: { value: 'oklch(0.94 0.06 20)' },
    200: { value: 'oklch(0.88 0.10 20)' },
    300: { value: 'oklch(0.82 0.13 20)' },
    400: { value: 'oklch(0.75 0.15 20)' },
    500: { value: 'oklch(0.68 0.16 20)' },
    600: { value: 'oklch(0.60 0.15 20)' },
    700: { value: 'oklch(0.50 0.13 20)' },
    800: { value: 'oklch(0.40 0.11 20)' },
    900: { value: 'oklch(0.30 0.09 20)' },
    950: { value: 'oklch(0.22 0.07 20)' },
  },

  // Info: スカイブルー系（色相230°）- パステルブルー
  info: {
    50: { value: 'oklch(0.97 0.02 230)' },
    100: { value: 'oklch(0.94 0.05 230)' },
    200: { value: 'oklch(0.89 0.08 230)' },
    300: { value: 'oklch(0.83 0.10 230)' },
    400: { value: 'oklch(0.77 0.12 230)' },
    500: { value: 'oklch(0.70 0.13 230)' },
    600: { value: 'oklch(0.62 0.12 230)' },
    700: { value: 'oklch(0.52 0.10 230)' },
    800: { value: 'oklch(0.42 0.08 230)' },
    900: { value: 'oklch(0.32 0.06 230)' },
    950: { value: 'oklch(0.22 0.04 230)' },
  },

  // Neutral: グレー系（無彩色に近い）- デフォルトUI用
  neutral: {
    50: { value: 'oklch(0.98 0.005 270)' },
    100: { value: 'oklch(0.96 0.005 270)' },
    200: { value: 'oklch(0.92 0.005 270)' },
    300: { value: 'oklch(0.87 0.005 270)' },
    400: { value: 'oklch(0.70 0.005 270)' },
    500: { value: 'oklch(0.55 0.005 270)' },
    600: { value: 'oklch(0.45 0.005 270)' },
    700: { value: 'oklch(0.37 0.005 270)' },
    800: { value: 'oklch(0.27 0.005 270)' },
    900: { value: 'oklch(0.20 0.005 270)' },
    950: { value: 'oklch(0.14 0.005 270)' },
  },

  // レイヤードUI用の背景色（明度差で階層を表現）
  layer: {
    // 最下層（ページ背景）
    base: { value: 'oklch(0.985 0.008 145)' },
    // 第1層（カード・セクション）
    1: { value: 'oklch(0.995 0.003 145)' },
    // 第2層（ネスト要素・入力フィールド背景）
    2: { value: 'oklch(0.975 0.010 145)' },
    // 第3層（さらにネスト・ホバー状態）
    3: { value: 'oklch(0.960 0.015 145)' },
  },

  // 背景・テキスト・境界
  background: {
    500: { value: 'oklch(0.985 0.008 145)' },
  },
  foreground: {
    500: { value: 'oklch(0.20 0.02 270)' },
  },
  border: {
    500: { value: 'oklch(0.88 0.01 270)' },
  },
  placeholder: {
    500: { value: 'oklch(0.70 0.01 270)' },
  },
  backdrop: {
    500: { value: 'oklch(0.20 0.01 270 / 0.4)' },
  },

  // Discord連携
  discord: {
    default: { value: '#5865F2' },
    hover: { value: '#4752C4' },
  },
});
