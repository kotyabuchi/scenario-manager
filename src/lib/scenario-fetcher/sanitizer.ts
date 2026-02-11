/**
 * パーサー出力のサニタイズ処理（XSS対策）
 * HTMLタグ・制御文字を除去し、安全な文字列を返す
 */
export const sanitizeText = (input: string): string => {
  return (
    input
      // HTMLタグを除去
      .replace(/<[^>]*>/g, '')
      // HTML エンティティをデコード
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&#039;/g, "'")
      .replace(/&nbsp;/g, ' ')
      // デコード後に再度タグ除去（ダブルエンコード対策）
      .replace(/<[^>]*>/g, '')
      // 制御文字を除去（改行・タブ以外）
      // biome-ignore lint/suspicious/noControlCharactersInRegex: サニタイザーのため意図的に制御文字を指定
      .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '')
      // 前後の空白を除去
      .trim()
  );
};

/**
 * 数値のサニタイズ
 * NaN, Infinity, 負数を排除し、正の整数のみ返す
 */
export const sanitizePositiveInt = (input: number): number | null => {
  if (!Number.isFinite(input) || input < 0) {
    return null;
  }
  return Math.round(input);
};
