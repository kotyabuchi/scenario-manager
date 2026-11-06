import { isNil } from 'ramda';

import { legacyManifestSchema } from './legacy';
import { validateLegacyExecution } from './legacyExecution';
import { legacyExecutionSchema } from './legacyExecutionSchema';
import { playwrightTestListLine } from './playwrightTestList';

import type { LegacyManifest } from './legacy';

type LegacySelectionInput = {
  legacy: unknown;
  execution: unknown;
  currentLegacy: unknown;
  project: string;
};

const state = (
  entry: LegacyManifest['tests'][number] | LegacyManifest['registered'][number],
) =>
  JSON.stringify([
    entry.fingerprint,
    entry.expectedStatus,
    entry.annotations.map((value) => JSON.stringify(value)).sort(),
    entry.serialGroup,
    'caseId' in entry ? [entry.caseId, entry.variant, entry.binding] : null,
  ]);

/** 同keyの通常case移行後も、既存app suiteの実行義務を列挙する。 */
export const legacyAppEntries = (manifest: LegacyManifest) =>
  [...manifest.tests, ...manifest.registered].filter(
    (entry) => entry.profile === 'app',
  );

/**
 * currentLegacyはguard付きdiscover(profile=app, setupProjects=[])を
 * buildLegacyへ渡して生成する。保存済み旧台帳の再代入は実行証跡にならない。
 */
export const validateLegacyDiscovery = ({
  legacy: original,
  currentLegacy: discovered,
}: Pick<LegacySelectionInput, 'legacy' | 'currentLegacy'>) => {
  const legacy = legacyManifestSchema.parse(original);
  const currentLegacy = legacyManifestSchema.parse(discovered);
  const previous = legacyAppEntries(legacy);
  if (
    previous.length === 0 ||
    currentLegacy.setups.length > 0 ||
    [...currentLegacy.tests, ...currentLegacy.registered].some(
      (entry) => entry.profile !== 'app',
    )
  )
    throw new Error('現在の列挙は旧app登録全体だけを含む必要があります。');
  const current = new Map(
    legacyAppEntries(currentLegacy).map((entry) => [entry.key, entry]),
  );
  if (current.size !== previous.length)
    throw new Error('現在の列挙と旧app登録の集合が一致しません。');
  for (const entry of previous) {
    const found = current.get(entry.key);
    if (isNil(found) || state(found) !== state(entry))
      throw new Error(
        `現在の列挙と旧登録のidentity/本文/状態が一致しません: ${entry.key}`,
      );
  }
  return { legacy, currentLegacy };
};

/** rootDir=e2eのPlaywright --test-list用。行番号や正規表現で近似しない。 */
export const createLegacySelection = (input: LegacySelectionInput) => {
  const { legacy, currentLegacy } = validateLegacyDiscovery(input);
  const execution = legacyExecutionSchema.parse(input.execution);
  const validation = validateLegacyExecution({ legacy, execution });
  if (validation.issues.length > 0)
    throw new Error('旧test実行先台帳が登録集合と一致しません。');
  const dispositions = new Map(
    execution.entries.map((entry) => [entry.key, entry]),
  );
  const entries = legacyAppEntries(currentLegacy)
    .filter((entry) => entry.project === input.project)
    .filter(
      (entry) => dispositions.get(entry.key)?.disposition !== 'deferred-live',
    )
    .sort((left, right) =>
      left.key < right.key ? -1 : left.key > right.key ? 1 : 0,
    );
  if (entries.length === 0) throw new Error('選択対象のprojectがありません。');
  const lines = entries.map((entry) => {
    if (
      !entry.project ||
      !entry.file.startsWith('e2e/') ||
      entry.repeatEachIndex !== 0
    )
      throw new Error('旧testのproject/repeatEachを正確に表現できません。');
    return playwrightTestListLine('e2e', entry);
  });
  if (new Set(lines).size !== lines.length)
    throw new Error('test-listの選択行が重複しています。');
  return {
    project: input.project,
    entries,
    keys: entries.map((entry) => entry.key),
    testList: `${lines.join('\n')}\n`,
  };
};

export type { LegacySelectionInput };
