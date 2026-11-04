import { writeArtifact } from './ledgerArtifacts';
import {
  baselineDigest,
  checkStaticState,
  collectStaticState,
} from './staticGate';
import { resolveRevisions } from './trustedRevision';

import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

/** CIではeventだけを使い、ローカルは呼出者が比較baseを明示する。 */
export const runLedgerCheck = async (
  args: string[],
  root = process.cwd(),
  env = process.env,
) => {
  const saveReport = (report: unknown) =>
    writeArtifact(
      root,
      'test-results/quality/static-gate.json',
      `${JSON.stringify(report, null, 2)}\n`,
    );
  // 中途失敗や中断でも、前回の成功reportを今回の結果として残さない。
  saveReport({ stage: 'M1-static', status: 'running' });
  try {
    if (
      args.length !== 0 &&
      (args.length !== 2 ||
        args[0] !== '--base' ||
        !args[1] ||
        args[1].startsWith('-'))
    )
      throw new Error(
        '使用法: e2e:ledger:check --base <比較ref>（CIでは引数なし）',
      );
    const revisions = await resolveRevisions({
      root,
      env,
      ...(args[1] ? { base: args[1] } : {}),
    });
    const state = await collectStaticState(root);
    const result = await checkStaticState({
      root,
      state,
      revisions,
      ...(env.E2E_LEDGER_BOOTSTRAP_APPROVAL
        ? { bootstrapApproval: env.E2E_LEDGER_BOOTSTRAP_APPROVAL }
        : {}),
    });
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
  } catch (error) {
    saveReport({
      stage: 'M1-static',
      status: 'failed',
      message:
        error instanceof Error ? error.message : '静的台帳の検査に失敗しました',
    });
    throw error;
  }
};

if (
  process.argv[1] &&
  resolve(process.argv[1]) === fileURLToPath(import.meta.url)
) {
  runLedgerCheck(process.argv.slice(2))
    .then((passed) => {
      if (!passed) process.exitCode = 1;
    })
    .catch((error: unknown) => {
      process.stderr.write(
        `${error instanceof Error ? error.message : '静的台帳の検査に失敗しました'}\n`,
      );
      process.exitCode = 1;
    });
}
