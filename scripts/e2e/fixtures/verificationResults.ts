import { mkdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';

/** アプリ・ブラウザ・DBを使わず、標準Playwright runnerの結果境界を再現する。 */
export const createVerificationResultsFixture = async (
  root: string,
  reporter: string,
  mode: 'passed' | 'outcomes' | 'stop' | 'on-error',
) => {
  await mkdir(join(root, 'specs'));
  await writeFile(join(root, 'package.json'), '{"type":"module"}');
  await writeFile(
    join(root, 'playwright.config.ts'),
    `import { defineConfig } from '@playwright/test';
export default defineConfig({
  testDir: './specs', workers: 1, retries: 0, outputDir: './output',
  reporter: [[${JSON.stringify(reporter)}, { profile: 'fixture' }], ['json', { outputFile: './private.json' }]],
  ${mode === 'stop' ? 'maxFailures: 1,' : ''}
  ${mode === 'on-error' ? "globalSetup: './global-setup.ts'," : ''}
  projects: [
    { name: 'setup', testMatch: /setup.spec.ts/ },
    { name: 'desktop', testMatch: /main.spec.ts/, repeatEach: 2, dependencies: ['setup'] },
  ],
});`,
  );
  await writeFile(
    join(root, 'specs/setup.spec.ts'),
    "import { test } from '@playwright/test'; test('setup', async () => {});",
  );
  await writeFile(
    join(root, 'global-setup.ts'),
    "export default async function setup() { throw new Error('PRIVATE_ON_ERROR'); }",
  );
  await writeFile(
    join(root, 'specs/main.spec.ts'),
    `import { test, expect } from '@playwright/test';
type Case = {
  title: string;
  binding: string;
};
const cases: Case[] = [{ title: 'one', binding: 'main' }, { title: 'two', binding: 'secondary' }];
for (const item of cases) {
  test(item.title, { tag: ['@case:fixture', '@variant:default', '@binding:' + item.binding],
    annotation: { type: 'fixture-note', description: 'safe description' } }, async ({}, info) => {
    await info.attach('fixture-evidence', { contentType: 'application/json', body: Buffer.from('PRIVATE_ATTACHMENT') });
    process.stdout.write('PRIVATE_STDOUT');
    expect(${JSON.stringify(mode)} !== 'stop' || info.repeatEachIndex !== 0).toBe(true);
    expect(${JSON.stringify(mode)} !== 'outcomes' || info.repeatEachIndex !== 1).toBe(true);
  });
}
for (const suite of ['same-one', 'same-two']) {
  test.describe(suite, () => { test('same title', async () => {}); });
}
${
  mode === 'outcomes'
    ? `
test.skip('skip', async () => {});
test('xfail', async () => { test.fail(); throw new Error('PRIVATE_XFAIL'); });
test.describe('retry', () => {
  test.describe.configure({ retries: 1 });
  test('eventually passes', async ({}, info) => { expect(info.retry).toBe(1); });
});`
    : ''
}
`,
  );
  return join(root, 'playwright.config.ts');
};
