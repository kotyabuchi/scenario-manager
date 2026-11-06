import { isNil } from 'ramda';

import { discover } from './discover';
import { bindDiscovery } from './discoveryBindings';
import { buildInventory } from './inventory';
import { loadLedger } from './ledger';
import { writeArtifact } from './ledgerArtifacts';
import { validateLedger } from './requirements';
import { runIsolatedCheck } from './runIsolatedCheck';
import { validateScheduleCheckEvidence } from './scheduleCheckEvidence';
import { createScheduleExpectations } from './scheduleCheckExpectations';
import { loadSource } from './source';

import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

const RECEIPT = 'test-results/quality/schedule-check.json';

/** 日程browserの台帳・実登録集合を、環境起動前に照合する。 */
export const prepareScheduleCheck = async (root: string) => {
  const [ledgerResult, discoveryResult] = await Promise.allSettled([
    loadLedger(root),
    discover({
      root,
      profile: 'isolated',
      config: 'playwright.isolated.config.ts',
      setupProjects: [],
    }),
  ]);
  if (ledgerResult.status === 'rejected') throw ledgerResult.reason;
  if (discoveryResult.status === 'rejected') throw discoveryResult.reason;
  const ledger = ledgerResult.value;
  const discovery = discoveryResult.value;
  const scoped = {
    ...ledger,
    scenarios: ledger.scenarios
      .map((scenario) => ({
        ...scenario,
        cases: scenario.cases.filter(
          (item) =>
            item.layer === 'browser' &&
            item.executions.some(({ profile }) => profile === 'isolated'),
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
              ({ profile }) => profile === 'isolated',
            ),
          }))
          .filter(({ executions }) => executions.length > 0),
      }))
      .filter(({ requirements }) => requirements.length > 0),
    exceptions: ledger.exceptions.filter(
      ({ deficiency }) => deficiency.profile === 'isolated',
    ),
  };
  const bindings = bindDiscovery(scoped, [discovery]);
  const validation = validateLedger({
    inventory: buildInventory(loadSource(root)),
    ledger: scoped,
    registrations: bindings.registrations,
  });
  if (bindings.issues.length > 0 || validation.issues.length > 0)
    throw new Error('日程browserの台帳と登録が一致しません。');
  const expected = createScheduleExpectations(scoped, discovery);
  writeArtifact(
    root,
    'test-results/quality/schedule-discovery.json',
    `${JSON.stringify(discovery, null, 2)}\n`,
  );
  return expected;
};

/** Batch 9の日程実run入口。runner・fixture・所有環境の全成功後だけpassedにする。 */
export const runScheduleCheck = async (root: string) => {
  writeArtifact(
    root,
    RECEIPT,
    `${JSON.stringify({ schemaVersion: 1, stage: 'schedule-browser', status: 'running', phase: 'discovery' })}\n`,
  );
  try {
    const expected = await prepareScheduleCheck(root);
    return await runIsolatedCheck(root, {
      stage: 'schedule-browser',
      receipt: RECEIPT,
      label: 'schedule-check',
      config: 'playwright.isolated.config.ts',
      validate: (input) =>
        validateScheduleCheckEvidence({ ...input, expected }),
    });
  } catch {
    const result = {
      status: 'failed',
      phase: 'discovery',
      runId: null,
      evidence: null,
    } as const;
    writeArtifact(
      root,
      RECEIPT,
      `${JSON.stringify({ schemaVersion: 1, stage: 'schedule-browser', ...result })}\n`,
    );
    return result;
  }
};

const entry = process.argv[1];
if (!isNil(entry) && import.meta.url === pathToFileURL(resolve(entry)).href) {
  const result = await runScheduleCheck(process.cwd());
  process.stdout.write(`${JSON.stringify(result)}\n`);
  process.exitCode = result.status === 'passed' ? 0 : 1;
}
