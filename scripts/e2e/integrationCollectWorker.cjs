// test import前に先行ロードする。通常のtestから新しい実行主体を作らせない。
const childProcess = require('node:child_process');
const fs = require('node:fs');
const path = require('node:path');
const threads = require('node:worker_threads');
const moduleApi = require('node:module');
const parent = process.env.E2E_DISCOVERY_DIRECTORY;
if (!parent || !path.isAbsolute(parent))
  throw new Error('collect directoryが不正です');
const directory = path.join(
  fs.realpathSync(parent),
  `worker-${threads.threadId}`,
);
fs.mkdirSync(directory, { recursive: true });
process.env.E2E_DISCOVERY_DIRECTORY = directory;

// 固定VitestのTinypoolだけを先に初期化し、CPU数の取得はshellを使わずに代替させる。
const requireFromVitest = moduleApi.createRequire(
  require.resolve('vitest/package.json'),
);
const execSync = childProcess.execSync;
childProcess.execSync = () => {
  throw new Error('collect bootstrapではshellを起動しません');
};
moduleApi.syncBuiltinESMExports();
try {
  requireFromVitest('tinypool');
} finally {
  childProcess.execSync = execSync;
}
require('./discoveryGuard.cjs');
threads.Worker = class {
  constructor() {
    globalThis[Symbol.for('scenario-manager.discovery.deny')](
      'worker_threads.Worker',
    );
  }
};
moduleApi.syncBuiltinESMExports();
