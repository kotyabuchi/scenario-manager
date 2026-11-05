import { describe, expect, it } from 'vitest';

import { localCommandEnvironment } from './environmentCommands';
import { resolveStorybookVerificationCli } from './storybookVerificationCli';

import { execFile } from 'node:child_process';
import { lstatSync, realpathSync } from 'node:fs';
import { promisify } from 'node:util';

describe('installed Storybook/Vite CLI', () => {
  it.each([
    'storybook',
    'vite',
  ] as const)('%sの宣言entryをNodeで起動できる', async (name) => {
    const root = realpathSync(process.cwd());
    const cli = resolveStorybookVerificationCli(root, name);
    expect(lstatSync(cli).isFile()).toBe(true);
    const { stdout } = await promisify(execFile)(
      process.execPath,
      name === 'storybook' ? [cli, 'build', '--help'] : [cli, '--version'],
      {
        cwd: root,
        env: localCommandEnvironment(process.env),
        windowsHide: true,
        timeout: 15_000,
      },
    );
    expect(stdout).toMatch(
      name === 'storybook' ? /--output-dir/ : /vite\/5\.2\.10/,
    );
  }, 20_000);
});
