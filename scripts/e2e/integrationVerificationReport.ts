import { integrationReportSchema } from './integrationSchema';
import {
  verificationContextSchema,
  verificationReportSchema,
} from './verificationSchema';

import type { IntegrationReport } from './integrationSchema';
import type {
  VerificationContext,
  VerificationReport,
} from './verificationSchema';

/** 実fixture用reportから標準値だけを取り出し、lease/meta/例外本文を共通証拠へ渡さない。 */
export const createIntegrationVerificationReport = (
  context: VerificationContext,
  input: IntegrationReport,
): VerificationReport => {
  const report = integrationReportSchema.parse(input);
  return verificationReportSchema.parse({
    schemaVersion: 1,
    context: verificationContextSchema.parse(context),
    profile: 'integration',
    runner: 'vitest',
    version: report.runner.version,
    status: report.reason,
    errorCount:
      report.unhandledErrorCount +
      report.modules.reduce(
        (count, module) => count + module.errorCount + module.suiteErrorCount,
        0,
      ),
    reporterErrorCount: report.reporterErrorCount,
    reporterCompleted: true,
    vitest: {
      modules: report.modules,
      unhandledErrorCount: report.unhandledErrorCount,
    },
    tests: report.tests.map((test) => {
      const expectedStatus =
        test.options.mode === 'skip' || test.options.mode === 'todo'
          ? 'skipped'
          : test.options.fails
            ? 'failed'
            : 'passed';
      const outcome =
        test.state === 'pending'
          ? 'pending'
          : test.state === 'skipped'
            ? 'skipped'
            : test.diagnostic?.flaky
              ? 'flaky'
              : test.state === 'passed'
                ? 'expected'
                : 'unexpected';
      return {
        testId: test.testId,
        file: test.file,
        titlePath: test.titlePath,
        line: test.line,
        column: test.column,
        project: report.runner.project,
        repeatEachIndex: 0,
        expectedStatus,
        annotations: [],
        outcome,
        // 標準APIはfinal resultと累計diagnosticを返す。過去attemptの状態は捏造しない。
        results:
          test.state === 'pending'
            ? []
            : [
                {
                  retry: test.diagnostic?.retryCount ?? 0,
                  status: test.state,
                  errorCount: test.errorCount,
                  annotations: [],
                },
              ],
        vitest: { options: test.options, diagnostic: test.diagnostic },
      };
    }),
  });
};
