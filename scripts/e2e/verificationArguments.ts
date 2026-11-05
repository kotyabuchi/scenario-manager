/** 全件commandとの互換性を保ち、差分検査には比較元を明示させる。 */
export const parseVerificationArguments = (args: string[]) => {
  let base: string | undefined;
  let changed = false;
  let all = false;
  let shadow = true;
  const seen = new Set<string>();
  for (let index = 0; index < args.length; index++) {
    const arg = args[index];
    if (!arg || seen.has(arg)) throw new Error('検証引数が重複しています。');
    seen.add(arg);
    if (arg === '--all') all = true;
    else if (arg === '--changed') changed = true;
    else if (arg === '--no-shadow') shadow = false;
    else if (arg === '--base') {
      const value = args[++index];
      if (!value || value.startsWith('-'))
        throw new Error('比較baseが必要です。');
      base = value;
      changed = true;
    } else
      throw new Error(
        '使用法: run.ts [--all] [--changed] [--base <ref>] [--no-shadow]',
      );
  }
  if (!changed && !shadow)
    throw new Error('--no-shadowは差分検査とともに指定してください。');
  return { changed, forceFull: all, shadow, ...(base ? { base } : {}) };
};
