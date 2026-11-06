import { isNil } from 'ramda';

/**
 * タグの動的カラー（DB管理）。
 *
 * `tags.color` には基準色を OKLCH 文字列（例: `oklch(0.65 0.15 350)`）で保存する。
 * OKLCH は知覚的に均一なため、明度(L)を振るだけで「淡い背景 + 濃い文字」を
 * 同色相で導出でき、タグが何色増えてもコントラストを構造的に担保できる。
 *
 * 静的トークン（HEX）とは別系統の「データ駆動の動的色」であり、
 * CSS 変数経由で適用する（詳細は docs/redegins/design-direction.md）。
 */

export type TagColors = {
  /** 淡い背景色 */
  bg: string;
  /** 濃い文字色 */
  text: string;
};

type Oklch = { l: number; c: number; h: number };

// 数値部分は厳密にマッチ（`1..2` 等の不正値を弾く）
const OKLCH_RE =
  /^oklch\(\s*((?:\d+(?:\.\d+)?|\.\d+)%?)\s+(\d+(?:\.\d+)?|\.\d+)\s+(\d+(?:\.\d+)?|\.\d+)(?:deg)?\s*(?:\/\s*(?:\d+(?:\.\d+)?|\.\d+)%?\s*)?\)$/i;

const clamp = (value: number, min: number, max: number): number =>
  Math.min(max, Math.max(min, value));

/**
 * `oklch(L C H)` 文字列をパースする。L は 0-1 または % を受け付ける。
 * 不正な値は null を返す。
 */
export const parseOklch = (value: string): Oklch | null => {
  const matched = OKLCH_RE.exec(value.trim());
  if (isNil(matched)) return null;

  const [, lRaw, cRaw, hRaw] = matched;
  if (isNil(lRaw) || isNil(cRaw) || isNil(hRaw)) return null;

  const l = lRaw.endsWith('%')
    ? Number.parseFloat(lRaw) / 100
    : Number.parseFloat(lRaw);
  const c = Number.parseFloat(cRaw);
  const h = Number.parseFloat(hRaw);

  if ([l, c, h].some(Number.isNaN)) return null;
  return { l, c, h };
};

/**
 * 基準色（OKLCH 文字列）から、タグ表示用の背景色・文字色を導出する。
 * 不正・未設定の場合は null（呼び出し側でグレーにフォールバック）。
 */
export const deriveTagColors = (
  value: string | null | undefined,
): TagColors | null => {
  if (isNil(value) || value === '') return null;

  const parsed = parseOklch(value);
  if (isNil(parsed)) return null;

  const { c, h } = parsed;
  // 背景: 高明度・低彩度の淡いティント
  const bg = `oklch(0.96 ${clamp(c, 0, 0.045).toFixed(3)} ${h})`;
  // 文字: 低明度・中彩度の濃色。同色相で大きな ΔL を取り視認性を確保する。
  // 注: WCAG コントラストは sRGB 相対輝度基準のため、極端な高彩度色相では
  // 4.5:1 を満たさない可能性がある（将来、実コントラスト検証で L を補正する余地あり）。
  const text = `oklch(0.42 ${clamp(c + 0.02, 0, 0.14).toFixed(3)} ${h})`;

  return { bg, text };
};
