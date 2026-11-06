import { isNil } from 'ramda';

import { legacyManifestSchema } from './legacy';
import { legacyExecutionSchema } from './legacyExecutionSchema';
import { readRevisionFile } from './trustedRevision';

import { execFileSync } from 'node:child_process';
import { devNull } from 'node:os';
import { isDeepStrictEqual } from 'node:util';

const ORIGIN_MANIFEST = 'e2e/ledger/legacy-tests.generated.json';

const assertAncestor = (root: string, revision: string) => {
  const env = { ...process.env };
  for (const name of Object.keys(env))
    if (name.toUpperCase().startsWith('GIT_'))
      Reflect.deleteProperty(env, name);
  // replace refsとは別のgraftによる履歴の付け替えも無効化する。
  env.GIT_GRAFT_FILE = devNull;
  try {
    execFileSync(
      'git',
      [
        '--no-replace-objects',
        '-C',
        root,
        'merge-base',
        '--is-ancestor',
        revision,
        'HEAD',
      ],
      {
        env,
        timeout: 30_000,
        windowsHide: true,
        stdio: ['ignore', 'pipe', 'pipe'],
      },
    );
  } catch {
    throw new Error(
      'replacement origin revisionはHEADの既知の祖先である必要があります',
    );
  }
};

/** replacementの旧登録を現在のJSONではなく祖先commitのGit objectで検証する。 */
export const verifyLegacyOrigins = async (
  root: string,
  execution: unknown,
): Promise<void> => {
  const replacements = legacyExecutionSchema
    .parse(execution)
    .entries.filter((entry) => entry.disposition === 'replacement');
  const manifests = new Map<
    string,
    ReturnType<typeof legacyManifestSchema.parse>
  >();
  for (const entry of replacements) {
    const { revision, registration } = entry.origin;
    let manifest = manifests.get(revision);
    if (isNil(manifest)) {
      assertAncestor(root, revision);
      const contents = readRevisionFile(root, revision, ORIGIN_MANIFEST);
      if (isNil(contents))
        throw new Error('replacement originに旧登録manifestがありません');
      manifest = legacyManifestSchema.parse(JSON.parse(contents));
      manifests.set(revision, manifest);
    }
    const original = manifest.tests.find((test) => test.key === entry.key);
    if (
      isNil(original) ||
      original.profile !== 'app' ||
      original.fingerprint !== entry.fingerprint ||
      !isDeepStrictEqual(original, registration)
    )
      throw new Error(
        `replacement originの旧app登録が一致しません: ${entry.key}`,
      );
  }
};
