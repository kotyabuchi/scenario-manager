import { isNil } from 'ramda';

import { writeArtifact } from './ledgerArtifacts';
import {
  baselineDigest,
  checkStaticState,
  collectStaticState,
} from './staticGate';
import {
  InvalidLedgerCheckArgumentsError,
  recordStaticLedgerFailure,
} from './staticLedgerFailure';
import { resolveRevisions } from './trustedRevision';

import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const ARTIFACT_PATH = 'test-results/quality/static-gate.json';

/** CIではeventだけを使い、ローカルは呼出者が比較baseを明示する。 */
export const runLedgerCheck = async (
  args: string[],
  root = process.cwd(),
  env = process.env,
) => {
  const saveReport = (report: unknown) =>
    writeArtifact(root, ARTIFACT_PATH, `${JSON.stringify(report, null, 2)}\n`);
  // 中途失敗や中断でも、前回の成功reportを今回の結果として残さない。
  saveReport({ stage: 'M1-static', status: 'running' });
  let revisions: Awaited<ReturnType<typeof resolveRevisions>> | undefined;
  let state: Awaited<ReturnType<typeof collectStaticState>> | undefined;
  let result: Awaited<ReturnType<typeof checkStaticState>>;
  try {
    if (
      args.length !== 0 &&
      (args.length !== 2 ||
        args[0] !== '--base' ||
        !args[1] ||
        args[1].startsWith('-'))
    )
      throw new InvalidLedgerCheckArgumentsError();
    revisions = await resolveRevisions({
      root,
      env,
      ...(args[1] ? { base: args[1] } : {}),
    });
    state = await collectStaticState(root);
    result = await checkStaticState({
      root,
      state,
      revisions,
      ...(env.E2E_LEDGER_BOOTSTRAP_APPROVAL
        ? { bootstrapApproval: env.E2E_LEDGER_BOOTSTRAP_APPROVAL }
        : {}),
    });
  } catch (error) {
    throw recordStaticLedgerFailure({
      root,
      artifactPath: ARTIFACT_PATH,
      error,
      stage: 'M1-static',
      ...(isNil(revisions) ? {} : { revisions }),
      bindings: state?.inventory.surfaceAnalysis.bindings,
    });
  }
  const passed = result.issues.length === 0;
  const report = {
    stage: 'M1-static',
    status: passed ? 'passed' : 'failed',
    ...revisions,
    baselineDigest: baselineDigest(state.baseline),
    registrations: state.registrations,
    pendingItems: state.baseline.items.length,
    legacyTests: state.legacy.tests.length,
    ...result,
  };
  saveReport(report);
  process.stdout.write(`${JSON.stringify(report)}\n`);
  return passed;
};

if (
  process.argv[1] &&
  resolve(process.argv[1]) === fileURLToPath(import.meta.url)
) {
  runLedgerCheck(process.argv.slice(2))
    .then((passed) => {
      if (!passed) process.exitCode = 1;
    })
    .catch(() => {
      process.exitCode = 1;
    });
}
