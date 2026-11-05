import { expect, it } from 'vitest';

import { localCommandEnvironment } from '../environmentCommands';
import {
  prepareVerificationDirectory,
  prepareVerificationStage,
  verificationEnvironment,
  verificationStagePath,
} from '../verificationContext';
import { verificationReportSchema } from '../verificationSchema';

import { execFile } from 'node:child_process';
import { mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { createRequire } from 'node:module';
import { basename, dirname, join, resolve } from 'node:path';
import { promisify } from 'node:util';

it('Playwrightのassertionをhook/fixture/捕捉済みexpectと区別し生エラーを保存しない', async () => {
  const parent = resolve('test-results');
  await mkdir(parent, { recursive: true });
  const root = await mkdtemp(join(parent, 'reporter-assertion-'));
  if (
    dirname(root) !== parent ||
    !basename(root).startsWith('reporter-assertion-')
  )
    throw new Error('fixture削除先が不正です');
  try {
    const context = {
      verificationId: '123456abcdef',
      stageId: 'storybook',
      selectionDigest: 'a'.repeat(64),
      inputDigest: 'b'.repeat(64),
    };
    prepareVerificationDirectory(root, context.verificationId);
    prepareVerificationStage(root, context);
    await writeFile(join(root, 'package.json'), '{"type":"module"}');
    const reporter = resolve('scripts/e2e/reporters/results.ts');
    await writeFile(
      join(root, 'playwright.config.ts'),
      `import { defineConfig } from '@playwright/test';
export default defineConfig({ testDir:'.', outputDir:'./artifacts', workers:1, reporter:[[${JSON.stringify(reporter)},{profile:'storybook'}]] });`,
    );
    await writeFile(
      join(root, 'main.spec.ts'),
      `import { test, expect } from '@playwright/test';
test('body assertion', () => expect('SECRET_BODY').toBe('different'));
test.describe('with hook', () => {
  test.beforeEach(() => expect('SECRET_HOOK').toBe('different'));
  test('hook assertion', () => {});
});
const fixtureTest = test.extend({ fixture: async ({}, use) => {
  expect('SECRET_FIXTURE').toBe('different');
  await use(1);
} });
fixtureTest('fixture assertion', ({ fixture }) => expect(fixture).toBe(1));
test('different error after caught expect', () => {
  try { expect('SECRET_CAUGHT').toBe('different'); } catch {}
  throw new Error('SECRET_UNRELATED');
});
test('pass', () => expect(true).toBe(true));`,
    );
    const cli = createRequire(join(root, 'package.json')).resolve(
      '@playwright/test/cli',
    );
    await expect(
      promisify(execFile)(process.execPath, [cli, 'test'], {
        cwd: root,
        timeout: 30_000,
        env: {
          ...localCommandEnvironment(process.env),
          ...verificationEnvironment(context),
        },
      }),
    ).rejects.toMatchObject({ code: 1 });
    const raw = await readFile(
      verificationStagePath(root, context, 'playwright.json'),
      'utf8',
    );
    expect(raw).not.toContain('SECRET_');
    const report = verificationReportSchema.parse(JSON.parse(raw));
    expect(report.tests).toHaveLength(5);
    expect(
      report.tests
        .filter(({ results }) =>
          results.some(({ failureKind }) => failureKind === 'assertion'),
        )
        .map(({ titlePath }) => titlePath.at(-1)),
    ).toEqual(['body assertion']);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
}, 45_000);
