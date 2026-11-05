import { isNil } from 'ramda';

import { parseVerificationArguments } from './verificationArguments';
import { runVerification } from './verificationRun';

import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

export {
  runVerification,
  type VerificationRunOptions,
} from './verificationRun';

const entry = process.argv[1];
if (!isNil(entry) && import.meta.url === pathToFileURL(resolve(entry)).href) {
  const args = parseVerificationArguments(process.argv.slice(2));
  if (args.changed) {
    const { runChangedVerification } = await import('./runChangedVerification');
    const { selectionConsoleSummary } = await import(
      './selectionConsoleSummary'
    );
    const result = await runChangedVerification(process.cwd(), args);
    process.stdout.write(
      `${JSON.stringify(selectionConsoleSummary(result))}\n`,
    );
    if (result.status !== 'passed') process.exitCode = 1;
  } else {
    const result = await runVerification(process.cwd());
    process.stdout.write(
      `${JSON.stringify({ status: result.status, phase: result.phase, verificationId: result.verificationId, counts: result.verification?.counts, issueCount: result.verification?.issues.length })}\n`,
    );
    if (result.status !== 'passed') process.exitCode = 1;
  }
}
