import { isNil } from 'ramda';

import { legacyProjectSchema } from '../../e2e/fixtures/legacySchema';
import { discover } from './discover';
import { discoverIntegration } from './discoverIntegration';
import { bindDiscovery } from './discoveryBindings';
import { captureInputs, compareInputs } from './fingerprint';
import { createIntegrationExpectations } from './integrationExpectations';
import { buildInventory } from './inventory';
import { loadLedger } from './ledger';
import { readArtifact } from './ledgerArtifacts';
import { buildLegacy, legacyKey, legacyManifestSchema } from './legacy';
import { legacyExecutionSchema } from './legacyExecutionSchema';
import { verifyLegacyOrigins } from './legacyOrigin';
import { createLegacySelection } from './legacySelection';
import { validateLedger } from './requirements';
import { createScheduleExpectations } from './scheduleCheckExpectations';
import { loadSource } from './source';
import { createVerificationPlan } from './verificationPlan';

import type { Ledger } from '../../e2e/ledger/schema';
import type { VerificationExtraTest } from './verificationSchema';

const fulfilled = <T>(result: PromiseSettledResult<T>): T => {
  if (result.status === 'rejected') throw result.reason;
  return result.value;
};

/** runner固有の必要条件は共通化後も従来と同じ範囲で検査する。 */
const scopeProfile = (ledger: Ledger, profile: string): Ledger => ({
  ...ledger,
  scenarios: ledger.scenarios
    .map((scenario) => ({
      ...scenario,
      cases: scenario.cases.filter((item) =>
        item.executions.some((row) => row.profile === profile),
      ),
    }))
    .filter(({ cases }) => cases.length > 0),
  contracts: ledger.contracts
    .map((contract) => ({
      ...contract,
      requirements: contract.requirements
        .map((requirement) => ({
          ...requirement,
          executions: requirement.executions.filter(
            (row) => row.profile === profile,
          ),
        }))
        .filter(({ executions }) => executions.length > 0),
    }))
    .filter(({ requirements }) => requirements.length > 0),
  exceptions: ledger.exceptions.filter(
    ({ deficiency }) => deficiency.profile === profile,
  ),
});

/** DBやアプリの起動前に全collectorの終了を待ち、実行する全集合を固定する。 */
export const prepareVerification = async (root: string) => {
  const inputs = await captureInputs(root);
  const results = await Promise.allSettled([
    loadLedger(root),
    discover({
      root,
      profile: 'app',
      config: 'playwright.legacy-local.config.ts',
      setupProjects: [],
    }),
    discover({
      root,
      profile: 'isolated',
      config: 'playwright.isolated.config.ts',
      setupProjects: [],
    }),
    discover({
      root,
      profile: 'storybook',
      config: '.storybook/playwright.config.ts',
      setupProjects: [],
    }),
    discoverIntegration({ root }),
  ]);
  const ledger = fulfilled(results[0]);
  const app = fulfilled(results[1]);
  const isolated = fulfilled(results[2]);
  const storybook = fulfilled(results[3]);
  const integration = fulfilled(results[4]);
  const discoveries = [app, isolated, storybook, integration.discovery];
  const bindings = bindDiscovery(ledger, discoveries);
  const validation = validateLedger({
    inventory: buildInventory(loadSource(root)),
    ledger,
    registrations: bindings.registrations,
  });
  if (bindings.issues.length > 0 || validation.issues.length > 0)
    throw new Error('統合runの台帳と実登録が一致しません。');
  const scheduleExpected = createScheduleExpectations(
    scopeProfile(ledger, 'isolated'),
    isolated,
  );
  const integrationExpected = createIntegrationExpectations(
    ledger,
    integration,
  );
  const read = (name: string): unknown => {
    const contents = readArtifact(root, `e2e/ledger/${name}`);
    if (isNil(contents)) throw new Error('legacy移行台帳がありません。');
    return JSON.parse(contents);
  };
  const legacy = legacyManifestSchema.parse(
    read('legacy-tests.generated.json'),
  );
  const execution = legacyExecutionSchema.parse(read('legacy-execution.json'));
  await verifyLegacyOrigins(root, execution);
  const currentLegacy = await buildLegacy(root, [app]);
  const byLegacyKey = new Map(
    execution.entries.map((entry) => [entry.key, entry]),
  );
  const byTestKey = new Map(
    app.tests.map((test) => [legacyKey('app', test), test]),
  );
  const allowedExtraTests: Omit<VerificationExtraTest, 'key'>[] = [];
  for (const project of legacyProjectSchema.options) {
    const selected = createLegacySelection({
      legacy,
      execution,
      currentLegacy,
      project,
    });
    for (const row of selected.entries) {
      const entry = byLegacyKey.get(row.key);
      const test = byTestKey.get(row.key);
      if (isNil(entry) || isNil(test))
        throw new Error('legacy実行集合の対応がありません。');
      if (entry.disposition !== 'replacement')
        allowedExtraTests.push({
          profile: 'app',
          runtime: 'next-production',
          test,
          legacy: entry,
        });
    }
  }
  const plan = createVerificationPlan({
    ledger,
    discoveries,
    integrationCollection: integration,
    allowedExtraTests,
  });
  const after = await captureInputs(root);
  const changes = compareInputs(inputs, after);
  if (Object.values(changes).some((paths) => paths.length > 0))
    throw new Error('列挙中に検証入力が変化しました。');
  return { plan, inputs, scheduleExpected, integrationExpected };
};
