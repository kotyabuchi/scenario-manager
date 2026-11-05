import { discoverIntegration } from './discoverIntegration';
import { bindDiscovery } from './discoveryBindings';
import {
  createIntegrationExpectations,
  scopeIntegrationLedger,
} from './integrationExpectations';
import { buildInventory } from './inventory';
import { loadLedger } from './ledger';
import { writeArtifact } from './ledgerArtifacts';
import { validateLedger } from './requirements';
import {
  INTEGRATION_RECEIPT,
  runIntegrationEnvironment,
} from './runIntegrationCheck';
import { loadSource } from './source';

import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

/** 全collectorの終了を待ち、台帳・case・標準登録を照合してから専用DBの起動を許可する。 */
export const prepareIntegrationCheck = async (root: string) => {
  const [ledgerResult, collectionResult] = await Promise.allSettled([
    loadLedger(root),
    discoverIntegration({ root }),
  ]);
  if (ledgerResult.status === 'rejected') throw ledgerResult.reason;
  if (collectionResult.status === 'rejected') throw collectionResult.reason;
  const ledger = scopeIntegrationLedger(ledgerResult.value);
  const collection = collectionResult.value;
  const bindings = bindDiscovery(ledger, [collection.discovery]);
  const validation = validateLedger({
    inventory: buildInventory(loadSource(root)),
    ledger,
    registrations: bindings.registrations,
  });
  if (bindings.issues.length > 0 || validation.issues.length > 0)
    throw new Error('integrationの台帳と登録が一致しません。');
  const expected = createIntegrationExpectations(ledger, collection);
  writeArtifact(
    root,
    'test-results/quality/integration-discovery.json',
    `${JSON.stringify(collection, null, 2)}\n`,
  );
  return expected;
};

/** 静的preflightの失敗で古い成功receiptを残さず、環境を起動しない。 */
export const runIntegrationCheck = async (root: string) => {
  writeArtifact(
    root,
    INTEGRATION_RECEIPT,
    `${JSON.stringify({ schemaVersion: 1, stage: 'schedule-integration', status: 'running', phase: 'discovery' })}\n`,
  );
  try {
    return await runIntegrationEnvironment(
      root,
      await prepareIntegrationCheck(root),
    );
  } catch {
    const result = {
      status: 'failed',
      phase: 'discovery',
      runId: null,
      evidence: null,
    } as const;
    writeArtifact(
      root,
      INTEGRATION_RECEIPT,
      `${JSON.stringify({ schemaVersion: 1, stage: 'schedule-integration', ...result })}\n`,
    );
    return result;
  }
};

const entry = process.argv[1];
if (entry && import.meta.url === pathToFileURL(resolve(entry)).href) {
  const result = await runIntegrationCheck(process.cwd());
  process.stdout.write(`${JSON.stringify(result)}\n`);
  process.exitCode = result.status === 'passed' ? 0 : 1;
}
