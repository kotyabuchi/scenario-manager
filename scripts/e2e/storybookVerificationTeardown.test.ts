import { isNil } from 'ramda';
import { expect, it, vi } from 'vitest';
import { z } from 'zod';

import {
  localCommandEnvironment,
  runLocalCommand,
} from './environmentCommands';

import { randomUUID } from 'node:crypto';
import { mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { createRequire } from 'node:module';
import { createServer } from 'node:net';
import { join, resolve } from 'node:path';

const pidsSchema = z.object({
  wrapper: z.number().int().positive(),
  child: z.number().int().positive(),
});
const stopOwned = (pid: number) => {
  try {
    process.kill(pid, 'SIGKILL');
  } catch (error) {
    if (!z.object({ code: z.literal('ESRCH') }).safeParse(error).success)
      throw error;
  }
};
const listen = async (port = 0) => {
  const server = createServer();
  try {
    await new Promise<void>((resolveListen, reject) => {
      server.once('error', reject);
      server.listen(
        { host: '127.0.0.1', port, exclusive: true },
        resolveListen,
      );
    });
    const address = server.address();
    if (typeof address !== 'object' || isNil(address))
      throw new Error('port取得失敗');
    return address.port;
  } finally {
    if (server.listening)
      await new Promise<void>((resolveClose, reject) =>
        server.close((error) => (error ? reject(error) : resolveClose())),
      );
  }
};

it('実Playwrightの既定webServer停止が所有HTTP子を終了し、実close後にportを解放する', async () => {
  await mkdir(resolve('test-results'), { recursive: true });
  const root = await mkdtemp(resolve('test-results/storybook-teardown-'));
  const port = await listen();
  const token = randomUUID();
  const pidFile = join(root, 'owned-pids.json');
  const controller = new AbortController();
  const onClose = vi.fn();
  let pids: z.infer<typeof pidsSchema> | undefined;
  let running: Promise<string> | undefined;
  try {
    await writeFile(join(root, 'package.json'), '{"type":"module"}');
    await writeFile(
      join(root, 'http.mjs'),
      `
      import {createServer} from 'node:http';
      createServer((request,response)=>{response.end(${JSON.stringify(token)});}).listen(${port},'127.0.0.1');
    `,
    );
    await writeFile(
      join(root, 'wrapper.mjs'),
      `
      import {spawn} from 'node:child_process'; import {writeFileSync} from 'node:fs';
      const child=spawn(process.execPath,[${JSON.stringify(join(root, 'http.mjs'))}],{stdio:'inherit',detached:false});
      writeFileSync(${JSON.stringify(pidFile)},JSON.stringify({wrapper:process.pid,child:child.pid}),{flag:'wx'});
      child.once('close',code=>{process.exitCode=code??1;});
    `,
    );
    const command = `${JSON.stringify(process.execPath.replaceAll('\\', '/'))} ${JSON.stringify(join(root, 'wrapper.mjs').replaceAll('\\', '/'))}`;
    await writeFile(
      join(root, 'playwright.config.mjs'),
      `
      export default {testDir:'.',testMatch:'only.spec.mjs',workers:1,globalTimeout:30000,
        outputDir:'./output',reporter:'line',use:{baseURL:'http://127.0.0.1:${port}'},
        webServer:{command:${JSON.stringify(command)},url:'http://127.0.0.1:${port}',reuseExistingServer:false,timeout:10000}};
    `,
    );
    await writeFile(
      join(root, 'only.spec.mjs'),
      `
      import {test,expect} from '@playwright/test';
      test('HTTP child is owned',async({request})=>{expect(await(await request.get('/')).text()).toBe(${JSON.stringify(token)});});
    `,
    );
    const cli = createRequire(join(root, 'package.json')).resolve(
      '@playwright/test/cli',
    );
    running = runLocalCommand(
      'node',
      [cli, 'test', '--config', join(root, 'playwright.config.mjs')],
      {
        cwd: root,
        env: localCommandEnvironment(process.env),
        signal: controller.signal,
        onClose,
      },
    );
    await running;
    pids = pidsSchema.parse(JSON.parse(await readFile(pidFile, 'utf8')));
    expect(onClose).toHaveBeenCalledExactlyOnceWith({
      exitCode: 0,
      signal: null,
    });
    expect(await listen(port)).toBe(port);
  } finally {
    controller.abort();
    await running?.catch(() => {});
    // 失敗時も、このfixtureが生成して記録したPIDだけを回収する。共有processは検索しない。
    if (isNil(pids)) {
      const raw = await readFile(pidFile, 'utf8').catch(() => 'null');
      const parsed = pidsSchema.safeParse(JSON.parse(raw));
      if (parsed.success) pids = parsed.data;
    }
    const cleanup = await Promise.allSettled(
      (isNil(pids) ? [] : [pids.child, pids.wrapper]).map(async (pid) =>
        stopOwned(pid),
      ),
    );
    expect(cleanup.every(({ status }) => status === 'fulfilled')).toBe(true);
    await rm(root, {
      recursive: true,
      force: true,
      maxRetries: 20,
      retryDelay: 50,
    });
  }
}, 45_000);
