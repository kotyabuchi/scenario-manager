import {
  createRunnerSelection,
  projectRunnerExpectations,
} from './runnerSelection';

import type { prepareVerificationDetails } from './prepareVerification';
import type { EffectiveSelection } from './projectSelection';

/** 全件収集から選択済みplanとnative期待集合を同じ登録IDで射影する。 */
export const selectedPreparation = (
  prepared: Awaited<ReturnType<typeof prepareVerificationDetails>>,
  effective: NonNullable<EffectiveSelection>,
) => {
  const runnerSelections = prepared.discoveries.flatMap((discovery) => {
    if (discovery.profile === 'app') return [];
    const tests = effective.plan.requirements
      .filter(({ profile }) => profile === discovery.profile)
      .map(({ test }) => test);
    if (tests.length === 0) return [];
    return [createRunnerSelection({ discovery, tests })];
  });
  const integration = runnerSelections.find(
    (selection) => selection.expected.profile === 'integration',
  );
  const isolated = runnerSelections.find(
    (selection) => selection.expected.profile === 'isolated',
  );
  return {
    runnerSelections,
    prepared: {
      plan: effective.plan,
      inputs: prepared.inputs,
      scheduleExpected: isolated
        ? projectRunnerExpectations(isolated, prepared.scheduleExpected)
        : [],
      integrationExpected: integration
        ? projectRunnerExpectations(integration, prepared.integrationExpected)
        : [],
    },
  };
};
