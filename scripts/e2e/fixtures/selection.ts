import { type Inventories, mergeImpactGraphs } from '../impactGraph';
import { type LegacyManifest, legacyKey } from '../legacy';
import { loadImpactRules } from '../loadImpactRules';
import { verificationFixture } from './verification';

import type { Ledger } from '../../../e2e/ledger/schema';
import type { PendingBaseline } from '../baseline';
import type { GitChangedPath, GitSnapshot } from '../gitSnapshotSchema';
import type { ImpactRules } from '../impactRulesSchema';
import type { Inventory } from '../inventorySchema';
import type {
  VerificationPlan,
  VerificationRequirement,
} from '../verificationSchema';

export const calendarFile =
  'src/features/sessions/__tests__/calendar.integration.test.ts';
export const rpcFile =
  'src/features/sessions/__tests__/rpc.integration.test.ts';
export const scenariosFile = '.storybook/tests/scenarios.spec.ts';
export const scenarioPath = 'src/features/scenarios/view.ts';
export const oldAdapter = 'src/old-alias/adapter.ts';
export const newAdapter = 'src/new-alias/adapter.ts';
export const scenarioTarget = 'function:scenario';
export const button = 'src/components/elements/Button/Button.tsx';

export const impactRulesFixture: ImpactRules = {
  schemaVersion: 1,
  features: [
    {
      id: 'scenarios',
      reason: '機能ディレクトリ全体で確認する。',
      paths: [{ kind: 'directory', path: 'src/features/scenarios' }],
      caseIds: [],
      targets: [scenarioTarget],
      legacyPaths: [],
    },
    {
      id: 'sessions',
      reason: '製品機能の変更を広く確認する。',
      paths: [{ kind: 'directory', path: 'src/features/sessions' }],
      caseIds: ['calendar-a', 'calendar-b', 'rpc'],
      targets: [],
      legacyPaths: [{ kind: 'file', path: 'e2e/old.spec.ts' }],
    },
  ],
  alwaysFull: [
    {
      id: 'common',
      reason: '共通基盤の変更を全件確認する。',
      paths: [
        { kind: 'directory', path: 'src/components/elements/Button' },
        { kind: 'directory', path: 'e2e/ledger' },
        { kind: 'directory', path: 'e2e/fixtures' },
        { kind: 'file', path: 'tsconfig.json' },
        { kind: 'file', path: 'pnpm-lock.yaml' },
      ],
    },
  ],
  databaseWide: [
    {
      id: 'database',
      reason: 'DBと利用側の動作を確認する。',
      paths: [{ kind: 'directory', path: 'supabase/migrations' }],
    },
  ],
  docsOnly: [
    {
      id: 'readme',
      reason: '案内文書のみ。',
      paths: [{ kind: 'file', path: 'README.md' }],
    },
  ],
};

const source = (file: string) => ({ file, line: 1, column: 1 });

export const inventoryFixture = (): Inventory => ({
  schemaVersion: 1,
  extractorVersion: '1',
  source: { fingerprint: 'a'.repeat(64), files: [] },
  nodes: [],
  edges: [],
  diagnostics: [],
});

export const impactFixture = () => {
  const existing = verificationFixture();
  const template = existing.plan.requirements.find(
    ({ kind }) => kind === 'business',
  );
  const caseTemplate = existing.ledger.scenarios[0]?.cases[0];
  if (template === undefined || caseTemplate === undefined)
    throw new Error('fixture不足');
  const row = (
    caseId: string,
    profile: string,
    file: string,
    suffix = '',
  ): VerificationRequirement => ({
    ...template,
    key: caseId + suffix,
    profile,
    runtime:
      profile === 'integration'
        ? 'vitest-node'
        : profile === 'storybook'
          ? 'storybook'
          : 'next-production',
    test: {
      ...template.test,
      file,
      testId: caseId + suffix,
      repeatEachIndex: suffix ? 1 : 0,
    },
    claim: { caseId, variant: 'default', binding: 'first' },
    dependencies: profile === 'storybook' ? ['preview-setup'] : [],
  });
  const setup = (
    key: string,
    dependencies: string[],
  ): VerificationRequirement => ({
    ...row(key, 'storybook', '.storybook/tests/preview.setup.ts'),
    kind: 'setup',
    claim: null,
    execution: null,
    dependencies,
  });
  const fullPlan: VerificationPlan = {
    ...existing.plan,
    requirements: [
      ...existing.plan.requirements,
      row('calendar-a', 'integration', calendarFile),
      row('calendar-b', 'integration', calendarFile),
      row('rpc', 'integration', rpcFile),
      row('scenario', 'storybook', scenariosFile),
      row('scenario', 'storybook', scenariosFile, '-repeat'),
      row('schedule', 'isolated', 'e2e/isolated/schedule.spec.ts'),
      setup('preview-setup', ['preview-base']),
      setup('preview-base', []),
    ],
  };
  const ledger: Ledger = {
    ...existing.ledger,
    contracts: [
      {
        target: scenarioTarget,
        classification: 'read',
        requirements: [],
        notApplicable: [],
      },
    ],
    scenarios: [
      ...existing.ledger.scenarios,
      {
        scenarioId: 'features',
        title: '機能',
        cases: ['calendar-a', 'calendar-b', 'rpc', 'scenario', 'schedule'].map(
          (caseId) => ({
            ...caseTemplate,
            caseId,
            checks: [
              {
                target:
                  caseId === 'scenario' ? scenarioTarget : `function:${caseId}`,
                aspect: 'render',
                layer: 'browser',
              },
            ],
          }),
        ),
      },
    ],
  };
  const inventories: Inventories = {
    base: {
      ...inventoryFixture(),
      nodes: [
        {
          id: scenarioTarget,
          kind: 'function',
          source: source(scenarioPath),
          slots: [],
        },
        {
          id: `module:${oldAdapter}`,
          kind: 'module',
          source: source(oldAdapter),
          slots: [],
        },
      ],
      edges: [
        {
          from: scenarioTarget,
          to: `module:${oldAdapter}`,
          kind: 'imports',
          source: source(scenarioPath),
        },
      ],
    },
    head: inventoryFixture(),
    index: inventoryFixture(),
    working: {
      ...inventoryFixture(),
      nodes: [
        {
          id: scenarioTarget,
          kind: 'function',
          source: source('src/new-location/view.ts'),
          slots: [],
        },
        {
          id: `module:${newAdapter}`,
          kind: 'module',
          source: source(newAdapter),
          slots: [],
        },
      ],
    },
  };
  const legacy: LegacyManifest = {
    schemaVersion: 1,
    tests: fullPlan.allowedExtraTests.map(({ profile, test, legacy }) => ({
      ...test,
      profile,
      key: legacyKey(profile, test),
      fingerprint: legacy.fingerprint,
      serialGroup: 'old-suite',
    })),
    registered: [],
    setups: [],
    groups: [
      {
        id: 'old-suite',
        profile: 'app',
        file: 'e2e/old.spec.ts',
        project: 'desktop',
        reason: '直列',
        testKeys: fullPlan.allowedExtraTests.map(({ legacy }) => legacy.key),
      },
    ],
  };
  const baseline: PendingBaseline = { schemaVersion: 1, items: [] };
  const rawRules = JSON.stringify(impactRulesFixture);
  const rules = loadImpactRules({ current: rawRules, base: rawRules, ledger });
  return {
    ledger,
    fullPlan,
    rules,
    inventories,
    graph: mergeImpactGraphs(inventories),
    legacy,
    baseline,
    rawRules,
  };
};

export const snapshotFixture = (
  changedPaths: GitChangedPath[],
): GitSnapshot => ({
  schemaVersion: 1,
  mode: 'local',
  base: 'a'.repeat(40),
  head: 'b'.repeat(40),
  objectFormat: 'sha1',
  indexEntries: [],
  changedPaths,
  workingFiles: [],
  reasons: [],
  digest: 'c'.repeat(64),
});
