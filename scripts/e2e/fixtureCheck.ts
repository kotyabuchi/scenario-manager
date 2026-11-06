import { isNil } from 'ramda';

import { validateFixtureCheckEvidence } from './fixtureCheckEvidence';
import { runIsolatedCheck } from './runIsolatedCheck';

import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

/** 本番アプリと実browserでfixture基盤だけを検査する。業務caseの証拠ではない。 */
export const runFixtureCheck = (root: string) =>
  runIsolatedCheck(root, {
    stage: 'fixture-foundation',
    receipt: 'test-results/quality/fixture-check.json',
    label: 'fixture-check',
    config: 'playwright.fixture-check.config.ts',
    validate: ({ report, journals }) =>
      validateFixtureCheckEvidence(report, journals),
  });

const entry = process.argv[1];
if (!isNil(entry) && import.meta.url === pathToFileURL(resolve(entry)).href) {
  const result = await runFixtureCheck(process.cwd());
  process.stdout.write(`${JSON.stringify(result)}\n`);
  process.exitCode = result.status === 'passed' ? 0 : 1;
}
