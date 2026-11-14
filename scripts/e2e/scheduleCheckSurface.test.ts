import { afterEach, expect, it, vi } from 'vitest';

import { discover } from './discover';
import { bindDiscovery } from './discoveryBindings';
import { loadStorySurfaceContext } from './extractors/surfaceRoots';
import { createGithubEventGit } from './fixtures/githubEventGit';
import { scheduleEvidenceFixture } from './fixtures/scheduleCheck';
import { buildInventory } from './inventory';
import { loadLedger } from './ledger';
import * as requirements from './requirements';
import { validateLedger } from './requirements';
import { prepareScheduleCheck } from './scheduleCheck';
import { loadSource } from './source';
import { projectSurfaceGraph, withSurfaceNodes } from './surfaceProjection';

vi.mock('./discover', () => ({ discover: vi.fn() }));

const roots: ReturnType<typeof createGithubEventGit>[] = [];
afterEach(() => {
  for (const fixture of roots.splice(0)) fixture.cleanup();
  vi.restoreAllMocks();
  vi.resetAllMocks();
});

it('実ソースのsurface契約を単独日程入口でも検証する', async () => {
  const fixture = createGithubEventGit();
  roots.push(fixture);
  fixture.write(
    'tsconfig.json',
    JSON.stringify({
      compilerOptions: {
        noLib: true,
        types: [],
        jsx: 'preserve',
        module: 'esnext',
        moduleResolution: 'bundler',
      },
      include: ['src/**/*'],
    }),
  );
  fixture.write(
    'src/app/page.tsx',
    `import { save } from './actions';
export default function Page() { return <main><button data-testid="main-save" onClick={save}>通常位置</button><button data-testid="sticky-save" onClick={save}>固定バー</button></main> }`,
  );
  fixture.write(
    'src/app/Controls.tsx',
    `import { save } from './actions';
export function Controls() { return <main>
<button data-testid="main-save" onClick={save}>通常位置</button><button data-testid="sticky-save" onClick={save}>固定バー</button>
</main> }`,
  );
  fixture.write(
    'src/app/actions.ts',
    `'use server'; export async function save() {}`,
  );
  fixture.write(
    'src/app/Controls.stories.tsx',
    `import { Controls } from './Controls';
export default { component: Controls };
export const Default = { render: () => <Controls /> };`,
  );
  fixture.write(
    'src/app/(main)/sessions/[id]/actions.ts',
    `'use server';
export async function applyToSessionAction() {}
export async function cancelApplicationAction() {}`,
  );

  // 抽出器・surface投影・台帳validatorはmockせず、小さい実Gitから導出する。
  const inventory = buildInventory(
    loadSource(fixture.root),
    loadStorySurfaceContext(fixture.root),
  );
  const surfaces = projectSurfaceGraph(inventory).nodes;
  expect(surfaces).toHaveLength(2);
  const value = scheduleEvidenceFixture();
  const confirm = value.ledger.scenarios
    .flatMap(({ cases }) => cases)
    .find(({ caseId }) => caseId === 'schedule-confirm-persist');
  const application = value.ledger.scenarios
    .flatMap(({ cases }) => cases)
    .find(({ caseId }) => caseId === 'session-application-round-trip');
  if (!confirm || !application)
    throw new Error('日程fixtureのcaseがありません');
  confirm.checks = surfaces.map(({ id }) => ({
    target: id,
    aspect: 'render',
    layer: 'browser',
  }));
  value.ledger.profiles = [
    {
      id: 'isolated',
      layer: 'browser',
      executions: ['chromium', 'mobile-chrome'].map((project) => ({
        project,
        runtime: 'next-production',
      })),
    },
  ];
  value.ledger.fixtures = ['schedule', 'session-application'].map((id) => ({
    id,
    actors: ['creator-only', 'keeper-only', 'applicant', 'confirmed-player'],
  }));
  value.ledger.contracts = [confirm, application].flatMap((item) =>
    item.checks.map(({ target, aspect }) => ({
      target,
      classification: aspect === 'render' ? 'support' : 'write',
      requirements: [
        {
          aspect,
          layers: ['browser'],
          expectation: '操作結果を照合する',
          basis: ['docs/fixture.md'],
          executions: item.executions,
        },
      ],
      notApplicable: [],
    })),
  );
  const ledger = value.ledger;
  for (const [name, contents] of Object.entries({
    'profiles.json': ledger.profiles,
    'fixtures.json': ledger.fixtures,
    'contracts/main.json': ledger.contracts,
    'scenarios/main.json': ledger.scenarios,
    'execution-groups.json': ledger.executionGroups,
    'exceptions.json': ledger.exceptions,
  }))
    fixture.write(`e2e/ledger/${name}`, JSON.stringify(contents));
  expect((await loadLedger(fixture.root)).contracts).toHaveLength(4);
  const bindings = bindDiscovery(ledger, [value.discovery]);
  expect(bindings.issues).toEqual([]);
  expect(
    validateLedger({
      inventory: withSurfaceNodes(inventory),
      ledger,
      registrations: bindings.registrations,
    }).issues,
  ).toEqual([]);
  const rawIssues = validateLedger({
    inventory,
    ledger,
    registrations: bindings.registrations,
  }).issues;
  expect(
    rawIssues.filter(({ code }) => code === 'MISSING_TARGET'),
  ).toHaveLength(2);
  expect(
    rawIssues.filter(({ code }) => code === 'UNEXPECTED_CHECK'),
  ).toHaveLength(8);
  vi.mocked(discover).mockResolvedValue(value.discovery);

  // 実validatorへ届いた観測を確認し、story contextの省略も検出する。
  const validate = vi.spyOn(requirements, 'validateLedger');
  const expected = await prepareScheduleCheck(fixture.root);
  expect(validate).toHaveBeenCalledOnce();
  const observed = validate.mock.calls[0]?.[0].inventory.surfaceAnalysis;
  const storyId = 'src/app/Controls.stories.tsx#Default';
  expect(observed?.storyReferences).toContainEqual(
    expect.objectContaining({ id: storyId, kind: 'entry' }),
  );
  expect(
    observed?.bindings.filter(
      ({ entry }) => entry.kind === 'storybook' && entry.id === storyId,
    ),
  ).toHaveLength(2);
  expect(
    observed?.diagnostics.filter(
      ({ code }) => code === 'SURFACE_UNRESOLVED_STORY_RENDER',
    ),
  ).toEqual([]);
  expect(expected).toHaveLength(6);
  expect(expected.map(({ test }) => test.testId).sort()).toEqual(
    value.discovery.tests.map(({ testId }) => testId).sort(),
  );
}, 30_000);
