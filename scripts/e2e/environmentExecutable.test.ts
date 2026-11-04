import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { resolveLocalExecutable } from './environmentExecutable';

import {
  chmod,
  mkdir,
  mkdtemp,
  realpath,
  rm,
  writeFile,
} from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';

let root = '';
const windowsEnv = (path: string): NodeJS.ProcessEnv => ({
  ...process.env,
  PATH: path,
  Path: path,
});
const file = async (name: string, contents: string | Buffer) => {
  const target = join(root, name);
  await mkdir(dirname(target), { recursive: true });
  await writeFile(target, contents);
  return target;
};

beforeEach(async () => {
  root = await realpath(await mkdtemp(join(tmpdir(), 'sm-native-executable-')));
});
afterEach(async () => {
  if (
    dirname(root) !== (await realpath(tmpdir())) ||
    !root.includes('sm-native-executable-')
  )
    throw new Error('fixture cleanupの範囲外です。');
  await rm(root, { recursive: true, force: true });
});

describe('native CLIの実体解決', () => {
  it('Scoopのpath-only shimを経由せず実exeの物理pathを返す', async () => {
    await file('shims/supabase.exe', 'MZshim');
    const native = await file('apps/2.75.0/supabase.exe', 'MZnative');
    await file('shims/supabase.shim', `path = "${native}"\r\n`);
    expect(
      await resolveLocalExecutable(
        'supabase',
        windowsEnv(join(root, 'shims')),
        'win32',
      ),
    ).toBe(await realpath(native));
  });

  it('PATH順を維持し、shimのない直接exeも実体へ固定する', async () => {
    const native = await file('bin/git.exe', 'MZnative');
    await file('other/git.exe', 'MZother');
    expect(
      await resolveLocalExecutable(
        'git',
        windowsEnv(
          `${join(root, 'missing')};${join(root, 'bin')};${join(root, 'other')}`,
        ),
        'win32',
      ),
    ).toBe(await realpath(native));
  });

  it.each([
    'path = "relative.exe"',
    'path = "native.cmd"',
    'args = "--remote"',
    'unknown = true',
    'x'.repeat(4_097),
  ])('未対応wrapperを推測せず拒否する: %#', async (metadata) => {
    await file('supabase.exe', 'MZshim');
    await file('supabase.shim', metadata);
    await expect(
      resolveLocalExecutable('supabase', windowsEnv(root), 'win32'),
    ).rejects.toThrow();
  });

  it('絶対pathが正しくてもargs付きshimは拒否する', async () => {
    await file('supabase.exe', 'MZshim');
    const target = await file('native/supabase.exe', 'MZnative');
    await file('supabase.shim', `path = "${target}"\nargs = "--linked"`);
    await expect(
      resolveLocalExecutable('supabase', windowsEnv(root), 'win32'),
    ).rejects.toThrow('path-only');
  });

  it('shimの循環と存在しない参照先を拒否する', async () => {
    const target = await file('supabase.exe', 'MZshim');
    await file('supabase.shim', `path = "${target}"`);
    await expect(
      resolveLocalExecutable('supabase', windowsEnv(root), 'win32'),
    ).rejects.toThrow('循環');
    await file('supabase.shim', `path = "${join(root, 'missing.exe')}"`);
    await expect(
      resolveLocalExecutable('supabase', windowsEnv(root), 'win32'),
    ).rejects.toThrow();
  });

  it('exeに見えるscriptやcmd-only wrapperをnativeとして返さない', async () => {
    await file('supabase.exe', '#!/bin/sh\nexec remote');
    await expect(
      resolveLocalExecutable('supabase', windowsEnv(root), 'win32'),
    ).rejects.toThrow('script wrapper');
    await file('docker.cmd', '@echo off');
    await expect(
      resolveLocalExecutable('docker', windowsEnv(root), 'win32'),
    ).rejects.toThrow('PATH');
  });

  it('POSIXのnative binaryを返しshebang wrapperを拒否する', async () => {
    const target = await file(
      'supabase',
      Buffer.from('7f454c4600000000', 'hex'),
    );
    await chmod(target, 0o700);
    expect(
      await resolveLocalExecutable(
        'supabase',
        { ...process.env, PATH: root },
        'linux',
      ),
    ).toBe(await realpath(target));
    await file('supabase', '#!/bin/sh\nexec supabase-real');
    await expect(
      resolveLocalExecutable(
        'supabase',
        { ...process.env, PATH: root },
        'linux',
      ),
    ).rejects.toThrow('script wrapper');
  });

  it('相対PATHと不存在だけではcwdから実行対象を補わない', async () => {
    await file('supabase.exe', 'MZnative');
    await expect(
      resolveLocalExecutable(
        'supabase',
        windowsEnv(`.;${resolve(root, 'missing')}`),
        'win32',
      ),
    ).rejects.toThrow('PATH');
  });
});
