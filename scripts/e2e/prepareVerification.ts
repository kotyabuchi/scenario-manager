import { isNil } from 'ramda';

import { legacyProjectSchema } from '../../e2e/fixtures/legacySchema';
import { discover } from './discover';
import { discoverIntegration } from './discoverIntegration';
import { bindDiscovery } from './discoveryBindings';
import { loadStorySurfaceContext } from './extractors/surfaceRoots';
import { captureInputs, compareInputs } from './fingerprint';
import { createIntegrationExpectations } from './integrationExpectations';
import { buildInventory } from './inventory';
import { loadLedger } from './ledger';
import { readArtifact } from './ledgerArtifacts';
import { buildLegacy, legacyKey, legacyManifestSchema } from './legacy';
import { legacyExecutionSchema } from './legacyExecutionSchema';
import { verifyLegacyOrigins } from './legacyOrigin';
import { createLegacySelection } from './legacySelection';
import {
  measurePreparation,
  measurePreparationSync,
  type PreparationTimingObserver,
} from './preparationTiming';
import { validateLedger } from './requirements';
import { createScheduleExpectations } from './scheduleCheckExpectations';
import { loadSource } from './source';
import { consumeReusableStaticInventory, type StaticState } from './staticGate';
import { withSurfaceNodes } from './surfaceProjection';
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
export const prepareVerificationDetails = async (
  root: string,
  onTiming?: PreparationTimingObserver,
  staticState?: StaticState,
) => {
  const inputs = await measurePreparation(
    { phase: 'collection', operation: 'inputs' },
    onTiming,
    () => captureInputs(root),
  );
  const results = await measurePreparation(
    { phase: 'collection', operation: 'discovery-wait' },
    onTiming,
    () =>
      Promise.allSettled([
        measurePreparation(
          { phase: 'collection', operation: 'ledger' },
          onTiming,
          () => loadLedger(root),
        ),
        measurePreparation(
          { phase: 'collection', operation: 'discover-app' },
          onTiming,
          () =>
            discover({
              root,
              profile: 'app',
              config: 'playwright.legacy-local.config.ts',
              setupProjects: [],
            }),
        ),
        measurePreparation(
          { phase: 'collection', operation: 'discover-isolated' },
          onTiming,
          () =>
            discover({
              root,
              profile: 'isolated',
              config: 'playwright.isolated.config.ts',
              setupProjects: [],
            }),
        ),
        measurePreparation(
          { phase: 'collection', operation: 'discover-storybook' },
          onTiming,
          () =>
            discover({
              root,
              profile: 'storybook',
              config: '.storybook/playwright.config.ts',
              setupProjects: [],
            }),
        ),
        measurePreparation(
          { phase: 'collection', operation: 'discover-integration' },
          onTiming,
          () => discoverIntegration({ root }),
        ),
      ]),
  );
  const ledger = fulfilled(results[0]);
  const app = fulfilled(results[1]);
  const isolated = fulfilled(results[2]);
  const storybook = fulfilled(results[3]);
  const integration = fulfilled(results[4]);
  const discoveries = [app, isolated, storybook, integration.discovery];
  const reusableInventory = staticState
    ? consumeReusableStaticInventory(staticState, root, inputs, onTiming)
    : undefined;
  const { bindings, validation } = measurePreparationSync(
    { phase: 'collection', operation: 'bind-validate' },
    onTiming,
    () => {
      const bindings = bindDiscovery(ledger, discoveries);
      const validation = validateLedger({
        inventory: withSurfaceNodes(
          measurePreparationSync(
            {
              phase: 'collection',
              operation: 'inventory',
              reused: reusableInventory !== undefined,
            },
            onTiming,
            () =>
              reusableInventory ??
              buildInventory(
                measurePreparationSync(
                  { phase: 'collection', operation: 'product-source' },
                  onTiming,
                  () => loadSource(root),
                ),
                measurePreparationSync(
                  { phase: 'collection', operation: 'story-source' },
                  onTiming,
                  () => loadStorySurfaceContext(root),
                ),
              ),
          ),
        ),
        ledger,
        registrations: bindings.registrations,
      });
      return { bindings, validation };
    },
  );
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
  const { legacy, allowedExtraTests } = await measurePreparation(
    { phase: 'collection', operation: 'legacy' },
    onTiming,
    async () => {
      const read = (name: string): unknown => {
        const contents = readArtifact(root, `e2e/ledger/${name}`);
        if (isNil(contents)) throw new Error('legacy移行台帳がありません。');
        return JSON.parse(contents);
      };
      const legacy = legacyManifestSchema.parse(
        read('legacy-tests.generated.json'),
      );
      const execution = legacyExecutionSchema.parse(
        read('legacy-execution.json'),
      );
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
      return { legacy, allowedExtraTests };
    },
  );
  const plan = measurePreparationSync(
    { phase: 'collection', operation: 'plan' },
    onTiming,
    () =>
      createVerificationPlan({
        ledger,
        discoveries,
        integrationCollection: integration,
        allowedExtraTests,
      }),
  );
  const after = await measurePreparation(
    { phase: 'collection', operation: 'checkpoint' },
    onTiming,
    () => captureInputs(root),
  );
  const changes = compareInputs(inputs, after);
  if (Object.values(changes).some((paths) => paths.length > 0))
    throw new Error('列挙中に検証入力が変化しました。');
  return {
    plan,
    inputs,
    scheduleExpected,
    integrationExpected,
    ledger,
    discoveries,
    legacy,
    integrationCollection: integration,
  };
};

/** 既存の全件runnerには従来の実行入力だけを渡す。 */
export const prepareVerification = async (root: string) => {
  const { plan, inputs, scheduleExpected, integrationExpected } =
    await prepareVerificationDetails(root);
  return { plan, inputs, scheduleExpected, integrationExpected };
};
