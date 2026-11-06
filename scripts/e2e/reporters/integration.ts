import { isNil } from 'ramda';
import { z } from 'zod';

import {
  integrationAttemptMetaSchema,
  integrationClaimSchema,
  integrationPathSchema,
  integrationReportSchema,
  integrationTestResultSchema,
} from '../integrationSchema';
import { createIntegrationVerificationReport } from '../integrationVerificationReport';
import { writeArtifact } from '../ledgerArtifacts';
import {
  readVerificationContext,
  verificationStagePath,
} from '../verificationContext';

import { writeFileSync } from 'node:fs';
import { relative, sep } from 'node:path';

import type {
  Reporter,
  SerializedError,
  TestCase,
  TestModule,
  TestRunEndReason,
  TestSuite,
  Vitest,
} from 'vitest/node';
import type { IntegrationTestResult } from '../integrationSchema';

const metadataSchema = z.object({
  ledger: integrationClaimSchema,
  integration: integrationAttemptMetaSchema.optional(),
});
const pathFor = (root: string, file: string) =>
  integrationPathSchema.parse(relative(root, file).split(sep).join('/'));
const titlesFor = (test: TestCase) => {
  const titles = [test.name];
  let parent: TestSuite | TestModule = test.parent;
  while (parent.type === 'suite') {
    titles.unshift(parent.name);
    parent = parent.parent;
  }
  return titles;
};

/** Vitest 3.2.4の標準API値と、許可したtask metadataだけを保存する。error本文や秘密envは転記しない。 */
export default class IntegrationReporter implements Reporter {
  private context: Vitest | undefined;
  private tests = new Map<string, IntegrationTestResult>();
  private reporterErrorCount = 0;

  onInit(context: Vitest) {
    this.context = context;
  }

  onTestCaseResult(test: TestCase) {
    const context = this.context;
    if (isNil(context)) {
      this.reporterErrorCount++;
      return;
    }
    try {
      const parsed = metadataSchema.parse(test.meta());
      const result = test.result();
      const diagnostic = test.diagnostic();
      const record = integrationTestResultSchema.parse({
        testId: test.id,
        file: pathFor(context.config.root, test.module.moduleId),
        titlePath: titlesFor(test),
        fullName: test.fullName,
        line: test.location?.line,
        column: test.location?.column,
        claim: parsed.ledger,
        options: {
          mode: test.options.mode,
          fails: test.options.fails ?? false,
          concurrent: test.options.concurrent ?? false,
          retry: test.options.retry ?? 0,
          repeats: test.options.repeats ?? 0,
        },
        state: result.state,
        errorCount: result.errors?.length ?? 0,
        diagnostic: isNil(diagnostic)
          ? null
          : {
              retryCount: diagnostic.retryCount,
              repeatCount: diagnostic.repeatCount,
              flaky: diagnostic.flaky,
              startTime: diagnostic.startTime,
              duration: diagnostic.duration,
            },
        meta: parsed.integration ?? null,
      });
      this.tests.set(test.id, record);
    } catch {
      this.reporterErrorCount++;
    }
  }

  onTestModuleEnd(_module: TestModule) {
    // afterAllを含む最終状態はrun終了時の標準module APIから取得する。
  }

  onTestRunEnd(
    modules: ReadonlyArray<TestModule>,
    unhandledErrors: ReadonlyArray<SerializedError>,
    reason: TestRunEndReason,
  ) {
    const context = this.context;
    if (isNil(context))
      throw new Error('integration reporter初期化がありません');
    const projects = context.projects;
    const project = projects[0];
    if (projects.length !== 1 || isNil(project))
      throw new Error('integration reporterのproject集合が不正です');
    // skip・未完了も省略しない。hook/cleanup後のmetadataを最終取得する。
    for (const module of modules)
      for (const test of module.children.allTests())
        this.onTestCaseResult(test);
    const report = integrationReportSchema.parse({
      schemaVersion: 1,
      runner: {
        name: 'vitest',
        version: context.version,
        project: project.config.name,
        pool: project.config.pool,
        fileParallelism: project.config.fileParallelism,
        maxWorkers: project.config.maxWorkers,
        includeTaskLocation: project.config.includeTaskLocation,
      },
      config: pathFor(
        context.config.root,
        context.vite.config.configFile || '',
      ),
      runId: process.env.SCENARIO_E2E_RUN_ID,
      tests: [...this.tests.values()],
      modules: modules.map((module) => ({
        file: pathFor(context.config.root, module.moduleId),
        project: module.project.config.name,
        state: module.state(),
        errorCount: module.errors().length,
        suiteErrorCount: [...module.children.allSuites()].reduce(
          (count, suite) =>
            count +
            suite.errors().length +
            (suite.state() === 'failed' ? 1 : 0),
          0,
        ),
      })),
      reason,
      unhandledErrorCount: unhandledErrors.length,
      reporterErrorCount: this.reporterErrorCount,
    });
    const verificationContext = readVerificationContext();
    writeArtifact(
      context.config.root,
      `test-results/integration/${report.runId}/vitest.json`,
      `${JSON.stringify(report, null, 2)}\n`,
    );
    if (!isNil(verificationContext)) {
      const standard = createIntegrationVerificationReport(
        verificationContext,
        report,
      );
      // stageは親lifecycleが準備する。既存証拠の上書きやdirectoryの自動補完はしない。
      writeFileSync(
        verificationStagePath(
          context.config.root,
          verificationContext,
          'vitest.json',
        ),
        `${JSON.stringify(standard, null, 2)}\n`,
        { flag: 'wx' },
      );
    }
  }
}
