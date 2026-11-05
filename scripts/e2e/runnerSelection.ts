import { isNil } from 'ramda';
import { z } from 'zod';

import { discoverySchema } from './discoverySchema';
import {
  assertRelativeRunnerPath,
  playwrightTestListLine,
} from './playwrightTestList';
import { verificationTestKey } from './verificationPlan';

import { isDeepStrictEqual } from 'node:util';

import type { DiscoveredTest, Discovery } from './discoverySchema';

const expectedSchema = discoverySchema.refine(
  ({ tests, errors }) => tests.length > 0 && errors.length === 0,
  'runnerの選択には空でない成功済み登録が必要です。',
);
const playwrightSelectionSchema = z.strictObject({
  kind: z.literal('playwright'),
  expected: expectedSchema,
  rootDir: z.string().min(1),
  unfiltered: z.literal(true).optional(),
});
const vitestSelectionSchema = z.strictObject({
  kind: z.literal('vitest'),
  expected: expectedSchema,
  files: z.array(z.string().min(1)).min(1),
});
export const runnerSelectionSchema = z.discriminatedUnion('kind', [
  playwrightSelectionSchema,
  vitestSelectionSchema,
]);
type RunnerSelection = z.infer<typeof runnerSelectionSchema>;
type PlaywrightRunnerSelection = Extract<
  RunnerSelection,
  { kind: 'playwright' }
>;
type VitestRunnerSelection = Extract<RunnerSelection, { kind: 'vitest' }>;

const compareText = (left: string, right: string) =>
  left < right ? -1 : left > right ? 1 : 0;

const indexTests = <Entry extends { test: DiscoveredTest }>(
  profile: string,
  entries: Entry[],
) => {
  const index = new Map<string, Entry>();
  for (const entry of entries) {
    const key = verificationTestKey(profile, entry.test);
    if (index.has(key))
      throw new Error('runnerの登録identityが重複しています。');
    index.set(key, entry);
  }
  return index;
};

const assertExpectedTests = <Entry extends { test: DiscoveredTest }>(
  expected: Discovery,
  entries: Entry[],
) => {
  const actual = indexTests(expected.profile, entries);
  return expected.tests.map((test) => {
    const entry = actual.get(verificationTestKey(expected.profile, test));
    if (isNil(entry) || !isDeepStrictEqual(entry.test, test))
      throw new Error('runnerの選択と登録identityが一致しません。');
    return entry;
  });
};

/** 選択済み登録と同じidentityへ、既存native checker用の全期待を射影する。 */
export const projectRunnerExpectations = <
  Entry extends { test: DiscoveredTest },
>(
  selection: RunnerSelection,
  entries: Entry[],
) => assertExpectedTests(selection.expected, entries);

export const assertRunnerDiscovery = (
  selection: RunnerSelection,
  discovery: Discovery,
) => {
  const { expected } = selection;
  const projects = (value: Discovery) =>
    [...value.projects].sort((left, right) =>
      compareText(left.name, right.name),
    );
  if (
    discovery.profile !== expected.profile ||
    discovery.errors.length > 0 ||
    discovery.tests.length !== expected.tests.length ||
    !isDeepStrictEqual(projects(discovery), projects(expected))
  )
    throw new Error('絞り込み後のrunner登録集合が有効planと一致しません。');
  indexTests(
    expected.profile,
    expected.tests.map((test) => ({ test })),
  );
  assertExpectedTests(
    expected,
    discovery.tests.map((test) => ({ test })),
  );
};

export const emitPlaywrightTestList = (
  selection: PlaywrightRunnerSelection,
) => {
  if (selection.unfiltered)
    throw new Error('全件runnerにtest-listは使用できません。');
  const lines = selection.expected.tests.map((test) =>
    playwrightTestListLine(selection.rootDir, test),
  );
  return `${[...new Set(lines)].sort(compareText).join('\n')}\n`;
};

const playwrightRootDirs = new Map([
  ['storybook', '.storybook/tests'],
  ['isolated', 'e2e/isolated'],
]);

/** 全収集に対し、全repeat・依存project・Vitestファイルの閉包を検証する。 */
export const createRunnerSelection = (input: {
  discovery: Discovery;
  tests: DiscoveredTest[];
  playwrightRootDir?: string;
  shouldAllowFullProfile?: boolean;
}): RunnerSelection => {
  const full = discoverySchema.parse(input.discovery);
  const expected = expectedSchema.parse({ ...full, tests: input.tests });
  if (full.profile === 'app')
    throw new Error('appの選択には既存legacy owner全体を使用してください。');
  const wanted = indexTests(
    full.profile,
    expected.tests.map((test) => ({ test })),
  );
  assertExpectedTests(
    expected,
    full.tests.map((test) => ({ test })),
  );
  if (full.profile === 'integration') {
    const files = [...new Set(expected.tests.map(({ file }) => file))].sort(
      compareText,
    );
    for (const file of files) assertRelativeRunnerPath(file);
    if (
      full.tests.some(
        (test) =>
          files.includes(test.file) &&
          !wanted.has(verificationTestKey(full.profile, test)),
      )
    )
      throw new Error('Vitestの選択はファイル内の全登録が必要です。');
    return vitestSelectionSchema.parse({ kind: 'vitest', expected, files });
  }
  const rootDir =
    input.playwrightRootDir ?? playwrightRootDirs.get(full.profile);
  const selection = playwrightSelectionSchema.parse({
    kind: 'playwright',
    expected,
    rootDir,
  });
  if (input.shouldAllowFullProfile && wanted.size === full.tests.length) {
    assertRunnerDiscovery(selection, full);
    return { ...selection, unfiltered: true };
  }
  const projects = new Map(
    full.projects.map((project) => [project.name, project]),
  );
  const dependencies = new Set<string>();
  for (const { project: name } of expected.tests) {
    const project = projects.get(name);
    if (isNil(project))
      throw new Error('選択したrunner projectが存在しません。');
    for (const dependency of project.dependencies) dependencies.add(dependency);
  }
  for (const dependency of dependencies)
    if (!expected.tests.some(({ project }) => project === dependency))
      throw new Error('runnerの依存projectが選択されていません。');
  const lines = new Set(
    expected.tests.map((test) =>
      playwrightTestListLine(selection.rootDir, test),
    ),
  );
  const row = ({ project, file, titlePath }: DiscoveredTest) =>
    JSON.stringify([project, file, titlePath]);
  const selectedRows = new Set(expected.tests.map(row));
  if (
    lines.size !== selectedRows.size ||
    full.tests.some(
      (test) =>
        (dependencies.has(test.project) || selectedRows.has(row(test))) &&
        !wanted.has(verificationTestKey(full.profile, test)),
    )
  )
    throw new Error(
      'Playwrightの選択には全repeatと依存projectの全登録が必要です。',
    );
  return selection;
};

export type {
  PlaywrightRunnerSelection,
  RunnerSelection,
  VitestRunnerSelection,
};
