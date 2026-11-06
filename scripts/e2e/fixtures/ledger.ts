import type { Ledger } from '../../../e2e/ledger/schema';

/** 独立した変更を加えられる、DB不要の最小台帳を生成する。 */
export const createLedgerFixture = (): Ledger => {
  const executions = ['chromium', 'mobile-chrome'].map((project) => ({
    profile: 'app',
    project,
    runtime: 'next-production' as const,
    variant: 'creator-only',
    actorBindings: [{ role: 'operator', actor: 'creator' }],
  }));
  const target = 'action:src/app/schedule/actions.ts#confirm';
  return {
    schemaVersion: 1,
    profiles: [
      {
        id: 'app',
        layer: 'browser',
        executions: executions.map(({ project, runtime }) => ({
          project,
          runtime,
        })),
      },
      {
        id: 'stories',
        layer: 'storybook',
        executions: [{ project: '', runtime: 'storybook' }],
      },
      {
        id: 'db',
        layer: 'integration',
        executions: [{ project: 'integration', runtime: 'vitest-node' }],
      },
    ],
    fixtures: [{ id: 'schedule', actors: ['creator', 'keeper', 'outsider'] }],
    contracts: [
      {
        target,
        classification: 'write',
        requirements: [
          {
            aspect: 'persist',
            layers: ['browser', 'integration'],
            expectation: '確定した日程を再読込後も表示する',
            basis: ['docs/plans/session-availability-confirmation-redesign.md'],
            executions: structuredClone(executions),
          },
        ],
        notApplicable: [],
      },
    ],
    scenarios: [
      {
        scenarioId: 'schedule',
        title: '日程確定',
        cases: [
          {
            caseId: 'schedule-save',
            title: '作成者が日程を確定する',
            status: 'planned',
            layer: 'browser',
            fixture: 'schedule',
            roles: ['operator'],
            checks: [{ target, aspect: 'persist', layer: 'browser' }],
            executions,
            testBindings: ['save-and-reload'],
          },
        ],
      },
    ],
    executionGroups: [],
    exceptions: [],
  };
};
