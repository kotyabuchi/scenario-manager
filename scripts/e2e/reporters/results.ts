import { isNil } from 'ramda';

import {
  readVerificationContext,
  verificationStagePath,
} from '../verificationContext';
import { verificationReportSchema } from '../verificationSchema';

import { realpathSync, writeFileSync } from 'node:fs';
import { isAbsolute, relative, sep } from 'node:path';

import type {
  FullConfig,
  FullResult,
  Reporter,
  Suite,
  TestCase,
} from 'playwright/types/testReporter';

const annotations = (values: TestCase['annotations']) =>
  values.map(({ type, description }) => ({
    type,
    ...(!isNil(description) ? { description } : {}),
  }));

const titlePath = (test: TestCase) => {
  const titles = [test.title];
  let parent: Suite | undefined = test.parent;
  while (!isNil(parent)) {
    if (parent?.type === 'describe') titles.unshift(parent.title);
    parent = parent?.parent;
  }
  return titles;
};

/** 標準runner値だけを共通結果に保存し、本文・添付・SDK情報を持ち込まない。 */
export default class ResultsReporter implements Reporter {
  private readonly root = realpathSync(process.cwd());
  private readonly context = readVerificationContext();
  private config: FullConfig | undefined;
  private tests: TestCase[] = [];
  private errorCount = 0;

  constructor(private readonly options: { profile: string }) {
    if (isNil(this.context))
      throw new Error('verification contextが設定されていません。');
  }

  onBegin(config: FullConfig, suite: Suite): void {
    this.config = config;
    // onTestEndの列挙だけでは未実行testを消すため、開始時の全件を保持する。
    this.tests = suite.allTests();
  }

  onError(): void {
    this.errorCount++;
  }

  async onEnd(
    result: FullResult,
  ): Promise<{ status: FullResult['status'] } | undefined> {
    try {
      if (isNil(this.context) || isNil(this.config))
        throw new Error('verification reporterの初期化が未完了です。');
      const report = verificationReportSchema.parse({
        schemaVersion: 1,
        context: this.context,
        profile: this.options.profile,
        runner: 'playwright',
        version: this.config.version,
        status: result.status === 'timedout' ? 'timedOut' : result.status,
        errorCount: this.errorCount,
        reporterErrorCount: 0,
        reporterCompleted: true,
        tests: this.tests.map((test) => {
          const project = test.parent.project();
          const file = relative(this.root, realpathSync(test.location.file));
          if (
            isNil(project) ||
            isAbsolute(file) ||
            file === '..' ||
            file.startsWith(`..${sep}`)
          )
            throw new Error('verification対象のprojectまたはpathが不正です。');
          return {
            testId: test.id,
            file: file.split(sep).join('/'),
            line: test.location.line,
            column: test.location.column,
            titlePath: titlePath(test),
            project: project.name,
            repeatEachIndex: test.repeatEachIndex,
            expectedStatus: test.expectedStatus,
            annotations: annotations(test.annotations),
            outcome: test.results.length === 0 ? 'pending' : test.outcome(),
            results: test.results.map((attempt) => ({
              retry: attempt.retry,
              status: attempt.status,
              errorCount: attempt.errors.length,
              annotations: annotations(attempt.annotations),
            })),
          };
        }),
      });
      writeFileSync(
        verificationStagePath(this.root, this.context, 'playwright.json'),
        `${JSON.stringify(report, null, 2)}\n`,
        { flag: 'wx' },
      );
    } catch {
      // Playwrightはreporter例外を吸収するため、終了statusを明示的に失敗へ戻す。
      return { status: 'failed' };
    }
    return undefined;
  }

  printsToStdio(): boolean {
    return false;
  }
}
