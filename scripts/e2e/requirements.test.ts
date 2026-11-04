import { describe, expect, it } from 'vitest';

import { createLedgerFixture } from './fixtures/ledger';
import { inventorySchema } from './inventorySchema';
import { parseLedger } from './ledger';
import {
  deficiencyKey,
  deriveRequirements,
  executionKey,
  validateLedger,
} from './requirements';

import type { Ledger, Registration } from '../../e2e/ledger/schema';

const example = () => {
  const ledger = createLedgerFixture();
  const contract = ledger.contracts[0];
  const item = ledger.scenarios[0]?.cases[0];
  const requirement = contract?.requirements[0];
  if (!contract || !item || !requirement)
    throw new Error('fixtureが不足しています');
  contract.notApplicable = ['authorization', 'validation'].map((aspect) => ({
    aspect: aspect === 'authorization' ? 'authorization' : 'validation',
    reason: 'このfixtureは永続化の対応のみを検査する',
    reference: 'requirements.test.ts',
  }));
  const inventory = inventorySchema.parse({
    schemaVersion: 1,
    extractorVersion: '1',
    source: { fingerprint: 'a'.repeat(64), files: [] },
    nodes: [
      {
        id: contract.target,
        kind: 'action',
        source: { file: 'src/app/schedule/actions.ts', line: 1, column: 1 },
      },
    ],
    edges: [],
    diagnostics: [],
  });
  return {
    ledger: parseLedger(ledger),
    inventory,
    item,
    contract,
    requirement,
  };
};

// parseによる複製を避け、各testが返された参照を変更できるよう再取得する。
const fixture = () => {
  const { ledger, inventory } = example();
  const item = ledger.scenarios[0]?.cases[0];
  const contract = ledger.contracts[0];
  const requirement = contract?.requirements[0];
  if (!item || !contract || !requirement)
    throw new Error('fixtureが不足しています');
  const execution = item.executions[0];
  if (!execution) throw new Error('実行条件が不足しています');
  return { ledger, inventory, item, contract, requirement, execution };
};

const registrationsFor = (ledger: Ledger): Registration[] =>
  ledger.scenarios.flatMap((scenario) =>
    scenario.cases.flatMap((item) =>
      item.executions.flatMap((execution) =>
        item.testBindings.map((binding) => ({
          testId: `${item.caseId}:${binding}:${executionKey(execution)}`,
          caseId: item.caseId,
          binding,
          layer: item.layer,
          execution,
          repeatEachIndex: 0,
          repeatEach: 1,
        })),
      ),
    ),
  );

describe('必要観点と実登録の照合', () => {
  it('同じbindingの全repeatを要求し、一部欠落を不足にする', () => {
    const { ledger, inventory, item } = fixture();
    item.status = 'implemented';
    const registrations = registrationsFor(ledger).flatMap((registration) =>
      [0, 1].map((repeatEachIndex) => ({
        ...registration,
        testId: `${registration.testId}:${repeatEachIndex}`,
        repeatEach: 2,
        repeatEachIndex,
      })),
    );
    expect(validateLedger({ inventory, ledger, registrations })).toMatchObject({
      issues: [],
      deficiencies: [],
    });
    registrations.pop();
    const result = validateLedger({ inventory, ledger, registrations });
    expect(
      result.issues.some((issue) => issue.code === 'MISSING_REGISTRATION'),
    ).toBe(true);
    expect(result.deficiencies).toHaveLength(1);
  });

  it('repeat設定の不一致と範囲外を拒否する', () => {
    const { ledger, inventory, item } = fixture();
    item.status = 'implemented';
    const registrations = registrationsFor(ledger).flatMap((registration) =>
      [0, 1].map((repeatEachIndex) => ({
        ...registration,
        testId: `${registration.testId}:${repeatEachIndex}`,
        repeatEach: repeatEachIndex === 0 ? 2 : 1,
        repeatEachIndex,
      })),
    );
    const result = validateLedger({ inventory, ledger, registrations });
    expect(result.issues.some((issue) => issue.code === 'INVALID_REPEAT')).toBe(
      true,
    );
    expect(result.deficiencies).toHaveLength(2);
  });
  it('未契約の全入口を残し、内部依存だけでは義務を増やさない', () => {
    const { ledger, inventory } = fixture();
    ledger.contracts = [];
    inventory.nodes = [
      'page',
      'layout',
      'route',
      'default',
      'loading',
      'error',
      'template',
      'not-found',
      'global-error',
      'action',
      'api',
      'surface',
      'module',
      'function',
      'table',
      'rpc',
    ].map((kind) =>
      inventorySchema.shape.nodes.element.parse({
        id: `${kind}:example`,
        kind,
        source: { file: 'src/app/page.tsx', line: 1, column: 1 },
      }),
    );
    const result = deriveRequirements(inventory, ledger);
    expect(result.deficiencies).toHaveLength(12);
    expect(
      result.deficiencies.every(
        (item) => item.aspect === 'contract' && item.caseId === null,
      ),
    ).toBe(true);
  });

  it('既定の必要観点は理由のある観点別非適用だけで免除する', () => {
    const { ledger, inventory, contract } = fixture();
    contract.notApplicable = [];
    const result = deriveRequirements(inventory, ledger);
    expect(result.deficiencies.map((item) => item.aspect)).toEqual([
      'authorization',
      'validation',
    ]);
    expect(result.requirements).toHaveLength(2);
  });

  it('全既定観点を理由だけで免除し、別観点だけで合格させない', () => {
    for (const customAspect of [null, 'render', 'error-feedback'] as const) {
      const { ledger, inventory, contract, requirement } = fixture();
      contract.notApplicable.push({
        aspect: 'persist',
        reason: '既存不足',
        reference: 'plan',
      });
      contract.requirements = customAspect
        ? [{ ...requirement, aspect: customAspect }]
        : [];
      const result = deriveRequirements(inventory, ledger);
      expect(
        result.issues.some(
          (issue) => issue.code === 'ALL_DEFAULT_ASPECTS_EXEMPT',
        ),
      ).toBe(true);
    }
  });

  it('許容layerと実行行の直積を作らない', () => {
    const { ledger, inventory } = fixture();
    const result = deriveRequirements(inventory, ledger);
    expect(result.requirements.map((item) => item.layer)).toEqual([
      'browser',
      'browser',
    ]);
    expect(result.requirements.map((item) => item.execution.project)).toEqual([
      'chromium',
      'mobile-chrome',
    ]);
  });

  it('消えた対象とAPIへのsupport分類を検出する', () => {
    const { ledger, inventory, contract } = fixture();
    inventory.nodes = [];
    expect(deriveRequirements(inventory, ledger).issues[0]?.code).toBe(
      'MISSING_TARGET',
    );
    inventory.nodes = [
      {
        id: contract.target,
        kind: 'api',
        slots: [],
        source: { file: 'src/app/route.ts', line: 1, column: 1 },
      },
    ];
    contract.classification = 'support';
    expect(deriveRequirements(inventory, ledger).issues[0]?.code).toBe(
      'INVALID_CLASSIFICATION',
    );
  });

  it('明示したRPC契約にも最低観点を要求する', () => {
    const { ledger, inventory, contract } = fixture();
    inventory.nodes = [
      {
        id: contract.target,
        kind: 'rpc',
        slots: [],
        source: { file: 'src/app/adapter.ts', line: 1, column: 1 },
      },
    ];
    contract.notApplicable = [];
    expect(
      deriveRequirements(inventory, ledger).deficiencies.map(
        (item) => item.aspect,
      ),
    ).toEqual(['authorization', 'rls', 'atomicity']);
  });

  it('plannedはPC/mobileを別の不足とし、登録があっても昇格しない', () => {
    const { ledger, inventory, item } = fixture();
    const result = validateLedger({
      ledger,
      inventory,
      registrations: registrationsFor(ledger),
    });
    expect(result.deficiencies).toHaveLength(2);
    expect(new Set(result.deficiencies.map(deficiencyKey)).size).toBe(2);
    expect(result.issues.map((issue) => issue.code)).toEqual([
      'PLANNED_HAS_REGISTRATION',
      'PLANNED_HAS_REGISTRATION',
    ]);
    expect(item.status).toBe('planned');
  });

  it('implementedは全bindingの全execution登録を要求する', () => {
    const { ledger, inventory, item } = fixture();
    item.status = 'implemented';
    item.testBindings.push('participant-view');
    const registrations = registrationsFor(ledger);
    expect(validateLedger({ ledger, inventory, registrations })).toEqual({
      issues: [],
      deficiencies: [],
      excepted: [],
    });
    registrations.pop();
    const result = validateLedger({ ledger, inventory, registrations });
    expect(result.deficiencies).toHaveLength(1);
    expect(result.deficiencies[0]?.project).toBe('mobile-chrome');
    expect(result.issues[0]?.code).toBe('MISSING_REGISTRATION');
  });

  it('未接続の登録を成功とは見なさず、空登録でも不足を残す', () => {
    const { ledger, inventory, item } = fixture();
    item.status = 'implemented';
    const unconnected = validateLedger({ ledger, inventory });
    expect(unconnected.issues[0]?.code).toBe('REGISTRATIONS_NOT_CONNECTED');
    expect(unconnected.deficiencies).toHaveLength(2);
    const empty = validateLedger({ ledger, inventory, registrations: [] });
    expect(empty.issues).toHaveLength(2);
    expect(empty.deficiencies).toHaveLength(2);
  });

  it('caseを消しても要件はcase未対応の不足として残る', () => {
    const { ledger, inventory } = fixture();
    ledger.scenarios = [];
    const result = validateLedger({ ledger, inventory });
    expect(result.deficiencies).toHaveLength(2);
    expect(result.deficiencies.every((item) => item.caseId === null)).toBe(
      true,
    );
  });

  it('別対象・別観点・別layerを確認しても要件を満たさない', () => {
    const { ledger, inventory, item } = fixture();
    item.checks = [
      { target: 'action:other', aspect: 'persist', layer: 'browser' },
      {
        target: ledger.contracts[0]?.target ?? '',
        aspect: 'render',
        layer: 'browser',
      },
      {
        target: ledger.contracts[0]?.target ?? '',
        aspect: 'persist',
        layer: 'integration',
      },
    ];
    const result = validateLedger({ ledger, inventory });
    expect(result.issues).toHaveLength(6);
    expect(
      result.issues.every((issue) => issue.code === 'UNEXPECTED_CHECK'),
    ).toBe(true);
    expect(result.deficiencies.every((entry) => entry.caseId === null)).toBe(
      true,
    );
  });

  it('異なるactor/profile/variantの登録を必要実行へ転用しない', () => {
    for (const dimension of ['actor', 'profile', 'variant'] as const) {
      const { ledger, inventory, item } = fixture();
      item.status = 'implemented';
      const registrations = structuredClone(registrationsFor(ledger));
      const registration = registrations[0];
      if (!registration) throw new Error('登録fixture不足');
      if (dimension === 'actor')
        registration.execution.actorBindings = [
          { role: 'operator', actor: 'keeper' },
        ];
      else registration.execution[dimension] = 'different';
      const result = validateLedger({ ledger, inventory, registrations });
      expect(result.issues.map((issue) => issue.code)).toContain(
        'UNEXPECTED_REGISTRATION',
      );
      expect(result.deficiencies).toHaveLength(1);
    }
  });

  it('重複test ID・同じbindingの二重登録・未知caseを拒否する', () => {
    const { ledger, inventory, item } = fixture();
    item.status = 'implemented';
    const registrations = registrationsFor(ledger);
    const registration = registrations[0];
    if (!registration) throw new Error('登録fixture不足');
    registrations.push({ ...registration, testId: 'duplicate-binding' });
    registrations.push({ ...registration, caseId: 'unknown' });
    const result = validateLedger({ ledger, inventory, registrations });
    expect(
      result.issues.filter((issue) => issue.code === 'DUPLICATE_REGISTRATION'),
    ).toHaveLength(2);
    expect(
      result.issues.filter((issue) => issue.code === 'UNEXPECTED_REGISTRATION'),
    ).toHaveLength(1);
  });

  it('actorの記述順だけではidentityを変えず、端末やprofileは区別する', () => {
    const { execution } = fixture();
    execution.actorBindings.push({ role: 'viewer', actor: 'keeper' });
    const reversed = {
      ...execution,
      actorBindings: [...execution.actorBindings].reverse(),
    };
    expect(executionKey(execution)).toBe(executionKey(reversed));
    expect(executionKey(execution)).not.toBe(
      executionKey({ ...execution, profile: 'other' }),
    );
    expect(executionKey(execution)).not.toBe(
      executionKey({ ...execution, project: 'mobile-chrome' }),
    );
  });

  it('例外は全次元が一致する不足だけを除外し未使用を検出する', () => {
    const { ledger, inventory } = fixture();
    const deficiency = validateLedger({ ledger, inventory }).deficiencies[0];
    if (!deficiency) throw new Error('不足fixtureがありません');
    ledger.exceptions = [
      {
        id: 'known',
        deficiency,
        reason: '段階移行',
        tracker: 'docs/plans/e2e-ledger-quality-gates.md',
        reviewCondition: 'Batch 9完了時',
      },
    ];
    const result = validateLedger({ ledger, inventory });
    expect(result.issues).toEqual([]);
    expect(result.deficiencies).toHaveLength(1);
    expect(result.excepted).toEqual([deficiency]);
    deficiency.variant = 'other';
    const invalid = validateLedger({ ledger, inventory });
    expect(invalid.issues[0]?.code).toBe('UNUSED_EXCEPTION');
    expect(invalid.deficiencies).toHaveLength(2);
  });

  it('不足の二重例外を拒否し入力順に依存しない結果を返す', () => {
    const { ledger, inventory } = fixture();
    const original = validateLedger({ ledger, inventory });
    const deficiency = original.deficiencies[0];
    if (!deficiency) throw new Error('不足fixtureがありません');
    ledger.exceptions = ['one', 'two'].map((id) => ({
      id,
      deficiency,
      reason: '段階移行',
      tracker: 'plan',
      reviewCondition: '実装時',
    }));
    expect(
      validateLedger({ ledger, inventory }).issues.map((issue) => issue.code),
    ).toEqual(['DUPLICATE_EXCEPTION', 'UNUSED_EXCEPTION']);
    ledger.exceptions = [];
    ledger.scenarios[0]?.cases[0]?.executions.reverse();
    expect(validateLedger({ ledger, inventory })).toEqual(original);
  });
});
