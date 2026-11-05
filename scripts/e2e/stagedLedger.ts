import { isNil } from 'ramda';

import { gitObjectFormat, gitRead, readGitBlobs } from './gitObjects';
import { readGitIndex } from './gitRecords';
import { parseLedger } from './ledger';
import {
  surfaceMigrationSchema,
  surfacePendingSchema,
} from './surfaceMigrationSchema';

import { join, relative, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { isDeepStrictEqual } from 'node:util';

const LEDGER_ROOT = 'e2e/ledger';
const SURFACE_FILES = new Set([
  'surface-pending.json',
  'surface-migration.json',
]);
const EXCLUDED_FILES = new Set([
  'README.md',
  'schema.ts',
  'impact-rules.json',
  'inventory.generated.json',
  'legacy-execution.json',
  'legacy-tests.generated.json',
  'migrations.json',
  'pending-baseline.json',
]);
const SCOPE = {
  schemaVersion: 1,
  scope: 'git-index-ledger-json',
  checks: 'schema-ids-references-only',
  excluded: [
    'baseline-and-generated',
    'source-and-test-registration',
    'test-execution',
  ],
  commitMode: 'stage-with-git-add-then-commit',
} as const;

type Failure =
  | 'INDEX_UNAVAILABLE'
  | 'ALTERNATE_INDEX_UNSUPPORTED'
  | 'LEDGER_PATH_UNSUPPORTED'
  | 'LEDGER_CONTENT_INVALID'
  | 'INDEX_CHANGED';

const failed = (failure: Failure) => ({
  ...SCOPE,
  status: 'failed' as const,
  failure,
});

/** stage済みの台帳だけを検査し、全体検証のreceiptは発行しない。 */
export const checkStagedLedger = (root: string) => {
  let failure: Failure = 'INDEX_UNAVAILABLE';
  try {
    if (gitRead(root, ['rev-parse', '--show-prefix']).toString('utf8') !== '\n')
      return failed(failure);
    const gitDirectory = gitRead(root, ['rev-parse', '--absolute-git-dir'])
      .toString('utf8')
      .replace(/\r?\n$/u, '');
    const defaultIndex = join(gitDirectory, 'index');
    // git commit -a / -- <path> の一時indexを通常indexにすり替えない。
    const hasAlternateIndex = Object.entries(process.env).some(
      ([key, path]) =>
        key.toUpperCase() === 'GIT_INDEX_FILE' &&
        (!path || relative(defaultIndex, resolve(root, path)) !== ''),
    );
    if (hasAlternateIndex) return failed('ALTERNATE_INDEX_UNSUPPORTED');

    const format = gitObjectFormat(root);
    const index = readGitIndex(root, format);
    const entries = new Map<string, string>();
    for (const { path, mode, oid } of index) {
      if (path === 'e2e' || path === LEDGER_ROOT)
        return failed('LEDGER_PATH_UNSUPPORTED');
      if (!path.startsWith(`${LEDGER_ROOT}/`)) continue;
      if (mode !== '100644' && mode !== '100755')
        return failed('LEDGER_PATH_UNSUPPORTED');
      const name = path.slice(LEDGER_ROOT.length + 1);
      if (EXCLUDED_FILES.has(name)) continue;
      if (
        !/^(?:profiles|fixtures|execution-groups|exceptions)\.json$/u.test(
          name,
        ) &&
        !/^(?:contracts|scenarios)\/[^/]+\.json$/u.test(name) &&
        !SURFACE_FILES.has(name)
      )
        return failed('LEDGER_PATH_UNSUPPORTED');
      entries.set(name, oid);
    }

    failure = 'LEDGER_CONTENT_INVALID';
    if (
      ['contracts/', 'scenarios/'].some(
        (prefix) =>
          ![...entries.keys()].some((name) => name.startsWith(prefix)),
      )
    )
      return failed(failure);
    const blobs = readGitBlobs(root, format, [...entries.values()]);
    const utf8 = new TextDecoder('utf-8', { fatal: true, ignoreBOM: true });
    const read = (name: string): unknown => {
      const oid = entries.get(name);
      const bytes = isNil(oid) ? undefined : blobs.get(oid);
      if (isNil(bytes)) throw new Error('indexに台帳ファイルがありません');
      return JSON.parse(utf8.decode(bytes));
    };
    const collection = (folder: 'contracts' | 'scenarios') =>
      [...entries.keys()]
        .filter((name) => name.startsWith(`${folder}/`))
        .flatMap((name) => {
          const records = read(name);
          if (!Array.isArray(records)) throw new Error('台帳に配列が必要です');
          const values: unknown[] = records;
          return values;
        });
    if ([...SURFACE_FILES].some((name) => entries.has(name))) {
      surfacePendingSchema.parse(read('surface-pending.json'));
      surfaceMigrationSchema.parse(read('surface-migration.json'));
    }
    parseLedger({
      schemaVersion: 1,
      profiles: read('profiles.json'),
      fixtures: read('fixtures.json'),
      contracts: collection('contracts'),
      scenarios: collection('scenarios'),
      executionGroups: read('execution-groups.json'),
      exceptions: read('exceptions.json'),
    });

    failure = 'INDEX_CHANGED';
    if (!isDeepStrictEqual(index, readGitIndex(root, format)))
      return failed(failure);
    return { ...SCOPE, status: 'passed' as const, fileCount: entries.size };
  } catch {
    return failed(failure);
  }
};

const entry = process.argv[1];
if (entry && import.meta.url === pathToFileURL(resolve(entry)).href) {
  const result = checkStagedLedger(process.cwd());
  process.stdout.write(`${JSON.stringify(result)}\n`);
  if (result.status === 'failed') process.exitCode = 1;
}
