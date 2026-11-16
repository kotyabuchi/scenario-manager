import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { ArtifactWriteError, writeArtifact } from './ledgerArtifacts';

import {
  closeSync,
  constants,
  fstatSync,
  lstatSync,
  mkdtempSync,
  openSync,
  readFileSync,
  realpathSync,
  renameSync,
  rmSync,
  writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

vi.mock('node:fs', async (original) => {
  const fs = await original<typeof import('node:fs')>();
  return {
    ...fs,
    constants: {
      ...fs.constants,
      O_NONBLOCK: fs.constants.O_NONBLOCK ?? 2048,
      O_NOFOLLOW: fs.constants.O_NOFOLLOW ?? 131072,
    },
    openSync: vi.fn(fs.openSync),
    fstatSync: vi.fn(fs.fstatSync),
    writeFileSync: vi.fn(fs.writeFileSync),
    closeSync: vi.fn(fs.closeSync),
    renameSync: vi.fn(fs.renameSync),
    rmSync: vi.fn(fs.rmSync),
    lstatSync: vi.fn(fs.lstatSync),
  };
});

const roots: string[] = [];
const setup = () => {
  const root = mkdtempSync(join(realpathSync(tmpdir()), 'e2e-artifact-write-'));
  roots.push(root);
  writeFileSync(join(root, 'record.json'), 'before');
  vi.clearAllMocks();
  return root;
};
const failure = (code: string) =>
  Object.assign(new Error('private-secret /private/path'), { code });
beforeEach(() => vi.clearAllMocks());
afterEach(() => {
  for (const root of roots.splice(0)) {
    if (!root.startsWith(join(realpathSync(tmpdir()), 'e2e-artifact-write-')))
      throw new Error('invalid temporary root');
    rmSync(root, { recursive: true, force: true });
  }
});

describe('artifact atomic write', () => {
  it.each([
    'EPERM',
    'EBUSY',
  ])('Windows所有manifestの一時的%sは再照合後に回復する', (code) => {
    const root = setup();
    const platform = Object.getOwnPropertyDescriptor(process, 'platform');
    if (!platform) throw new Error('platform descriptor missing');
    Object.defineProperty(process, 'platform', { ...platform, value: 'win32' });
    const wait = vi.spyOn(Atomics, 'wait').mockReturnValue('timed-out');
    try {
      vi.mocked(renameSync).mockImplementationOnce(() => {
        throw failure(code);
      });
      writeArtifact(root, 'record.json', 'after', {
        allowWindowsManifestRenameRetry: true,
      });
      expect(renameSync).toHaveBeenCalledTimes(2);
      expect(wait).toHaveBeenCalledTimes(1);
      expect(readFileSync(join(root, 'record.json'), 'utf8')).toBe('after');
    } finally {
      wait.mockRestore();
      Object.defineProperty(process, 'platform', platform);
    }
  });

  it('恒久的なWindows rename拒否は5回だけ待ち、失敗を返す', () => {
    const root = setup();
    const platform = Object.getOwnPropertyDescriptor(process, 'platform');
    if (!platform) throw new Error('platform descriptor missing');
    Object.defineProperty(process, 'platform', { ...platform, value: 'win32' });
    const wait = vi.spyOn(Atomics, 'wait').mockReturnValue('timed-out');
    try {
      for (let i = 0; i < 6; i++)
        vi.mocked(renameSync).mockImplementationOnce(() => {
          throw failure('EPERM');
        });
      let result: unknown;
      try {
        writeArtifact(root, 'record.json', 'after', {
          allowWindowsManifestRenameRetry: true,
        });
      } catch (error) {
        result = error;
      }
      if (!(result instanceof ArtifactWriteError))
        throw new Error('missing error');
      expect(result.primary).toEqual({ operation: 'rename', code: 'EPERM' });
      expect(result.cleanup).toEqual([]);
      expect(renameSync).toHaveBeenCalledTimes(6);
      expect(wait.mock.calls.map((args) => args[3])).toEqual([
        25, 50, 100, 200, 400,
      ]);
      expect(readFileSync(join(root, 'record.json'), 'utf8')).toBe('before');
    } finally {
      wait.mockRestore();
      Object.defineProperty(process, 'platform', platform);
    }
  });

  it.each([
    'linux',
    'win32',
  ] as const)('%sでは対象外codeを再試行しない', (platformName) => {
    const root = setup();
    const platform = Object.getOwnPropertyDescriptor(process, 'platform');
    if (!platform) throw new Error('platform descriptor missing');
    Object.defineProperty(process, 'platform', {
      ...platform,
      value: platformName,
    });
    const wait = vi.spyOn(Atomics, 'wait').mockReturnValue('timed-out');
    const originalOpen = vi.mocked(openSync).getMockImplementation();
    if (!originalOpen) throw new Error('missing open');
    if (platformName === 'linux') {
      expect(constants.O_NONBLOCK).toBeGreaterThan(0);
      expect(constants.O_NOFOLLOW).toBeGreaterThan(0);
    }
    if (platform.value === 'win32' && platformName === 'linux')
      vi.mocked(openSync).mockImplementation((path, flags, mode) =>
        originalOpen(path, typeof flags === 'number' ? 'r' : flags, mode),
      );
    try {
      vi.mocked(renameSync).mockImplementationOnce(() => {
        throw failure(platformName === 'linux' ? 'EPERM' : 'EACCES');
      });
      expect(() =>
        writeArtifact(root, 'record.json', 'after', {
          allowWindowsManifestRenameRetry: true,
        }),
      ).toThrow(ArtifactWriteError);
      expect(renameSync).toHaveBeenCalledTimes(1);
      expect(wait).not.toHaveBeenCalled();
    } finally {
      vi.mocked(openSync).mockImplementation(originalOpen);
      wait.mockRestore();
      Object.defineProperty(process, 'platform', platform);
    }
  });
  it.each([
    'new-target',
    'replaced-target',
    'changed-target',
    'replaced-temp',
    'replaced-parent',
  ] as const)('retry前の%sを検出し再renameしない', async (fault) => {
    const fs = await vi.importActual<typeof import('node:fs')>('node:fs');
    const root = setup();
    const target = join(root, 'record.json');
    if (fault === 'new-target') fs.rmSync(target);
    const platform = Object.getOwnPropertyDescriptor(process, 'platform');
    if (!platform) throw new Error('platform descriptor missing');
    Object.defineProperty(process, 'platform', { ...platform, value: 'win32' });
    vi.mocked(renameSync).mockImplementationOnce(() => {
      throw failure('EPERM');
    });
    const wait = vi.spyOn(Atomics, 'wait').mockImplementation(() => {
      if (fault === 'new-target') fs.writeFileSync(target, 'other');
      if (fault === 'replaced-target') {
        fs.rmSync(target);
        fs.writeFileSync(target, 'other');
      }
      if (fault === 'changed-target') fs.writeFileSync(target, 'other');
      if (fault === 'replaced-temp') {
        const name = fs
          .readdirSync(root)
          .find((value) => value.endsWith('.tmp'));
        if (!name) throw new Error('tmp missing');
        const tmp = join(root, name);
        fs.rmSync(tmp);
        fs.writeFileSync(tmp, 'other');
      }
      if (fault === 'replaced-parent') {
        const previous = `${root}-previous`;
        fs.renameSync(root, previous);
        roots.push(previous);
        fs.mkdirSync(root);
      }
      return 'timed-out';
    });
    try {
      let result: unknown;
      try {
        writeArtifact(root, 'record.json', 'after', {
          allowWindowsManifestRenameRetry: true,
        });
      } catch (error) {
        result = error;
      }
      if (!(result instanceof ArtifactWriteError))
        throw new Error('missing error');
      expect(result.primary).toEqual({ operation: 'rename', code: 'EPERM' });
      expect(renameSync).toHaveBeenCalledTimes(1);
      if (fault === 'replaced-temp') {
        const name = fs
          .readdirSync(root)
          .find((value) => value.endsWith('.tmp'));
        expect(name).toBeDefined();
        if (!name) throw new Error('tmp missing');
        expect(fs.readFileSync(join(root, name), 'utf8')).toBe('other');
        expect(result.cleanup).toEqual([
          { operation: 'identity', code: 'unknown' },
        ]);
      }
      if (
        fault === 'new-target' ||
        fault === 'replaced-target' ||
        fault === 'changed-target'
      )
        expect(fs.readFileSync(target, 'utf8')).toBe('other');
    } finally {
      wait.mockRestore();
      Object.defineProperty(process, 'platform', platform);
    }
  });

  it('snapshot取得不能でも初回renameは維持し、失敗した場合だけretryを拒否する', () => {
    const root = setup();
    writeFileSync(join(root, 'record.json'), 'x'.repeat(1_048_577));
    const platform = Object.getOwnPropertyDescriptor(process, 'platform');
    if (!platform) throw new Error('platform descriptor missing');
    Object.defineProperty(process, 'platform', { ...platform, value: 'win32' });
    const wait = vi.spyOn(Atomics, 'wait').mockReturnValue('timed-out');
    try {
      vi.mocked(renameSync).mockImplementationOnce(() => {
        throw failure('EPERM');
      });
      expect(() =>
        writeArtifact(root, 'record.json', 'after', {
          allowWindowsManifestRenameRetry: true,
        }),
      ).toThrow(ArtifactWriteError);
      expect(renameSync).toHaveBeenCalledTimes(1);
      expect(wait).not.toHaveBeenCalled();
      writeArtifact(root, 'record.json', 'after', {
        allowWindowsManifestRenameRetry: true,
      });
      expect(readFileSync(join(root, 'record.json'), 'utf8')).toBe('after');
    } finally {
      wait.mockRestore();
      Object.defineProperty(process, 'platform', platform);
    }
  });

  it('retry上限とtmp cleanupが同時に失敗しても両方保持する', () => {
    const root = setup();
    const platform = Object.getOwnPropertyDescriptor(process, 'platform');
    if (!platform) throw new Error('platform descriptor missing');
    Object.defineProperty(process, 'platform', { ...platform, value: 'win32' });
    const wait = vi.spyOn(Atomics, 'wait').mockReturnValue('timed-out');
    try {
      for (let i = 0; i < 6; i++)
        vi.mocked(renameSync).mockImplementationOnce(() => {
          throw failure('EPERM');
        });
      vi.mocked(rmSync).mockImplementationOnce(() => {
        throw failure('EBUSY');
      });
      let result: unknown;
      try {
        writeArtifact(root, 'record.json', 'after', {
          allowWindowsManifestRenameRetry: true,
        });
      } catch (error) {
        result = error;
      }
      if (!(result instanceof ArtifactWriteError))
        throw new Error('missing error');
      expect(result.primary).toEqual({ operation: 'rename', code: 'EPERM' });
      expect(result.cleanup).toEqual([{ operation: 'remove', code: 'EBUSY' }]);
      expect(JSON.stringify(result)).not.toContain('private');
      expect(readFileSync(join(root, 'record.json'), 'utf8')).toBe('before');
    } finally {
      wait.mockRestore();
      Object.defineProperty(process, 'platform', platform);
    }
  });

  it('POSIX安全open flags未対応ではguard取得をfail closedする', () => {
    const root = setup();
    const platform = Object.getOwnPropertyDescriptor(process, 'platform');
    const nofollow = Object.getOwnPropertyDescriptor(constants, 'O_NOFOLLOW');
    if (!platform || !nofollow) throw new Error('descriptor missing');
    Object.defineProperty(process, 'platform', { ...platform, value: 'linux' });
    Object.defineProperty(constants, 'O_NOFOLLOW', { ...nofollow, value: 0 });
    try {
      let result: unknown;
      try {
        writeArtifact(root, 'record.json', 'after');
      } catch (error) {
        result = error;
      }
      if (!(result instanceof ArtifactWriteError))
        throw new Error('missing error');
      expect(result.primary).toEqual({
        operation: 'guard-open',
        code: 'unknown',
      });
      expect(result.published).toBe(false);
      expect(renameSync).not.toHaveBeenCalled();
      expect(readFileSync(join(root, 'record.json'), 'utf8')).toBe('before');
    } finally {
      Object.defineProperty(constants, 'O_NOFOLLOW', nofollow);
      Object.defineProperty(process, 'platform', platform);
    }
  });

  it('inodeが0で所有性を識別できないtmpをpublishや削除しない', () => {
    const root = setup();
    const fd = openSync(join(root, 'record.json'), 'r');
    const stat = fstatSync(fd, { bigint: true });
    closeSync(fd);
    Object.defineProperty(stat, 'ino', { value: BigInt(0) });
    vi.clearAllMocks();
    vi.mocked(fstatSync).mockReturnValueOnce(stat);
    let result: unknown;
    try {
      writeArtifact(root, 'record.json', 'after');
    } catch (error) {
      result = error;
    }
    if (!(result instanceof ArtifactWriteError))
      throw new Error('missing error');
    expect(result.primary).toEqual({ operation: 'identity', code: 'unknown' });
    expect(result.cleanup).toEqual([
      { operation: 'identity', code: 'unknown' },
    ]);
    expect(result.published).toBe(false);
    expect(renameSync).not.toHaveBeenCalled();
    expect(rmSync).not.toHaveBeenCalled();
    expect(readFileSync(join(root, 'record.json'), 'utf8')).toBe('before');
  });

  it('guard取得失敗時はwriterをpinしたまま所有tmpを片付ける', () => {
    const root = setup();
    const originalOpen = vi.mocked(openSync).getMockImplementation();
    if (!originalOpen) throw new Error('missing open');
    vi.mocked(openSync)
      .mockImplementationOnce(originalOpen)
      .mockImplementationOnce(() => {
        throw failure('EACCES');
      });
    let result: unknown;
    try {
      writeArtifact(root, 'record.json', 'after');
    } catch (error) {
      result = error;
    }
    if (!(result instanceof ArtifactWriteError))
      throw new Error('missing error');
    expect(result.primary).toEqual({ operation: 'guard-open', code: 'EACCES' });
    expect(result.cleanup).toEqual([]);
    expect(result.published).toBe(false);
    expect(vi.mocked(rmSync).mock.invocationCallOrder[0]).toBeLessThan(
      vi.mocked(closeSync).mock.invocationCallOrder[0] ?? 0,
    );
    expect(readFileSync(join(root, 'record.json'), 'utf8')).toBe('before');
  });

  it('guard照合失敗とcleanup失敗を保持し未所有tmpを削除しない', async () => {
    const fs = await vi.importActual<typeof import('node:fs')>('node:fs');
    const root = setup();
    const originalOpen = vi.mocked(openSync).getMockImplementation();
    if (!originalOpen) throw new Error('missing open');
    vi.mocked(openSync)
      .mockImplementationOnce(originalOpen)
      .mockImplementationOnce((path, flags, mode) => {
        fs.unlinkSync(path);
        fs.writeFileSync(path, 'other');
        return fs.openSync(path, flags, mode);
      });
    let result: unknown;
    try {
      writeArtifact(root, 'record.json', 'after');
    } catch (error) {
      result = error;
    }
    if (!(result instanceof ArtifactWriteError))
      throw new Error('missing error');
    expect(result.primary).toEqual({ operation: 'identity', code: 'unknown' });
    expect(result.cleanup).toEqual([
      { operation: 'identity', code: 'unknown' },
    ]);
    expect(result.published).toBe(false);
    expect(rmSync).not.toHaveBeenCalled();
    expect(renameSync).not.toHaveBeenCalled();
    const name = fs.readdirSync(root).find((value) => value.endsWith('.tmp'));
    if (!name) throw new Error('tmp missing');
    expect(fs.readFileSync(join(root, name), 'utf8')).toBe('other');
  });

  it('publish後のguard close失敗はpublished=trueで失敗を返す', () => {
    const root = setup();
    const originalClose = vi.mocked(closeSync).getMockImplementation();
    if (!originalClose) throw new Error('missing close');
    vi.mocked(closeSync)
      .mockImplementationOnce(originalClose)
      .mockImplementationOnce((fd) => {
        originalClose(fd);
        throw failure('EBUSY');
      });
    let result: unknown;
    try {
      writeArtifact(root, 'record.json', 'after');
    } catch (error) {
      result = error;
    }
    if (!(result instanceof ArtifactWriteError))
      throw new Error('missing error');
    expect(result.primary).toBeNull();
    expect(result.cleanup).toEqual([
      { operation: 'guard-close', code: 'EBUSY' },
    ]);
    expect(result.published).toBe(true);
    expect(readFileSync(join(root, 'record.json'), 'utf8')).toBe('after');
  });

  it('rename失敗とguard close失敗を両方保持する', () => {
    const root = setup();
    const originalClose = vi.mocked(closeSync).getMockImplementation();
    if (!originalClose) throw new Error('missing close');
    vi.mocked(closeSync)
      .mockImplementationOnce(originalClose)
      .mockImplementationOnce((fd) => {
        originalClose(fd);
        throw failure('EBUSY');
      });
    vi.mocked(renameSync).mockImplementationOnce(() => {
      throw failure('EPERM');
    });
    let result: unknown;
    try {
      writeArtifact(root, 'record.json', 'after');
    } catch (error) {
      result = error;
    }
    if (!(result instanceof ArtifactWriteError))
      throw new Error('missing error');
    expect(result.primary).toEqual({ operation: 'rename', code: 'EPERM' });
    expect(result.cleanup).toEqual([
      { operation: 'guard-close', code: 'EBUSY' },
    ]);
    expect(result.published).toBe(false);
    expect(readFileSync(join(root, 'record.json'), 'utf8')).toBe('before');
  });

  it('成功時は内容を置換する', () => {
    const root = setup();
    writeArtifact(root, 'record.json', 'after');
    expect(readFileSync(join(root, 'record.json'), 'utf8')).toBe('after');
    expect(renameSync).toHaveBeenCalledTimes(1);
  });
  it('排他作成が失敗した未所有tmpを削除しない', () => {
    const root = setup();
    vi.mocked(openSync).mockImplementationOnce(() => {
      throw failure('EEXIST');
    });
    expect(() => writeArtifact(root, 'record.json', 'after')).toThrow(
      ArtifactWriteError,
    );
    expect(rmSync).not.toHaveBeenCalled();
    expect(readFileSync(join(root, 'record.json'), 'utf8')).toBe('before');
  });
  it('writeとcleanupの失敗を両方保持し秘密を返さない', () => {
    const root = setup();
    vi.mocked(writeFileSync).mockImplementationOnce(() => {
      throw failure('EPERM');
    });
    vi.mocked(rmSync).mockImplementationOnce(() => {
      throw failure('EACCES');
    });
    const error = (() => {
      try {
        writeArtifact(root, 'record.json', 'after');
        return undefined;
      } catch (value) {
        return value;
      }
    })();
    expect(error).toBeInstanceOf(ArtifactWriteError);
    if (!(error instanceof ArtifactWriteError))
      throw new Error('missing error');
    expect(error.primary).toEqual({ operation: 'write', code: 'EPERM' });
    expect(error.cleanup).toEqual([{ operation: 'remove', code: 'EACCES' }]);
    expect(JSON.stringify(error)).not.toContain('private');
    expect(String(error)).not.toContain('private');
    expect(readFileSync(join(root, 'record.json'), 'utf8')).toBe('before');
  });
  it('恒久rename拒否は再試行せず元の内容を保持する', () => {
    const root = setup();
    vi.mocked(renameSync).mockImplementationOnce(() => {
      throw failure('EPERM');
    });
    let result: unknown;
    try {
      writeArtifact(root, 'record.json', 'after');
    } catch (error) {
      result = error;
    }
    expect(result).toBeInstanceOf(ArtifactWriteError);
    if (!(result instanceof ArtifactWriteError))
      throw new Error('missing error');
    expect(result.primary).toEqual({ operation: 'rename', code: 'EPERM' });
    expect(result.cleanup).toEqual([]);
    expect(renameSync).toHaveBeenCalledTimes(1);
    expect(readFileSync(join(root, 'record.json'), 'utf8')).toBe('before');
  });
  it('close単独失敗はcleanupとして記録しrenameしない', () => {
    const root = setup();
    const originalClose = vi.mocked(closeSync).getMockImplementation();
    if (!originalClose) throw new Error('missing close');
    vi.mocked(closeSync).mockImplementationOnce((fd) => {
      originalClose(fd);
      throw failure('EBUSY');
    });
    let result: unknown;
    try {
      writeArtifact(root, 'record.json', 'after');
    } catch (error) {
      result = error;
    }
    if (!(result instanceof ArtifactWriteError))
      throw new Error('missing error');
    expect(result.primary).toBeNull();
    expect(result.cleanup).toEqual([{ operation: 'close', code: 'EBUSY' }]);
    expect(renameSync).not.toHaveBeenCalled();
    expect(readFileSync(join(root, 'record.json'), 'utf8')).toBe('before');
  });
  it('tmp identityが確認できなければ置換や削除をしない', () => {
    const root = setup();
    vi.mocked(lstatSync)
      .mockImplementationOnce(() => {
        throw failure('EPERM');
      })
      .mockImplementationOnce(() => {
        throw failure('EPERM');
      });
    let result: unknown;
    try {
      writeArtifact(root, 'record.json', 'after');
    } catch (error) {
      result = error;
    }
    if (!(result instanceof ArtifactWriteError))
      throw new Error('missing error');
    expect(result.primary).toEqual({ operation: 'identity', code: 'EPERM' });
    expect(result.cleanup).toEqual([{ operation: 'identity', code: 'EPERM' }]);
    expect(renameSync).not.toHaveBeenCalled();
    expect(rmSync).not.toHaveBeenCalled();
  });
});
