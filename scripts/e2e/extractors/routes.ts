import type { InventoryDiagnostic, InventoryNode } from '../inventorySchema';

const APP_PREFIX = 'src/app/';
const ROUTE_KINDS = new Map<string, InventoryNode['kind']>([
  ['page', 'page'],
  ['route', 'route'],
  ['layout', 'layout'],
  ['default', 'default'],
  ['loading', 'loading'],
  ['error', 'error'],
  ['template', 'template'],
  ['not-found', 'not-found'],
  ['global-error', 'global-error'],
]);
// 長いmatcherを先に判定する。深さはgroup/slotを除いたURLのsegment数。
const INTERCEPTION_MARKERS = [
  { prefix: '(..)(..)', levels: 2 },
  { prefix: '(.)', levels: 0 },
  { prefix: '(..)', levels: 1 },
  { prefix: '(...)', levels: null },
];

type RouteExtraction = {
  nodes: InventoryNode[];
  diagnostics: InventoryDiagnostic[];
};

/** POSIX形式のsource一覧から入口を抽出する。アプリのimportやファイル読込は行わない。 */
export const extractRoutes = (files: readonly string[]): RouteExtraction => {
  const nodes: InventoryNode[] = [];
  const diagnostics: InventoryDiagnostic[] = [];

  for (const file of [...new Set(files)].sort()) {
    if (!file.startsWith(APP_PREFIX)) continue;
    const parts = file.slice(APP_PREFIX.length).split('/');
    const filename = parts.pop() ?? '';
    const extensionIndex = filename.lastIndexOf('.');
    const kind = ROUTE_KINDS.get(filename.slice(0, extensionIndex));
    if (!kind || parts.some((part) => part.startsWith('_'))) continue;

    const source = { file, line: 1, column: 1 };
    const slots: string[] = [];
    const segments: string[] = [];
    let isIntercepted = false;
    let hasError = false;
    const diagnose = (code: string, message: string) => {
      hasError = true;
      diagnostics.push({ code, message, severity: 'error', source });
    };

    if (!/\.(tsx?|jsx?)$/.test(filename)) {
      diagnose(
        'route.unsupported-extension',
        '未対応のルートファイル拡張子です。',
      );
    }

    for (const part of parts) {
      if (!part || part === '.' || part === '..' || part.includes('\\')) {
        diagnose('route.invalid-path', '正規化されたPOSIX相対パスが必要です。');
        continue;
      }
      if (part.startsWith('@')) {
        if (/^@[^@()[\]\\]+$/.test(part)) slots.push(part.slice(1));
        else diagnose('route.invalid-slot', 'slot名を解釈できません。');
        continue;
      }

      let segment = part;
      const marker = INTERCEPTION_MARKERS.find(({ prefix }) =>
        part.startsWith(prefix),
      );
      if (marker) {
        if (isIntercepted) {
          diagnose(
            'route.unsupported-interception',
            '複数のinterception matcherを含む経路は未対応です。',
          );
        }
        isIntercepted = true;
        segment = part.slice(marker.prefix.length);
        if (marker.levels === null) segments.length = 0;
        else if (segments.length < marker.levels) {
          diagnose(
            'route.invalid-interception',
            'interceptionがルートより上を参照しています。',
          );
        } else segments.splice(segments.length - marker.levels, marker.levels);
      } else if (/^\([^()]+\)$/.test(part)) {
        // groupの文脈はsource.fileに保持し、URLには加えない。
        continue;
      }

      const dynamic = segment.match(/^\[([^.[\]][^[\]]*)\]$/);
      const catchAll = segment.match(/^\[\.\.\.([^.[\]][^[\]]*)\]$/);
      const optionalCatchAll = segment.match(
        /^\[\[\.\.\.([^.[\]][^[\]]*)\]\]$/,
      );
      const hasBrackets = /[[\]]/.test(segment);
      if (
        !segment ||
        segment.startsWith('(') ||
        segment.startsWith('@') ||
        (hasBrackets && !dynamic && !catchAll && !optionalCatchAll)
      ) {
        diagnose(
          'route.invalid-segment',
          'ルートsegmentの規約を解釈できません。',
        );
        continue;
      }
      // Nextが公開ルートの先頭underscoreに使用するエスケープを復元する。
      segment = segment.replace(/%5f/gi, '_');
      if (/[?#%]/.test(segment)) {
        diagnose(
          'route.unsupported-segment',
          'エスケープまたはURL区切りを含むsegmentは未対応です。',
        );
      }
      segments.push(segment);
    }

    const parameterNames = new Set<string>();
    for (const [index, segment] of segments.entries()) {
      if (segment.startsWith('[...') || segment.startsWith('[[...')) {
        if (index !== segments.length - 1) {
          diagnose(
            'route.invalid-catch-all',
            'catch-allの後にURL segmentを配置できません。',
          );
        }
      }
      if (segment.startsWith('[')) {
        const name = segment
          .replace(/^\[\[?(?:\.\.\.)?/, '')
          .replace(/\]\]?$/, '');
        if (parameterNames.has(name)) {
          diagnose(
            'route.duplicate-parameter',
            '同じ動的parameter名が経路内で重複しています。',
          );
        }
        parameterNames.add(name);
      }
    }

    nodes.push({
      id: `${kind}:${file}`,
      kind,
      source,
      slots,
      navigation: isIntercepted ? 'intercepted' : 'direct',
      ...(!hasError ? { url: `/${segments.join('/')}` } : {}),
    });
  }
  return { nodes, diagnostics };
};

export type { RouteExtraction };
