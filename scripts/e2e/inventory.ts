import { extractActions } from './extractors/actions';
import { extractApis } from './extractors/apis';
import { extractDependencies } from './extractors/dependencies';
import { extractRoutes } from './extractors/routes';
import { loadStorySurfaceContext } from './extractors/surfaceRoots';
import { inventorySchema, inventoryV1Schema } from './inventorySchema';
import { loadSource } from './source';
import { createSourceIndex } from './sourceIndex';
import { analyzeSurfaceInventory } from './surfaceInventory';

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

import type { Inventory, InventoryV1 } from './inventorySchema';
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
  inventory.surfaceAnalysis.sites.sort((a, b) => compare(a.id, b.id));
  inventory.surfaceAnalysis.bindings.sort((a, b) => compare(a.id, b.id));
  inventory.surfaceAnalysis.diagnostics.sort((a, b) =>
    compare(JSON.stringify(a), JSON.stringify(b)),
  );
  inventory.surfaceAnalysis.storyReferences.sort((a, b) => compare(a.id, b.id));
  return `${JSON.stringify(inventory, null, 2)}\n`;
};

/** 新しいUI観測を既存coreへ混ぜず、保存v1との厳格な比較に使う。 */
export const projectInventoryV1 = (inventory: Inventory): InventoryV1 =>
  inventoryV1Schema.parse({
    schemaVersion: 1,
    extractorVersion: '1',
    source: inventory.source,
    nodes: inventory.nodes,
    edges: inventory.edges,
    diagnostics: inventory.diagnostics,
  });

export const serializeInventoryV1 = (input: InventoryV1) => {
  const inventory = inventoryV1Schema.parse(input);
  inventory.source.files.sort((a, b) => compare(a.path, b.path));
  inventory.nodes.sort((a, b) => compare(a.id, b.id));
  inventory.edges.sort((a, b) => compare(JSON.stringify(a), JSON.stringify(b)));
  inventory.diagnostics.sort((a, b) =>
    compare(JSON.stringify(a), JSON.stringify(b)),
  );
  return `${JSON.stringify(inventory, null, 2)}\n`;
};

/** 解析結果を台帳向けの入口一覧に組み立てる。 */
export const buildInventory = (
  context: SourceContext,
  storyContext?: SourceContext,
): Inventory => {
  const index = createSourceIndex(context);
  const routes = extractRoutes(context.files.map((file) => file.path));
  const actions = extractActions(context, index);
  const apis = extractApis(context, index);
  const dependencies = extractDependencies(context, index);
  const routeModules = routes.nodes.map((node) => ({
    from: node.id,
    to: `module:${node.source.file}`,
    kind: 'uses' as const,
    source: node.source,
  }));
  return inventorySchema.parse({
    schemaVersion: 2,
    extractorVersion: '2',
    surfaceAnalysis: analyzeSurfaceInventory({
      context,
      index,
      routes: routes.nodes,
      nodes: [
        ...routes.nodes,
        ...actions.nodes,
        ...apis.nodes,
        ...dependencies.nodes,
      ],
      edges: [
        ...routeModules,
        ...actions.edges,
        ...apis.edges,
        ...dependencies.edges,
      ],
      ...(storyContext ? { storyContext } : {}),
    }),
    source: context.manifest,
    nodes: [
      ...routes.nodes,
      ...actions.nodes,
      ...apis.nodes,
      ...dependencies.nodes,
    ],
    edges: [
      ...routeModules,
      ...actions.edges,
      ...apis.edges,
      ...dependencies.edges,
    ],
    diagnostics: [
      ...context.diagnostics,
      ...routes.diagnostics,
      ...actions.diagnostics,
      ...apis.diagnostics,
      ...dependencies.diagnostics,
    ],
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
  const inventory = buildInventory(
    loadSource(root),
    loadStorySurfaceContext(root),
  );
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
