import { extractRoutes } from './extractors/routes';
import { inventorySchema } from './inventorySchema';
import { loadSource } from './source';

import { randomUUID } from 'node:crypto';
import {
  existsSync,
  mkdirSync,
  readFileSync,
  realpathSync,
  renameSync,
  rmSync,
  writeFileSync,
} from 'node:fs';
import { dirname, isAbsolute, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import type { Inventory } from './inventorySchema';
import type { SourceContext } from './source';

const DEFAULT_OUTPUT = 'e2e/ledger/inventory.generated.json';

const compare = (left: string, right: string) =>
  left < right ? -1 : left > right ? 1 : 0;

/** 環境のlocaleや呼出順によらないJSONへ正規化する。 */
export const serializeInventory = (input: Inventory) => {
  const inventory = inventorySchema.parse(input);
  inventory.source.files.sort((a, b) => compare(a.path, b.path));
  inventory.nodes.sort((a, b) => compare(a.id, b.id));
  inventory.edges.sort((a, b) => compare(JSON.stringify(a), JSON.stringify(b)));
  inventory.diagnostics.sort((a, b) =>
    compare(JSON.stringify(a), JSON.stringify(b)),
  );
  return `${JSON.stringify(inventory, null, 2)}\n`;
};

/** 解析結果を台帳向けの入口一覧に組み立てる。 */
export const buildInventory = (context: SourceContext): Inventory => {
  const routes = extractRoutes(context.files.map((file) => file.path));
  return inventorySchema.parse({
    schemaVersion: 1,
    extractorVersion: '1',
    source: context.manifest,
    nodes: routes.nodes,
    edges: [],
    diagnostics: [...context.diagnostics, ...routes.diagnostics],
  });
};

/** --checkでは書き換えず、更新時は一時ファイルから置換する。 */
export const saveInventory = (
  root: string,
  output: string,
  inventory: Inventory,
  shouldCheck: boolean,
) => {
  const target = resolve(root, output);
  const localPath = relative(root, target);
  if (!localPath || localPath.startsWith('..') || isAbsolute(localPath)) {
    throw new Error(
      'inventoryの出力先は作業ルート内のファイルにしてください。',
    );
  }
  // 出力先の既存祖先がsymlinkでも、作業ルート外へ書き出さない。
  let ancestor = target;
  while (!existsSync(ancestor)) ancestor = dirname(ancestor);
  const actualPath = relative(realpathSync(root), realpathSync(ancestor));
  if (actualPath.startsWith('..') || isAbsolute(actualPath)) {
    throw new Error(
      'inventoryの出力先はsymlinkを解決した後も作業ルート内にしてください。',
    );
  }
  const serialized = serializeInventory(inventory);
  if (shouldCheck) {
    if (!existsSync(target) || readFileSync(target, 'utf8') !== serialized) {
      throw new Error(
        'inventoryが最新ではありません。更新して差分を確認してください。',
      );
    }
    return;
  }
  mkdirSync(dirname(target), { recursive: true });
  const temporary = `${target}.${randomUUID()}.tmp`;
  try {
    writeFileSync(temporary, serialized, { encoding: 'utf8', flag: 'wx' });
    renameSync(temporary, target);
  } finally {
    rmSync(temporary, { force: true });
  }
};

const main = () => {
  const args = process.argv.slice(2);
  let shouldCheck = false;
  let output = DEFAULT_OUTPUT;
  for (let index = 0; index < args.length; index += 1) {
    const argument = args[index];
    if (argument === '--check') shouldCheck = true;
    else if (argument === '--output' && args[index + 1]) {
      const value = args[index + 1];
      if (!value || value.startsWith('--'))
        throw new Error('--outputの値が必要です。');
      output = value;
      index += 1;
    } else
      throw new Error('使用法: inventory.ts [--check] [--output 相対パス]');
  }
  const root = process.cwd();
  const inventory = buildInventory(loadSource(root));
  // 比較・保存に失敗しても、解析診断を確認できるよう先に出力する。
  // CLIの構造化結果。時刻や秘密情報は出力しない。
  process.stdout.write(
    `${JSON.stringify({
      nodes: inventory.nodes.length,
      diagnostics: inventory.diagnostics,
      output,
      mode: shouldCheck ? 'check' : 'update',
    })}\n`,
  );
  saveInventory(root, output, inventory, shouldCheck);
  if (inventory.diagnostics.some((item) => item.severity === 'error'))
    process.exitCode = 1;
};

if (
  process.argv[1] &&
  resolve(process.argv[1]) === fileURLToPath(import.meta.url)
) {
  try {
    main();
  } catch (error) {
    process.stderr.write(
      `${error instanceof Error ? error.message : 'inventoryの生成に失敗しました。'}\n`,
    );
    process.exitCode = 1;
  }
}
