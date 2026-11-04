import { isNil } from 'ramda';

import { baselineSchema, checkBaseline, serializeBaseline } from './baseline';
import { serializeInventory } from './inventory';
import { parseArtifact, readArtifact, writeArtifact } from './ledgerArtifacts';
import { ARTIFACTS, baselineDigest, collectStaticState } from './staticGate';

import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

/** bootstrapは一度だけ。不足の新規追加は通常の明示的更新でも認めない。 */
export const refreshLedger = async (
  root: string,
  mode: 'bootstrap' | 'update',
) => {
  const previous = readArtifact(root, ARTIFACTS.baseline);
  if (mode === 'bootstrap' && !isNil(previous))
    throw new Error('baselineは既に存在します。bootstrapで上書きできません');
  if (mode === 'update' && isNil(previous))
    throw new Error('初回は専用のe2e:ledger:bootstrapを実行してください');
  const state = await collectStaticState(root);
  if (!isNil(previous)) {
    const issues = checkBaseline({
      base: baselineSchema.parse(parseArtifact(previous, ARTIFACTS.baseline)),
      head: state.baseline,
      current: state.baseline.items,
    });
    if (issues.length)
      throw new Error(
        `不足を増やす更新はできません: ${JSON.stringify(issues)}`,
      );
  }
  // すべての検証が終わってから保存する。これは検査合格やレビュー承認ではない。
  writeArtifact(root, ARTIFACTS.inventory, serializeInventory(state.inventory));
  writeArtifact(
    root,
    ARTIFACTS.legacy,
    `${JSON.stringify(state.legacy, null, 2)}\n`,
  );
  writeArtifact(root, ARTIFACTS.baseline, serializeBaseline(state.baseline));
  if (isNil(readArtifact(root, ARTIFACTS.migrations)))
    writeArtifact(
      root,
      ARTIFACTS.migrations,
      `${JSON.stringify({ schemaVersion: 1, entries: [] }, null, 2)}\n`,
    );
  return {
    mode,
    pendingItems: state.baseline.items.length,
    baselineDigest: baselineDigest(state.baseline),
    reviewRequired: mode === 'bootstrap',
  };
};

if (
  process.argv[1] &&
  resolve(process.argv[1]) === fileURLToPath(import.meta.url)
) {
  const args = process.argv.slice(2);
  const mode = args[0];
  if (args.length !== 1 || (mode !== 'bootstrap' && mode !== 'update')) {
    process.stderr.write('使用法: ledgerRefresh.ts bootstrap|update\n');
    process.exitCode = 1;
  } else {
    refreshLedger(process.cwd(), mode)
      .then((result) => process.stdout.write(`${JSON.stringify(result)}\n`))
      .catch((error: unknown) => {
        process.stderr.write(
          `${error instanceof Error ? error.message : '台帳の更新に失敗しました'}\n`,
        );
        process.exitCode = 1;
      });
  }
}
