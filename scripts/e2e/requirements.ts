import { isNil } from 'ramda';

import { deficiencyKey, executionKey, orderedBindings } from './ledgerIdentity';

import type {
  Aspect,
  Contract,
  Deficiency,
  Execution,
  Ledger,
  LedgerIssue,
  Registration,
} from '../../e2e/ledger/schema';
import type { Inventory, InventoryNode } from './inventorySchema';

const UI_KINDS = new Set<InventoryNode['kind']>([
  'page',
  'layout',
  'default',
  'loading',
  'error',
  'template',
  'not-found',
  'global-error',
  'surface',
]);
const ENTRY_KINDS = new Set<InventoryNode['kind']>([
  ...UI_KINDS,
  'route',
  'action',
  'api',
]);

export { deficiencyKey, executionKey } from './ledgerIdentity';

const missing = (
  target: string,
  aspect: Deficiency['aspect'],
  layer: Deficiency['layer'] = null,
  caseId: string | null = null,
  execution?: Execution,
): Deficiency => ({
  target,
  aspect,
  layer,
  caseId,
  variant: execution?.variant ?? null,
  actorBindings: !isNil(execution)
    ? orderedBindings(execution.actorBindings)
    : null,
  profile: execution?.profile ?? null,
  project: execution?.project ?? null,
  runtime: execution?.runtime ?? null,
});

const defaultsFor = (node: InventoryNode, contract: Contract): Aspect[] => {
  if (UI_KINDS.has(node.kind)) return ['render'];
  if (node.kind === 'rpc')
    return contract.classification === 'write'
      ? ['persist', 'authorization', 'rls', 'atomicity']
      : ['response', 'authorization'];
  if (['route', 'action', 'api'].includes(node.kind))
    return contract.classification === 'write'
      ? ['persist', 'authorization', 'validation']
      : ['response'];
  return [];
};

/** kindの最低観点と手書き契約を照合し、明示した実行行だけを展開する。 */
export const deriveRequirements = (inventory: Inventory, ledger: Ledger) => {
  const issues: LedgerIssue[] = [];
  const deficiencies: Deficiency[] = [];
  const requirements: Array<{
    target: string;
    aspect: Aspect;
    layer: Ledger['profiles'][number]['layer'];
    execution: Execution;
  }> = [];
  const nodes = new Map(inventory.nodes.map((node) => [node.id, node]));
  const contracts = new Map(
    ledger.contracts.map((contract) => [contract.target, contract]),
  );
  const profiles = new Map(
    ledger.profiles.map((profile) => [profile.id, profile]),
  );
  for (const node of inventory.nodes) {
    if (ENTRY_KINDS.has(node.kind) && !contracts.has(node.id))
      deficiencies.push(missing(node.id, 'contract'));
  }
  for (const contract of ledger.contracts) {
    const node = nodes.get(contract.target);
    if (isNil(node)) {
      issues.push({
        code: 'MISSING_TARGET',
        subject: contract.target,
        message: '契約の対象がinventoryに存在しません',
      });
      continue;
    }
    if (
      contract.classification === 'support' &&
      !UI_KINDS.has(node.kind) &&
      node.kind !== 'route' &&
      node.kind !== 'function'
    ) {
      issues.push({
        code: 'INVALID_CLASSIFICATION',
        subject: contract.target,
        message:
          'supportはUI入口・routeコンテナ・明示したfunctionにのみ指定できます',
      });
    }
    const defaultAspects = defaultsFor(node, contract);
    if (
      defaultAspects.length > 0 &&
      !contract.requirements.some((requirement) =>
        defaultAspects.includes(requirement.aspect),
      )
    )
      issues.push({
        code: 'ALL_DEFAULT_ASPECTS_EXEMPT',
        subject: contract.target,
        message:
          '既定観点の少なくとも1つは実際の検証要件として指定してください',
      });
    for (const aspect of defaultAspects) {
      if (
        !contract.requirements.some(
          (requirement) => requirement.aspect === aspect,
        ) &&
        !contract.notApplicable.some((item) => item.aspect === aspect)
      )
        deficiencies.push(missing(contract.target, aspect));
    }
    for (const requirement of contract.requirements) {
      for (const execution of requirement.executions) {
        const profile = profiles.get(execution.profile);
        if (isNil(profile) || !requirement.layers.includes(profile.layer)) {
          issues.push({
            code: 'INVALID_REQUIREMENT_LAYER',
            subject: contract.target,
            message: `${requirement.aspect}のprofileが許容layerに対応しません`,
          });
          continue;
        }
        requirements.push({
          target: contract.target,
          aspect: requirement.aspect,
          layer: profile.layer,
          execution,
        });
      }
    }
  }
  return { requirements, deficiencies, issues };
};

/** 台帳の宣言と登録を照合する。実行成功やassertionの十分性は判定しない。 */
export const validateLedger = ({
  inventory,
  ledger,
  registrations,
}: {
  inventory: Inventory;
  ledger: Ledger;
  registrations?: Registration[];
}) => {
  const derived = deriveRequirements(inventory, ledger);
  const issues = [...derived.issues];
  const deficiencies = new Map(
    derived.deficiencies.map((item) => [deficiencyKey(item), item]),
  );
  const cases = ledger.scenarios.flatMap((scenario) => scenario.cases);
  const caseMap = new Map(cases.map((item) => [item.caseId, item]));
  const requiredKey = (
    target: string,
    aspect: Aspect,
    layer: string,
    execution: Execution,
  ) => JSON.stringify([target, aspect, layer, executionKey(execution)]);
  const required = new Map(
    derived.requirements.map((item) => [
      requiredKey(item.target, item.aspect, item.layer, item.execution),
      item,
    ]),
  );
  const claimed = new Set<string>();
  const registrationsByCase = new Map<string, Registration[]>();
  const testIds = new Set<string>();
  const registrationKeys = new Set<string>();
  for (const registration of registrations ?? []) {
    const item = caseMap.get(registration.caseId);
    const key = JSON.stringify([
      registration.caseId,
      registration.binding,
      registration.layer,
      executionKey(registration.execution),
      registration.repeatEachIndex,
    ]);
    if (testIds.has(registration.testId) || registrationKeys.has(key))
      issues.push({
        code: 'DUPLICATE_REGISTRATION',
        subject: registration.testId,
        message: 'test IDまたは同じbindingの実行登録が重複しています',
      });
    if (registration.repeatEachIndex >= registration.repeatEach)
      issues.push({
        code: 'INVALID_REPEAT',
        subject: registration.testId,
        message: 'repeatEachIndexが設定した繰返し範囲を超えています',
      });
    testIds.add(registration.testId);
    registrationKeys.add(key);
    if (
      isNil(item) ||
      item.layer !== registration.layer ||
      !item.testBindings.includes(registration.binding) ||
      !item.executions.some(
        (execution) =>
          executionKey(execution) === executionKey(registration.execution),
      )
    ) {
      issues.push({
        code: 'UNEXPECTED_REGISTRATION',
        subject: registration.testId,
        message: 'case・binding・layer・実行条件の一致する宣言がありません',
      });
      continue;
    }
    const existing = registrationsByCase.get(item.caseId) ?? [];
    existing.push(registration);
    registrationsByCase.set(item.caseId, existing);
    if (item.status === 'planned')
      issues.push({
        code: 'PLANNED_HAS_REGISTRATION',
        subject: item.caseId,
        message: 'plannedのcaseに登録testがあります。自動昇格はしません',
      });
  }
  if (
    isNil(registrations) &&
    cases.some((item) => item.status === 'implemented')
  )
    issues.push({
      code: 'REGISTRATIONS_NOT_CONNECTED',
      subject: 'registrations',
      message: 'implementedの照合に必要なrunner登録が接続されていません',
    });
  for (const item of cases) {
    for (const execution of item.executions) {
      const registered = registrationsByCase.get(item.caseId) ?? [];
      const missingBindings = item.testBindings.filter((binding) => {
        const matches = registered.filter(
          (registration) =>
            registration.binding === binding &&
            executionKey(registration.execution) === executionKey(execution),
        );
        const repeats = matches[0]?.repeatEach ?? 1;
        if (
          matches.some((registration) => registration.repeatEach !== repeats)
        ) {
          issues.push({
            code: 'INVALID_REPEAT',
            subject: item.caseId,
            message: '同じbindingのrepeatEach設定が一致しません',
          });
          return true;
        }
        return (
          new Set(matches.map((registration) => registration.repeatEachIndex))
            .size !== repeats ||
          matches.some(
            (registration) =>
              registration.repeatEachIndex < 0 ||
              registration.repeatEachIndex >= repeats,
          )
        );
      });
      if (
        item.status === 'implemented' &&
        !isNil(registrations) &&
        missingBindings.length > 0
      )
        issues.push({
          code: 'MISSING_REGISTRATION',
          subject: item.caseId,
          message: `${executionKey(execution)}の登録が不足しています: ${missingBindings.join(', ')}`,
        });
      for (const check of item.checks) {
        const key = requiredKey(
          check.target,
          check.aspect,
          check.layer,
          execution,
        );
        if (!required.has(key) || check.layer !== item.layer) {
          issues.push({
            code: 'UNEXPECTED_CHECK',
            subject: item.caseId,
            message: `${check.target}/${check.aspect}/${executionKey(execution)}に一致する要件がありません`,
          });
          continue;
        }
        claimed.add(key);
        if (item.status === 'planned' || missingBindings.length > 0) {
          const deficiency = missing(
            check.target,
            check.aspect,
            check.layer,
            item.caseId,
            execution,
          );
          deficiencies.set(deficiencyKey(deficiency), deficiency);
        }
      }
    }
  }
  for (const [key, requirement] of required) {
    if (!claimed.has(key)) {
      const deficiency = missing(
        requirement.target,
        requirement.aspect,
        requirement.layer,
        null,
        requirement.execution,
      );
      deficiencies.set(deficiencyKey(deficiency), deficiency);
    }
  }
  const excepted: Deficiency[] = [];
  const exceptionKeys = new Set<string>();
  for (const exception of ledger.exceptions) {
    const key = deficiencyKey(exception.deficiency);
    if (exceptionKeys.has(key))
      issues.push({
        code: 'DUPLICATE_EXCEPTION',
        subject: exception.id,
        message: '同じ不足に複数の例外が指定されています',
      });
    exceptionKeys.add(key);
    const deficiency = deficiencies.get(key);
    if (isNil(deficiency))
      issues.push({
        code: 'UNUSED_EXCEPTION',
        subject: exception.id,
        message: '完全一致する不足が存在しない例外です',
      });
    else {
      excepted.push(deficiency);
      deficiencies.delete(key);
    }
  }
  const sortDeficiencies = (items: Deficiency[]) =>
    items.sort((left, right) =>
      deficiencyKey(left) < deficiencyKey(right)
        ? -1
        : deficiencyKey(left) > deficiencyKey(right)
          ? 1
          : 0,
    );
  issues.sort((left, right) => {
    const a = JSON.stringify([left.code, left.subject, left.message]);
    const b = JSON.stringify([right.code, right.subject, right.message]);
    return a < b ? -1 : a > b ? 1 : 0;
  });
  return {
    issues,
    deficiencies: sortDeficiencies([...deficiencies.values()]),
    excepted: sortDeficiencies(excepted),
  };
};
