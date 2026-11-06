import { describe, expect, it } from 'vitest';

import {
  caseSchema,
  contractSchema,
  exceptionSchema,
  executionSchema,
  ledgerSchema,
} from '../../e2e/ledger/schema';
import { createLedgerFixture } from './fixtures/ledger';
import { parseLedger } from './ledger';

import type { Ledger } from '../../e2e/ledger/schema';

const parts = (ledger: Ledger) => {
  const scenario = ledger.scenarios[0];
  const testCase = scenario?.cases[0];
  const contract = ledger.contracts[0];
  const requirement = contract?.requirements[0];
  const execution = testCase?.executions[0];
  const profile = ledger.profiles[0];
  const fixture = ledger.fixtures[0];
  if (
    !scenario ||
    !testCase ||
    !contract ||
    !requirement ||
    !execution ||
    !profile ||
    !fixture
  )
    throw new Error('検査用の台帳要素が必要です');
  return {
    scenario,
    testCase,
    contract,
    requirement,
    execution,
    profile,
    fixture,
  };
};

describe('台帳schemaと参照整合', () => {
  it('明示した端末条件を保ち、plannedを自動昇格しない', () => {
    const ledger = createLedgerFixture();
    const result = parseLedger(ledger);
    expect(result).toEqual(ledger);
    expect(parts(result).testCase.status).toBe('planned');
    expect(parts(result).testCase.executions).toHaveLength(2);
  });

  it('Storybookの名前なしprojectを有効な実行条件として扱う', () => {
    const ledger = createLedgerFixture();
    const { testCase, requirement } = parts(ledger);
    const execution = {
      profile: 'stories',
      project: '',
      runtime: 'storybook' as const,
      variant: 'empty',
      actorBindings: [],
    };
    testCase.layer = 'storybook';
    testCase.roles = [];
    testCase.checks = [
      { target: 'page:src/app/page.tsx', aspect: 'render', layer: 'storybook' },
    ];
    testCase.executions = [execution];
    requirement.aspect = 'render';
    requirement.layers = ['storybook'];
    requirement.executions = [execution];
    expect(parseLedger(ledger)).toEqual(ledger);
  });

  it('同じroleのcreatorとkeeperを別variantとして保持する', () => {
    const ledger = createLedgerFixture();
    const { testCase, execution } = parts(ledger);
    testCase.executions.push({
      ...execution,
      variant: 'keeper-only',
      actorBindings: [{ role: 'operator', actor: 'keeper' }],
    });
    expect(parts(parseLedger(ledger)).testCase.executions).toHaveLength(3);
  });

  it('targetとaspectを個別checkの組として保持し、直積へ展開しない', () => {
    const ledger = createLedgerFixture();
    const { testCase } = parts(ledger);
    testCase.checks.push({
      target: 'page:src/app/schedule/page.tsx',
      aspect: 'render',
      layer: 'browser',
    });
    expect(parts(parseLedger(ledger)).testCase.checks).toEqual(testCase.checks);
    expect(parts(parseLedger(ledger)).testCase.checks).toHaveLength(2);
  });

  it('各階層の未知fieldと恒久verifiedを拒否する', () => {
    const ledger = createLedgerFixture();
    const { contract, testCase, execution } = parts(ledger);
    expect(() => ledgerSchema.parse({ ...ledger, verified: true })).toThrow();
    expect(() =>
      contractSchema.parse({ ...contract, covers: ['all'] }),
    ).toThrow();
    expect(() =>
      caseSchema.parse({ ...testCase, status: 'verified' }),
    ).toThrow();
    expect(() =>
      executionSchema.parse({ ...execution, runtime: 'unknown' }),
    ).toThrow();
    expect(() =>
      executionSchema.parse({
        ...execution,
        actorBindings: [
          { role: 'operator', actor: 'creator', userId: 'secret' },
        ],
      }),
    ).toThrow();
  });

  it.each([
    'reason',
    'tracker',
    'reviewCondition',
  ] as const)('例外の%sに空白を認めない', (field) => {
    const exception = {
      id: 'temporary',
      deficiency: {
        target: 'action:save',
        aspect: 'persist',
        layer: null,
        caseId: null,
        variant: null,
        actorBindings: null,
        profile: null,
        project: null,
        runtime: null,
      },
      reason: '専用fixtureの導入待ち',
      tracker: 'docs/plans/fixture.md',
      reviewCondition: 'fixture導入時',
    };
    expect(() => exceptionSchema.parse(exception)).not.toThrow();
    expect(() =>
      exceptionSchema.parse({ ...exception, [field]: '  ' }),
    ).toThrow();
  });

  const invalid: [string, (ledger: Ledger) => void][] = [
    [
      '重複scenario ID',
      (ledger) =>
        ledger.scenarios.push(structuredClone(parts(ledger).scenario)),
    ],
    [
      '別scenario間の重複case ID',
      (ledger) =>
        ledger.scenarios.push({
          ...structuredClone(parts(ledger).scenario),
          scenarioId: 'other',
        }),
    ],
    [
      '重複contract target',
      (ledger) =>
        ledger.contracts.push(structuredClone(parts(ledger).contract)),
    ],
    [
      '重複profile ID',
      (ledger) => ledger.profiles.push(structuredClone(parts(ledger).profile)),
    ],
    [
      '重複fixture ID',
      (ledger) => ledger.fixtures.push(structuredClone(parts(ledger).fixture)),
    ],
    [
      '重複fixture actor',
      (ledger) => parts(ledger).fixture.actors.push('creator'),
    ],
    ['重複role', (ledger) => parts(ledger).testCase.roles.push('operator')],
    [
      '未知fixture',
      (ledger) => {
        parts(ledger).testCase.fixture = 'missing';
      },
    ],
    ['未束縛role', (ledger) => parts(ledger).testCase.roles.push('observer')],
    [
      '未宣言role binding',
      (ledger) =>
        parts(ledger).execution.actorBindings.push({
          role: 'observer',
          actor: 'outsider',
        }),
    ],
    [
      '未知fixture actor',
      (ledger) => {
        parts(ledger).execution.actorBindings = [
          { role: 'operator', actor: 'missing' },
        ];
      },
    ],
    [
      '重複role binding',
      (ledger) =>
        parts(ledger).execution.actorBindings.push({
          role: 'operator',
          actor: 'keeper',
        }),
    ],
    [
      '未知profile',
      (ledger) => {
        parts(ledger).execution.profile = 'missing';
      },
    ],
    [
      '未知project',
      (ledger) => {
        parts(ledger).execution.project = 'webkit';
      },
    ],
    [
      'profile内で未登録のruntime',
      (ledger) => {
        parts(ledger).execution.runtime = 'cloudflare-workers';
      },
    ],
    [
      'profileとruntimeの不適合',
      (ledger) => {
        parts(ledger).profile.executions = [
          { project: 'chromium', runtime: 'vitest-node' },
        ];
      },
    ],
    [
      'profileとcase layerの不一致',
      (ledger) => {
        parts(ledger).testCase.layer = 'integration';
      },
    ],
    [
      'requirementの許容layer外のprofile',
      (ledger) => {
        parts(ledger).requirement.layers = ['integration'];
      },
    ],
    [
      'checkとcase layerの不一致',
      (ledger) => {
        parts(ledger).testCase.checks = [
          {
            target: parts(ledger).contract.target,
            aspect: 'persist',
            layer: 'integration',
          },
        ];
      },
    ],
    [
      '重複check',
      (ledger) => {
        const { testCase } = parts(ledger);
        testCase.checks = [...testCase.checks, ...testCase.checks];
      },
    ],
    [
      '重複requirement aspect',
      (ledger) =>
        parts(ledger).contract.requirements.push(
          structuredClone(parts(ledger).requirement),
        ),
    ],
    [
      'requirementと非適用の重複',
      (ledger) =>
        parts(ledger).contract.notApplicable.push({
          aspect: 'persist',
          reason: '対象外',
          reference: '仕様',
        }),
    ],
    [
      '空白の非適用理由',
      (ledger) =>
        parts(ledger).contract.notApplicable.push({
          aspect: 'render',
          reason: '  ',
          reference: '仕様',
        }),
    ],
    [
      '未知group',
      (ledger) => {
        parts(ledger).testCase.executionGroup = 'missing';
      },
    ],
    [
      'groupの未知case',
      (ledger) =>
        ledger.executionGroups.push({
          id: 'group',
          caseIds: ['missing'],
          dependsOn: [],
        }),
    ],
    [
      'caseからのgroup宣言欠落',
      (ledger) =>
        ledger.executionGroups.push({
          id: 'group',
          caseIds: ['schedule-save'],
          dependsOn: [],
        }),
    ],
    [
      'groupの未知依存先',
      (ledger) => {
        parts(ledger).testCase.executionGroup = 'group';
        ledger.executionGroups.push({
          id: 'group',
          caseIds: ['schedule-save'],
          dependsOn: ['missing'],
        });
      },
    ],
    [
      'groupの自己循環',
      (ledger) => {
        parts(ledger).testCase.executionGroup = 'group';
        ledger.executionGroups.push({
          id: 'group',
          caseIds: ['schedule-save'],
          dependsOn: ['group'],
        });
      },
    ],
  ];
  it.each(invalid)('%sを拒否する', (_name, change) => {
    const ledger = createLedgerFixture();
    change(ledger);
    expect(() => parseLedger(ledger)).toThrow();
  });

  it('複数groupを経由する循環を拒否する', () => {
    const ledger = createLedgerFixture();
    const { scenario, testCase } = parts(ledger);
    testCase.executionGroup = 'first';
    scenario.cases.push({
      ...structuredClone(testCase),
      caseId: 'second-case',
      executionGroup: 'second',
    });
    ledger.executionGroups = [
      { id: 'first', caseIds: ['schedule-save'], dependsOn: ['second'] },
      { id: 'second', caseIds: ['second-case'], dependsOn: ['first'] },
    ];
    expect(() => parseLedger(ledger)).toThrow();
    ledger.executionGroups[1]?.dependsOn.splice(0);
    expect(() => parseLedger(ledger)).not.toThrow();
  });

  it('全観点を理由付き非適用にして実要件を空にできない', () => {
    const ledger = createLedgerFixture();
    const { contract } = parts(ledger);
    contract.requirements = [];
    contract.notApplicable = [
      { aspect: 'persist', reason: '対象外', reference: '仕様' },
    ];
    expect(() => parseLedger(ledger)).toThrow();
  });

  it.each([
    'persist',
    'authorization',
    'rls',
    'atomicity',
  ] as const)('%sのcontract実行とcaseのactorを空配列で免除できない', (aspect) => {
    const ledger = createLedgerFixture();
    const { requirement, testCase, contract } = parts(ledger);
    const execution = {
      profile: 'db',
      project: 'integration',
      runtime: 'vitest-node' as const,
      variant: 'creator-only',
      actorBindings: [{ role: 'operator', actor: 'creator' }],
    };
    requirement.aspect = aspect;
    requirement.layers = ['integration'];
    requirement.executions = [structuredClone(execution)];
    testCase.layer = 'integration';
    testCase.checks = [
      { target: contract.target, aspect, layer: 'integration' },
    ];
    testCase.executions = [structuredClone(execution)];
    expect(() => parseLedger(ledger)).not.toThrow();
    requirement.executions = [{ ...execution, actorBindings: [] }];
    expect(() => parseLedger(ledger)).toThrow();
    requirement.executions = [execution];
    testCase.roles = [];
    testCase.executions = [{ ...execution, actorBindings: [] }];
    expect(() => parseLedger(ledger)).toThrow();
  });

  it.each([
    'persist',
    'authorization',
    'rls',
    'atomicity',
  ] as const)('Storybookを%sの契約やcheckへ割当てられない', (aspect) => {
    const ledger = createLedgerFixture();
    const { requirement, testCase } = parts(ledger);
    requirement.aspect = aspect;
    requirement.layers.push('storybook');
    expect(() => parseLedger(ledger)).toThrow();
    requirement.layers = ['browser'];
    testCase.layer = 'storybook';
    testCase.roles = [];
    testCase.executions = [
      {
        profile: 'stories',
        project: '',
        runtime: 'storybook',
        variant: 'mock',
        actorBindings: [],
      },
    ];
    testCase.checks = [
      { target: parts(ledger).contract.target, aspect, layer: 'storybook' },
    ];
    expect(() => parseLedger(ledger)).toThrow();
  });
});
