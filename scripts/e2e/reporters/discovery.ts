import { isNil } from 'ramda';

import { discoverySchema } from '../discoverySchema';

import { randomUUID } from 'node:crypto';
import { realpathSync, renameSync, rmSync, writeFileSync } from 'node:fs';
import { isAbsolute, join, relative, sep } from 'node:path';

import type {
  FullConfig,
  FullResult,
  Reporter,
  Suite,
  TestCase,
  TestError,
} from '@playwright/test/reporter';
import type { Discovery } from '../discoverySchema';

const requiredEnvironment = (name: string) => {
  const value = process.env[name];
  if (!value) throw new Error(`列挙reporterに${name}が必要です`);
  return value;
};

const titlePath = (test: TestCase) => {
  const titles = [test.title];
  let parent: Suite | undefined = test.parent;
  while (!isNil(parent)) {
    if (parent?.type === 'describe') titles.unshift(parent.title);
    parent = parent?.parent;
  }
  return titles;
};

/** Playwrightの公開reporter APIから実際に登録されたtestを記録する。 */
export default class DiscoveryReporter implements Reporter {
  private report: Discovery = {
    schemaVersion: 1,
    profile: requiredEnvironment('E2E_DISCOVERY_PROFILE'),
    projects: [],
    tests: [],
    errors: [],
  };

  onBegin(config: FullConfig, suite: Suite): void {
    try {
      const root = realpathSync(requiredEnvironment('E2E_DISCOVERY_ROOT'));
      const relativePath = (file: string) => {
        const path = relative(root, realpathSync(file));
        if (isAbsolute(path) || path === '..' || path.startsWith(`..${sep}`))
          throw new Error('列挙対象がプロジェクト外を参照しています');
        return path.split(sep).join('/') || '.';
      };
      const setupProjects: unknown = JSON.parse(
        requiredEnvironment('E2E_DISCOVERY_SETUP_PROJECTS'),
      );
      if (
        !Array.isArray(setupProjects) ||
        !setupProjects.every((name): name is string => typeof name === 'string')
      )
        throw new Error('setupProjectsはproject名の配列で指定してください');
      for (const name of setupProjects) {
        if (!config.projects.some((project) => project.name === name))
          throw new Error(`setup projectが存在しません: ${name}`);
      }
      this.report.projects = config.projects
        .map((project) => ({
          name: project.name,
          testDir: relativePath(project.testDir),
          dependencies: [...project.dependencies].sort(),
          repeatEach: project.repeatEach,
        }))
        .sort((left, right) =>
          left.name < right.name ? -1 : left.name > right.name ? 1 : 0,
        );
      this.report.tests = suite
        .allTests()
        .map((test) => {
          const project = test.parent.project();
          if (isNil(project))
            throw new Error(`testのprojectが不明です: ${test.title}`);
          return {
            testId: test.id,
            file: relativePath(test.location.file),
            line: test.location.line,
            column: test.location.column,
            titlePath: titlePath(test),
            project: project.name,
            repeatEachIndex: test.repeatEachIndex,
            tags: [...test.tags].sort(),
            expectedStatus: test.expectedStatus,
            annotations: test.annotations.map(({ type, description }) => ({
              type,
              ...(!isNil(description) ? { description } : {}),
            })),
            isSetup: setupProjects.includes(project.name),
          };
        })
        .sort((left, right) => {
          const a = JSON.stringify([
            left.file,
            left.titlePath,
            left.project,
            left.repeatEachIndex,
            left.testId,
          ]);
          const b = JSON.stringify([
            right.file,
            right.titlePath,
            right.project,
            right.repeatEachIndex,
            right.testId,
          ]);
          return a < b ? -1 : a > b ? 1 : 0;
        });
    } catch (error) {
      this.report.errors.push(
        error instanceof Error ? error.message : String(error),
      );
    }
  }

  onError(error: TestError): void {
    this.report.errors.push(
      error.message ?? error.stack ?? error.value ?? 'Playwright登録エラー',
    );
  }

  onEnd(result: FullResult): void {
    if (result.status !== 'passed')
      this.report.errors.push(`Playwright終了status: ${result.status}`);
    const directory = requiredEnvironment('E2E_DISCOVERY_DIRECTORY');
    const temporary = join(directory, `${randomUUID()}.tmp`);
    try {
      writeFileSync(
        temporary,
        `${JSON.stringify(discoverySchema.parse(this.report), null, 2)}\n`,
        { flag: 'wx' },
      );
      renameSync(temporary, join(directory, 'discovery.json'));
    } finally {
      rmSync(temporary, { force: true });
    }
  }

  printsToStdio(): boolean {
    return false;
  }
}
