import { defineTokens } from '@pandacss/dev';

import { colorValues } from './colorValues';

/**
 * カラーパレット（OKLCH 直書き）
 *
 * 値の実体は `./colorValues.ts`（ビルドツール非依存の純データ）に分離し、
 * Storybook のカラー一覧ストーリーと**単一ソース**を共有する。
 *
 * 全ファミリーで **同一の明度(L)・彩度(C)ランプ**を共有し、**色相(H)だけ**を変える。
 * これにより全色が同じ「明るさ・くすみ（トーン）」で揃う（OKLCH は知覚的に均一）。
 * ガマット外の値はブラウザが CSS Color 4 のガマットマッピングで吸収する。
 *
 * ステップ:  50    100   200   300   400   500   600   700   800   900
 *   L(明度): .965  .935  .875  .805  .740  .674  .585  .490  .400  .315
 *   C(彩度): .018  .032  .055  .075  .092  .103  .097  .082  .064  .046
 *
 * 基準は green.500 = oklch(0.674 0.103 148)（モックの「シナリオ登録」ボタン #68A872）。
 * ブランド色は green。semantic 側で primary → green を別名定義する（base は色相名のみ）。
 * モックの高彩度な電球色 yellow.vivid のみ、共通ランプとは別のアクセント。
 * 色相(H): red 20 / orange 62 / yellow 90 / green 148 / blue 245 / info 255 /
 *          indigo 282 / purple 312 / pink 352 / gray 265(極小彩度の青みグレー)
 *
 * 注: コントラスト比は厳守しない方針（ブランドの色味を優先したユーザー判断）。
 */
export const colors = defineTokens.colors(colorValues);
