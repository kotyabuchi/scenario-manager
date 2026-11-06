// installed toolingだけを準備してから、coordinatorとcollect worker双方を封鎖する。

import childProcess from 'node:child_process';
import fs from 'node:fs';
import { createRequire, syncBuiltinESMExports } from 'node:module';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const require = createRequire(import.meta.url);
const directory = fs.realpathSync(process.env.E2E_DISCOVERY_DIRECTORY);
const request = JSON.parse(
  fs.readFileSync(path.join(directory, 'request.json'), 'utf8'),
);
const tools = path.dirname(fileURLToPath(import.meta.url));
// Tinypoolのimport時CPU probeは不要。shellを実行せずos.cpusのfallbackを使わせる。
childProcess.execSync = () => {
  throw new Error('collect bootstrapではshellを起動しません');
};
syncBuiltinESMExports();
const { createVitest, version } = await import('vitest/node');
const viteRequire = createRequire(require.resolve('vite/package.json'));
const esbuild = viteRequire('esbuild');
const configPath = path.resolve(
  tools,
  '../../vitest.integration.collect.config.ts',
);
const compiled = await esbuild.transform(fs.readFileSync(configPath, 'utf8'), {
  loader: 'ts',
  format: 'esm',
});
const { default: configuration } = await import(
  `data:text/javascript,${encodeURIComponent(compiled.code)}`
);
let context;
try {
  context = await createVitest(
    'test',
    {
      ...configuration.test,
      root: request.root,
      config: false,
      include: request.files,
      poolOptions: {
        threads: {
          execArgv: [
            '--require',
            path.join(tools, 'integrationCollectWorker.cjs'),
          ],
        },
      },
    },
    {
      cacheDir: path.join(directory, 'cache'),
      envDir: path.join(directory, 'empty-env'),
      resolve: { alias: { '@': path.join(request.root, 'src') } },
      server: { middlewareMode: true, hmr: false, ws: false, watch: null },
    },
  );
  // config:falseの固定tool初期化後、test module/globalSetup評価より前に封鎖する。
  require('./discoveryGuard.cjs');
  const collected = await context.collect();
  if (
    collected.unhandledErrors.length ||
    collected.testModules.some((module) => module.errors().length)
  )
    throw new Error('Vitest collectionに失敗しました');
  const tests = [];
  for (const module of collected.testModules) {
    for (const test of module.children.allTests()) {
      const titles = [test.name];
      let parent = test.parent;
      while (parent.type === 'suite') {
        titles.unshift(parent.name);
        parent = parent.parent;
      }
      tests.push({
        testId: test.id,
        file: path
          .relative(request.root, module.moduleId)
          .split(path.sep)
          .join('/'),
        titlePath: titles,
        fullName: test.fullName,
        line: test.location?.line,
        column: test.location?.column,
        claim: test.meta().ledger,
        options: {
          mode: test.options.mode,
          fails: test.options.fails ?? false,
          concurrent: test.options.concurrent ?? false,
          retry: test.options.retry ?? 0,
          repeats: test.options.repeats ?? 0,
        },
      });
    }
  }
  fs.writeFileSync(
    path.join(directory, 'collection.json'),
    JSON.stringify({
      tests,
      runner: {
        name: 'vitest',
        version,
        project: context.config.name,
        pool: context.config.pool,
        fileParallelism: context.config.fileParallelism,
        maxWorkers: context.config.maxWorkers,
        includeTaskLocation: context.config.includeTaskLocation,
      },
    }),
  );
} finally {
  await context?.close();
  esbuild.stop();
}
