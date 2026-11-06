import { isNil } from 'ramda';

import { type ImpactPath, impactRulesSchema } from './impactRulesSchema';

import { createHash } from 'node:crypto';

import type { Ledger } from '../../e2e/ledger/schema';

export const IMPACT_RULES_PATH = 'e2e/ledger/impact-rules.json';

export const matchesImpactPath = (path: string, pattern: ImpactPath): boolean =>
  path === pattern.path ||
  (pattern.kind === 'directory' && path.startsWith(`${pattern.path}/`));

/** 現行の規則は台帳と照合し、旧規則の廃止済み参照は選択時に不足として扱う。 */
export const loadImpactRules = (input: {
  current: string;
  base: string | null;
  ledger: Ledger;
}) => {
  const current = impactRulesSchema.parse(JSON.parse(input.current));
  const base = isNil(input.base)
    ? null
    : impactRulesSchema.parse(JSON.parse(input.base));
  const targets = new Set(input.ledger.contracts.map(({ target }) => target));
  const cases = new Set(
    input.ledger.scenarios.flatMap(({ cases }) =>
      cases.map(({ caseId }) => caseId),
    ),
  );
  for (const rule of current.features) {
    if (
      rule.targets.some((target) => !targets.has(target)) ||
      rule.caseIds.some((id) => !cases.has(id))
    )
      throw new Error(
        `変更影響規則が現行台帳にない対象を参照しています: ${rule.id}`,
      );
  }
  return {
    current,
    base,
    digest: createHash('sha256')
      .update(`${JSON.stringify([base, current])}\n`)
      .digest('hex'),
  };
};

type LoadedImpactRules = ReturnType<typeof loadImpactRules>;

export type { LoadedImpactRules };
