import { expect, it } from 'vitest';

import { spawn } from 'node:child_process';
import { createRequire } from 'node:module';
import { fileURLToPath, pathToFileURL } from 'node:url';

const helper = fileURLToPath(new URL('./progressStderr.ts', import.meta.url));
const tsx = pathToFileURL(createRequire(import.meta.url).resolve('tsx')).href;

it.each([
  'sync-throw',
  'closed-pipe',
])('%sでもstderrのリスナーは1個だけ増え、後始末まで実行する', async (mode) => {
  const script = `
      const { writeProgressStderr } = require(${JSON.stringify(helper)});
      const stderr = process.stderr;
      const before = stderr.listenerCount('error');
      let attempts = 0;
      process.stdin.on('end', async () => {
        if (process.argv[1] === 'sync-throw') {
          stderr.write = () => {
            attempts += 1;
            throw new Error('write failed');
          };
        }
        for (let index = 0; index < 32; index += 1) {
          writeProgressStderr('progress\\n');
        }
        if (process.argv[1] === 'closed-pipe') {
          while (!stderr.errored) {
            await new Promise((resolve) => setImmediate(resolve));
          }
        }
        process.stdout.write(JSON.stringify({
          cleanup: true,
          listeners: stderr.listenerCount('error') - before,
          error: stderr.errored?.code ?? null,
          attempts,
        }));
      });
      process.stdin.resume();
    `;
  const child = spawn(process.execPath, ['--import', tsx, '-e', script, mode], {
    stdio: 'pipe',
    timeout: 5_000,
    windowsHide: true,
  });
  let output = '';
  child.stdout.setEncoding('utf8').on('data', (chunk: string) => {
    output += chunk;
  });
  const exit = new Promise<number | null>((resolve, reject) => {
    child.once('error', reject);
    child.once('close', resolve);
  });
  // 子が書き込みを始める前に、親側のstderr読み取り口を閉じる。
  child.stderr.destroy();
  child.stdin.end();

  expect(await exit).toBe(0);
  expect(JSON.parse(output)).toEqual({
    cleanup: true,
    listeners: 1,
    error: mode === 'closed-pipe' ? 'EPIPE' : null,
    attempts: mode === 'sync-throw' ? 32 : 0,
  });
}, 10_000);
