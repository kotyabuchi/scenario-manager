// test import前に先行ロードする。通常のtestから新しい実行主体を作らせない。
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
require('./discoveryGuard.cjs');
threads.Worker = class {
  constructor() {
    globalThis[Symbol.for('scenario-manager.discovery.deny')](
      'worker_threads.Worker',
    );
  }
};
moduleApi.syncBuiltinESMExports();
