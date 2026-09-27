/**
 * カラーパレットの生データ（OKLCH）
 *
 * ビルドツール非依存の純データ。`colors.ts`（PandaCSS の defineTokens）と
 * Storybook のカラー一覧ストーリーの**単一ソース**として共有する。
 *
 * 設計: 全ファミリーで同一の L/C ランプを共有し、色相(H)だけ変える同一トーン。
 * 詳細・ランプ値は colors.ts のヘッダコメントを参照。
 */
export const colorValues = {
  white: { value: 'oklch(1 0 0)' },

  // Canvas（ページ背景。ごく淡い緑みの白）
  canvas: { value: 'oklch(0.975 0.004 150)' },

  // Paper（カード・パネル面。純白ではなく僅かに緑みのある白。モック実測 #FAFBF6〜#FBFCF9）
  paper: { value: 'oklch(0.988 0.005 120)' },

  // Paper border（カード面用の緑みグレーのボーダー。grayと同一Lランプ・色相のみ緑。
  // モックのボックス枠実測 ≈ oklch(0.94 0.006-0.007 120)）
  paperBorder: {
    50: { value: 'oklch(0.965 0.006 120)' },
    100: { value: 'oklch(0.935 0.009 120)' },
    200: { value: 'oklch(0.875 0.012 120)' },
  },

  // Light green surface（ほぼ白の極淡グリーン。モックのボックス内側相当。
  // 通常の green スケール=primary.50 より淡く、ボックス背景/枠に使う）
  lightGreen: {
    bg: { value: 'oklch(0.985 0.010 148)' },
    border: { value: 'oklch(0.930 0.022 148)' },
  },

  // Gray（H=265・極小彩度の青みグレー）
  gray: {
    50: { value: 'oklch(0.965 0.003 265)' },
    100: { value: 'oklch(0.935 0.006 265)' },
    200: { value: 'oklch(0.875 0.010 265)' },
    300: { value: 'oklch(0.805 0.014 265)' },
    400: { value: 'oklch(0.740 0.017 265)' },
    500: { value: 'oklch(0.674 0.019 265)' },
    600: { value: 'oklch(0.585 0.017 265)' },
    700: { value: 'oklch(0.490 0.015 265)' },
    800: { value: 'oklch(0.400 0.012 265)' },
    900: { value: 'oklch(0.315 0.008 265)' },
  },

  // Yellow（H=90）
  yellow: {
    50: { value: 'oklch(0.965 0.018 90)' },
    100: { value: 'oklch(0.935 0.032 90)' },
    200: { value: 'oklch(0.875 0.055 90)' },
    300: { value: 'oklch(0.805 0.075 90)' },
    400: { value: 'oklch(0.740 0.092 90)' },
    500: { value: 'oklch(0.674 0.103 90)' },
    600: { value: 'oklch(0.585 0.097 90)' },
    700: { value: 'oklch(0.490 0.082 90)' },
    800: { value: 'oklch(0.400 0.064 90)' },
    900: { value: 'oklch(0.315 0.046 90)' },
    // モーダル案の鮮やかな電球色（#FACC15 相当）。通常の同一トーンランプとは別のアクセント。
    vivid: { value: 'oklch(0.861 0.173 92)' },
  },

  // Green: ブランドグリーン（基準。500=#68A872 相当・H=148）。semantic の primary が参照
  green: {
    50: { value: 'oklch(0.965 0.018 148)' },
    100: { value: 'oklch(0.935 0.032 148)' },
    200: { value: 'oklch(0.875 0.055 148)' },
    300: { value: 'oklch(0.805 0.075 148)' },
    400: { value: 'oklch(0.740 0.092 148)' },
    500: { value: 'oklch(0.674 0.103 148)' },
    600: { value: 'oklch(0.585 0.097 148)' },
    700: { value: 'oklch(0.490 0.082 148)' },
    800: { value: 'oklch(0.400 0.064 148)' },
    900: { value: 'oklch(0.315 0.046 148)' },
  },

  // Red（H=20）
  red: {
    50: { value: 'oklch(0.965 0.018 20)' },
    100: { value: 'oklch(0.935 0.032 20)' },
    200: { value: 'oklch(0.875 0.055 20)' },
    300: { value: 'oklch(0.805 0.075 20)' },
    400: { value: 'oklch(0.740 0.092 20)' },
    500: { value: 'oklch(0.674 0.103 20)' },
    600: { value: 'oklch(0.585 0.097 20)' },
    700: { value: 'oklch(0.490 0.082 20)' },
    800: { value: 'oklch(0.400 0.064 20)' },
    900: { value: 'oklch(0.315 0.046 20)' },
  },

  // Orange（H=62）
  orange: {
    50: { value: 'oklch(0.965 0.018 62)' },
    100: { value: 'oklch(0.935 0.032 62)' },
    200: { value: 'oklch(0.875 0.055 62)' },
    300: { value: 'oklch(0.805 0.075 62)' },
    400: { value: 'oklch(0.740 0.092 62)' },
    500: { value: 'oklch(0.674 0.103 62)' },
    600: { value: 'oklch(0.585 0.097 62)' },
    700: { value: 'oklch(0.490 0.082 62)' },
    800: { value: 'oklch(0.400 0.064 62)' },
    900: { value: 'oklch(0.315 0.046 62)' },
  },

  // Blue（H=245）
  blue: {
    50: { value: 'oklch(0.965 0.018 245)' },
    100: { value: 'oklch(0.935 0.032 245)' },
    200: { value: 'oklch(0.875 0.055 245)' },
    300: { value: 'oklch(0.805 0.075 245)' },
    400: { value: 'oklch(0.740 0.092 245)' },
    500: { value: 'oklch(0.674 0.103 245)' },
    600: { value: 'oklch(0.585 0.097 245)' },
    700: { value: 'oklch(0.490 0.082 245)' },
    800: { value: 'oklch(0.400 0.064 245)' },
    900: { value: 'oklch(0.315 0.046 245)' },
  },

  // Info（H=255）
  info: {
    50: { value: 'oklch(0.965 0.018 255)' },
    100: { value: 'oklch(0.935 0.032 255)' },
    200: { value: 'oklch(0.875 0.055 255)' },
    300: { value: 'oklch(0.805 0.075 255)' },
    400: { value: 'oklch(0.740 0.092 255)' },
    500: { value: 'oklch(0.674 0.103 255)' },
    600: { value: 'oklch(0.585 0.097 255)' },
    700: { value: 'oklch(0.490 0.082 255)' },
    800: { value: 'oklch(0.400 0.064 255)' },
    900: { value: 'oklch(0.315 0.046 255)' },
  },

  // Indigo（H=282）
  indigo: {
    50: { value: 'oklch(0.965 0.018 282)' },
    100: { value: 'oklch(0.935 0.032 282)' },
    200: { value: 'oklch(0.875 0.055 282)' },
    300: { value: 'oklch(0.805 0.075 282)' },
    400: { value: 'oklch(0.740 0.092 282)' },
    500: { value: 'oklch(0.674 0.103 282)' },
    600: { value: 'oklch(0.585 0.097 282)' },
    700: { value: 'oklch(0.490 0.082 282)' },
    800: { value: 'oklch(0.400 0.064 282)' },
    900: { value: 'oklch(0.315 0.046 282)' },
  },

  // Purple（H=312）
  purple: {
    50: { value: 'oklch(0.965 0.018 312)' },
    100: { value: 'oklch(0.935 0.032 312)' },
    200: { value: 'oklch(0.875 0.055 312)' },
    300: { value: 'oklch(0.805 0.075 312)' },
    400: { value: 'oklch(0.740 0.092 312)' },
    500: { value: 'oklch(0.674 0.103 312)' },
    600: { value: 'oklch(0.585 0.097 312)' },
    700: { value: 'oklch(0.490 0.082 312)' },
    800: { value: 'oklch(0.400 0.064 312)' },
    900: { value: 'oklch(0.315 0.046 312)' },
  },

  // Pink（H=352）
  pink: {
    50: { value: 'oklch(0.965 0.018 352)' },
    100: { value: 'oklch(0.935 0.032 352)' },
    200: { value: 'oklch(0.875 0.055 352)' },
    300: { value: 'oklch(0.805 0.075 352)' },
    400: { value: 'oklch(0.740 0.092 352)' },
    500: { value: 'oklch(0.674 0.103 352)' },
    600: { value: 'oklch(0.585 0.097 352)' },
    700: { value: 'oklch(0.490 0.082 352)' },
    800: { value: 'oklch(0.400 0.064 352)' },
    900: { value: 'oklch(0.315 0.046 352)' },
  },

  // Overlay（黒のアルファ）
  overlay: {
    4: { value: 'oklch(0 0 0 / 0.04)' },
    5: { value: 'oklch(0 0 0 / 0.05)' },
    6: { value: 'oklch(0 0 0 / 0.06)' },
    8: { value: 'oklch(0 0 0 / 0.08)' },
    10: { value: 'oklch(0 0 0 / 0.10)' },
    12: { value: 'oklch(0 0 0 / 0.12)' },
    15: { value: 'oklch(0 0 0 / 0.15)' },
    19: { value: 'oklch(0 0 0 / 0.19)' },
    20: { value: 'oklch(0 0 0 / 0.20)' },
    25: { value: 'oklch(0 0 0 / 0.25)' },
    30: { value: 'oklch(0 0 0 / 0.30)' },
    40: { value: 'oklch(0 0 0 / 0.40)' },
    60: { value: 'oklch(0 0 0 / 0.60)' },
  },

  // White overlay（白のアルファ。暗背景上のガラス/オーバーレイ）
  whiteA: {
    10: { value: 'oklch(1 0 0 / 0.10)' },
    20: { value: 'oklch(1 0 0 / 0.20)' },
    85: { value: 'oklch(1 0 0 / 0.85)' },
    90: { value: 'oklch(1 0 0 / 0.90)' },
  },

  // Green shadow（green.500 のアルファ。semantic では primary 影として参照）
  greenShadow: {
    19: { value: 'oklch(0.674 0.103 148 / 0.19)' },
    25: { value: 'oklch(0.674 0.103 148 / 0.25)' },
    30: { value: 'oklch(0.674 0.103 148 / 0.30)' },
  },

  // Green soft shadow（低彩度・やや暗めの緑。黒でなく緑寄りのカード/パネル影に使う。
  // green.500 影より彩度を落とし、面の影を統一した緑トーンにするための色）
  greenShadowSoft: {
    12: { value: 'oklch(0.55 0.06 148 / 0.12)' },
    18: { value: 'oklch(0.55 0.06 148 / 0.18)' },
  },

  // Red shadow（red.500 のアルファ）
  redShadow: {
    25: { value: 'oklch(0.674 0.103 20 / 0.25)' },
  },
} as const;
