import { isNil } from 'ramda';

import { ledgerSchema } from '../../e2e/ledger/schema';
import { executionKey } from './ledgerIdentity';

import { readdir, readFile, realpath } from 'node:fs/promises';
import { isAbsolute, join, relative, resolve, sep } from 'node:path';

import type { Aspect, Execution, Layer } from '../../e2e/ledger/schema';

const REAL_STATE_ASPECTS: readonly Aspect[] = [
  'persist',
  'authorization',
  'rls',
  'atomicity',
];

const unique = (values: readonly string[], subject: string) => {
  if (new Set(values).size !== values.length) {
    throw new Error(`${subject}: 重複があります`);
  }
};

const requireReference = (condition: boolean, message: string) => {
  if (!condition) throw new Error(message);
};

/** 表示用mockを保存・認可の証拠へ転用させない。 */
export const assertEvidenceLayer = (aspect: Aspect, layer: Layer) => {
  requireReference(
    layer !== 'storybook' || !REAL_STATE_ASPECTS.includes(aspect),
    `${aspect}: Storybookでは実状態・権限を保証できません`,
  );
  requireReference(
    aspect !== 'rls' || layer === 'integration',
    'rls: 利用者JWTによるintegration検証が必要です',
  );
};

/** 構造と台帳内参照を検査する。実ソース・runnerの照合はrequirementsが担当する。 */
export const parseLedger = (input: unknown) => {
  const ledger = ledgerSchema.parse(input);
  const cases = ledger.scenarios.flatMap((scenario) => scenario.cases);
  unique(
    ledger.profiles.map((item) => item.id),
    'profile',
  );
  unique(
    ledger.fixtures.map((item) => item.id),
    'fixture',
  );
  unique(
    ledger.contracts.map((item) => item.target),
    'contract target',
  );
  unique(
    ledger.scenarios.map((item) => item.scenarioId),
    'scenarioId',
  );
  unique(
    cases.map((item) => item.caseId),
    'caseId',
  );
  unique(
    ledger.executionGroups.map((item) => item.id),
    'executionGroup',
  );
  unique(
    ledger.exceptions.map((item) => item.id),
    'exception',
  );
  const profiles = new Map(ledger.profiles.map((item) => [item.id, item]));
  const fixtures = new Map(ledger.fixtures.map((item) => [item.id, item]));
  const actors = new Set(ledger.fixtures.flatMap((item) => item.actors));
  const groups = new Map(ledger.executionGroups.map((item) => [item.id, item]));
  const caseIndex = new Map(cases.map((item) => [item.caseId, item]));
  for (const fixture of ledger.fixtures) unique(fixture.actors, fixture.id);
  for (const profile of ledger.profiles) {
    unique(
      profile.executions.map((item) => JSON.stringify(item)),
      profile.id,
    );
    for (const execution of profile.executions) {
      const isValid =
        profile.layer === 'browser'
          ? ['next-production', 'cloudflare-workers'].includes(
              execution.runtime,
            )
          : execution.runtime ===
            (profile.layer === 'storybook' ? 'storybook' : 'vitest-node');
      requireReference(isValid, `${profile.id}: layer/runtimeが一致しません`);
    }
  }
  const validateExecutions = (
    executions: Execution[],
    layers: Layer[],
    subject: string,
  ) => {
    const keys: string[] = [];
    for (const execution of executions) {
      const profile = profiles.get(execution.profile);
      requireReference(
        !isNil(profile) &&
          layers.includes(profile.layer) &&
          profile.executions.some(
            (item) =>
              item.project === execution.project &&
              item.runtime === execution.runtime,
          ),
        `${subject}: 未知または不整合なprofile/project/runtimeです`,
      );
      unique(
        execution.actorBindings.map((item) => item.role),
        `${subject} actor role`,
      );
      for (const binding of execution.actorBindings) {
        requireReference(
          actors.has(binding.actor),
          `${subject}: 未知actor ${binding.actor}`,
        );
      }
      keys.push(executionKey(execution));
    }
    unique(keys, `${subject} execution`);
  };
  for (const contract of ledger.contracts) {
    unique(
      [
        ...contract.requirements.map((item) => item.aspect),
        ...contract.notApplicable.map((item) => item.aspect),
      ],
      `${contract.target} aspect`,
    );
    for (const requirement of contract.requirements) {
      unique(requirement.layers, `${contract.target} layer`);
      for (const layer of requirement.layers)
        assertEvidenceLayer(requirement.aspect, layer);
      validateExecutions(
        requirement.executions,
        requirement.layers,
        contract.target,
      );
      if (REAL_STATE_ASPECTS.includes(requirement.aspect)) {
        requireReference(
          requirement.executions.every(
            (execution) => execution.actorBindings.length > 0,
          ),
          `${contract.target}: 実状態・権限の検証にはactor bindingが必要です`,
        );
      }
    }
  }
  for (const item of cases) {
    const fixture = fixtures.get(item.fixture);
    requireReference(
      !isNil(fixture),
      `${item.caseId}: 未知fixture ${item.fixture}`,
    );
    unique(item.roles, `${item.caseId} roles`);
    unique(item.testBindings, `${item.caseId} testBindings`);
    unique(
      item.checks.map((check) => JSON.stringify(check)),
      `${item.caseId} checks`,
    );
    validateExecutions(item.executions, [item.layer], item.caseId);
    for (const check of item.checks) {
      requireReference(
        check.layer === item.layer,
        `${item.caseId}: check layerが一致しません`,
      );
      assertEvidenceLayer(check.aspect, check.layer);
      if (REAL_STATE_ASPECTS.includes(check.aspect)) {
        requireReference(
          item.roles.length > 0,
          `${item.caseId}: 実状態・権限の検証にはactor roleが必要です`,
        );
      }
    }
    for (const execution of item.executions) {
      const roles = execution.actorBindings.map((binding) => binding.role);
      requireReference(
        roles.length === item.roles.length &&
          item.roles.every((role) => roles.includes(role)),
        `${item.caseId}: actor roleの不足・過剰があります`,
      );
      for (const binding of execution.actorBindings) {
        requireReference(
          fixture?.actors.includes(binding.actor) === true,
          `${item.caseId}: fixtureにactor ${binding.actor} がありません`,
        );
      }
    }
    if (!isNil(item.executionGroup)) {
      requireReference(
        groups.get(item.executionGroup)?.caseIds.includes(item.caseId) === true,
        `${item.caseId}: executionGroupへの所属が一致しません`,
      );
    }
  }
  for (const group of ledger.executionGroups) {
    unique(group.caseIds, `${group.id} caseIds`);
    unique(group.dependsOn, `${group.id} dependsOn`);
    for (const caseId of group.caseIds) {
      requireReference(
        caseIndex.get(caseId)?.executionGroup === group.id,
        `${group.id}: case ${caseId} への参照・所属が一致しません`,
      );
    }
    for (const dependency of group.dependsOn) {
      requireReference(
        groups.has(dependency),
        `${group.id}: 未知group ${dependency}`,
      );
    }
  }
  const visited = new Set<string>();
  const visiting = new Set<string>();
  const visit = (id: string) => {
    requireReference(
      !visiting.has(id),
      `${id}: executionGroupに循環があります`,
    );
    if (visited.has(id)) return;
    visiting.add(id);
    for (const dependency of groups.get(id)?.dependsOn ?? []) visit(dependency);
    visiting.delete(id);
    visited.add(id);
  };
  for (const group of ledger.executionGroups) visit(group.id);
  for (const exception of ledger.exceptions) {
    const bindings = exception.deficiency.actorBindings;
    if (!isNil(bindings))
      unique(
        bindings.map((binding) => binding.role),
        exception.id,
      );
  }
  return ledger;
};

/** 固定した台帳ディレクトリからJSONのみ読み込み、コードを実行しない。 */
export const loadLedger = async (root: string) => {
  const physicalRoot = await realpath(root);
  const directory = resolve(root, 'e2e/ledger');
  const checkedPath = async (file: string) => {
    const physical = await realpath(file);
    const path = relative(physicalRoot, physical);
    if (isAbsolute(path) || path === '..' || path.startsWith(`..${sep}`)) {
      throw new Error('台帳ファイルがプロジェクト外を参照しています');
    }
    return physical;
  };
  const read = async (file: string): Promise<unknown> => {
    const contents = await readFile(
      await checkedPath(join(directory, file)),
      'utf8',
    );
    try {
      return JSON.parse(contents);
    } catch (cause) {
      throw new Error(`e2e/ledger/${file}: JSONを解析できません`, { cause });
    }
  };
  const readCollection = async (folder: string) => {
    const files = await readdir(await checkedPath(join(directory, folder)));
    const collections = await Promise.all(
      files
        .filter((file) => file.endsWith('.json'))
        .sort()
        .map((file) => read(`${folder}/${file}`)),
    );
    if (!collections.every((value): value is unknown[] => Array.isArray(value)))
      throw new Error(`${folder}: JSON配列が必要です`);
    return collections.flat();
  };
  const [
    profiles,
    fixtures,
    contracts,
    scenarios,
    executionGroups,
    exceptions,
  ] = await Promise.all([
    read('profiles.json'),
    read('fixtures.json'),
    readCollection('contracts'),
    readCollection('scenarios'),
    read('execution-groups.json'),
    read('exceptions.json'),
  ]);
  return parseLedger({
    schemaVersion: 1,
    profiles,
    fixtures,
    contracts,
    scenarios,
    executionGroups,
    exceptions,
  });
};
