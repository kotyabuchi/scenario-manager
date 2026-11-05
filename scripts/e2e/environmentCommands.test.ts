import { beforeEach, describe, expect, it, vi } from 'vitest';

import {
  localCommandEnvironment,
  runLocalCommand,
} from './environmentCommands';

import { EventEmitter } from 'node:events';

const mocks = vi.hoisted(() => ({
  execFile: vi.fn(),
  writeFile: vi.fn(),
  end: vi.fn(),
  kill: vi.fn(),
  resolveExecutable: vi.fn(),
}));

vi.mock('node:child_process', () => ({ execFile: mocks.execFile }));
vi.mock('./environmentExecutable', () => ({
  resolveLocalExecutable: mocks.resolveExecutable,
}));
vi.mock('node:fs/promises', () => ({ writeFile: mocks.writeFile }));

const SECRET = 'private-fixture-value-do-not-expose';
const UNIX_SOCKET = 'unix:///var/run/docker.sock';
const WINDOWS_PIPE = 'npipe:////./pipe/docker_engine';

const environment = (values: Partial<NodeJS.ProcessEnv> = {}) => {
  const source = { ...process.env };
  for (const key of Object.keys(source)) Reflect.deleteProperty(source, key);
  return Object.assign(source, values);
};

const commandOptions = () => ({
  cwd: '/workspace/test-results/environments/run-012345abcdef',
  env: localCommandEnvironment(environment({ PATH: '/usr/bin' }), UNIX_SOCKET),
});

type CommandCallback = (
  error: Error | null,
  stdout: string,
  stderr: string,
) => void;

const fakeChild = (hasStdin = true) =>
  Object.assign(new EventEmitter(), {
    stdin: hasStdin ? { end: mocks.end } : null,
    exitCode: null,
    signalCode: null,
    kill: mocks.kill,
  });

const completeCommand = (
  error: Error | null = null,
  stdout = 'result',
  stderr = '',
  hasStdin = true,
) => {
  mocks.execFile.mockImplementation(
    (
      _tool: unknown,
      _args: unknown,
      _options: unknown,
      callback: CommandCallback,
    ) => {
      const child = fakeChild(hasStdin);
      queueMicrotask(() => {
        callback(error, stdout, stderr);
        child.emit('close');
      });
      return child;
    },
  );
};

const expectSanitizedFailure = async (command: Promise<string>) => {
  const failure: unknown = await command.catch((error: unknown) => error);
  expect(failure).toBeInstanceOf(Error);
  if (!(failure instanceof Error))
    throw new Error('Errorで失敗する必要があります。');
  expect(failure.message).toBe('supabaseの実行に失敗しました。');
  expect(failure.cause).toBeUndefined();
  expect(Object.getOwnPropertyNames(failure).sort()).toEqual([
    'message',
    'stack',
  ]);
  expect(failure.stack).not.toContain(SECRET);
};

beforeEach(() => {
  vi.resetAllMocks();
  mocks.writeFile.mockResolvedValue(undefined);
  mocks.resolveExecutable.mockImplementation(async (tool: string) => tool);
  completeCommand();
});

describe('ローカルコマンドの環境変数境界', () => {
  it('Docker不要の起動でも秘密・remote設定を除去し親envを変更しない', () => {
    const source = environment({
      PATH: '/bin',
      DOCKER_HOST: 'tcp://remote:2376',
      SUPABASE_SERVICE_ROLE_KEY: SECRET,
      NODE_OPTIONS: SECRET,
    });
    const before = { ...source };
    expect(localCommandEnvironment(source)).toEqual({
      PATH: '/bin',
      NO_COLOR: '1',
    });
    expect(source).toEqual(before);
  });
  it('OSの起動に必要な値だけを残し、親プロセスの接続先と秘密値を除外する', () => {
    const source = environment({
      Path: 'C:\\Windows\\System32',
      PATHEXT: '.EXE;.CMD',
      SystemRoot: 'C:\\Windows',
      WINDIR: 'C:\\Windows',
      COMSPEC: 'C:\\Windows\\System32\\cmd.exe',
      TEMP: 'C:\\Temp',
      TMP: 'C:\\Temp',
      USERPROFILE: 'C:\\Users\\fixture',
      APPDATA: 'C:\\Users\\fixture\\AppData\\Roaming',
      LOCALAPPDATA: 'C:\\Users\\fixture\\AppData\\Local',
      HOME: '/home/fixture',
      SUPABASE_ACCESS_TOKEN: SECRET,
      SUPABASE_DB_PASSWORD: SECRET,
      SUPABASE_PROJECT_ID: SECRET,
      SUPABASE_EXPERIMENTAL: 'true',
      SUPABASE_EXPERIMENTAL_STACK: 'shared',
      NEXT_PUBLIC_SUPABASE_URL: `https://${SECRET}.supabase.co`,
      NEXT_PUBLIC_SUPABASE_ANON_KEY: SECRET,
      DATABASE_URL: SECRET,
      DB_URL: SECRET,
      PGHOST: 'remote.example.invalid',
      PGPASSWORD: SECRET,
      AWS_SECRET_ACCESS_KEY: SECRET,
      CLOUDFLARE_API_TOKEN: SECRET,
      GOOGLE_APPLICATION_CREDENTIALS: SECRET,
      GIT_DIR: SECRET,
      GIT_CONFIG_COUNT: '1',
      GIT_CONFIG_KEY_0: 'core.sshCommand',
      GIT_CONFIG_VALUE_0: SECRET,
      DOCKER_HOST: 'tcp://remote.example.invalid:2376',
      DOCKER_CONTEXT: 'remote',
      DOCKER_TLS_VERIFY: '1',
      DOCKER_CERT_PATH: SECRET,
      NODE_OPTIONS: `--require=${SECRET}`,
      FORCE_COLOR: '1',
      NO_COLOR: '0',
      secret_without_known_prefix: SECRET,
    });
    const original = { ...source };
    const result = localCommandEnvironment(source, WINDOWS_PIPE);
    expect(result).toEqual({
      Path: 'C:\\Windows\\System32',
      PATHEXT: '.EXE;.CMD',
      SystemRoot: 'C:\\Windows',
      WINDIR: 'C:\\Windows',
      COMSPEC: 'C:\\Windows\\System32\\cmd.exe',
      TEMP: 'C:\\Temp',
      TMP: 'C:\\Temp',
      USERPROFILE: 'C:\\Users\\fixture',
      APPDATA: 'C:\\Users\\fixture\\AppData\\Roaming',
      LOCALAPPDATA: 'C:\\Users\\fixture\\AppData\\Local',
      HOME: '/home/fixture',
      DOCKER_HOST: WINDOWS_PIPE,
      NO_COLOR: '1',
    });
    expect(JSON.stringify(result)).not.toContain(SECRET);
    expect(source).toEqual(original);
  });

  it.each([
    UNIX_SOCKET,
    WINDOWS_PIPE,
  ])('local socket %s を明示指定できる', (host) => {
    expect(localCommandEnvironment(environment(), host).DOCKER_HOST).toBe(host);
  });

  it.each([
    'tcp://127.0.0.1:2375',
    'tcp://remote.example.invalid:2376',
    'ssh://user@remote.example.invalid',
    'https://remote.example.invalid',
    'npipe:////remote.example.invalid/pipe/docker_engine',
    'unix://remote.example.invalid/var/run/docker.sock',
    'unix:///var/run/docker.sock\nremote',
    'npipe:////./pipe/docker_engine\rremote',
    'unix:///',
    'npipe:////./pipe/',
    '',
  ])('local socket以外を拒否する: %s', (host) => {
    expect(() => localCommandEnvironment(environment(), host)).toThrow(
      'local Docker socket',
    );
  });
});

describe('資格情報を公開しないコマンド実行', () => {
  it.each([
    [0, null],
    [7, null],
    [null, 'SIGTERM'],
  ] as const)('実closeのexit=%s/signal=%sだけをcallbackへ伝える', async (exitCode, signal) => {
    const child = fakeChild();
    let callback: CommandCallback = () => {};
    mocks.execFile.mockImplementation(
      (
        _tool: unknown,
        _args: unknown,
        _options: unknown,
        finish: CommandCallback,
      ) => {
        callback = finish;
        return child;
      },
    );
    const onClose = vi.fn();
    const command = runLocalCommand('node', [], {
      ...commandOptions(),
      onClose,
    });
    let settled = false;
    const result = command.then(
      () => {
        settled = true;
        return 'passed';
      },
      () => {
        settled = true;
        return 'failed';
      },
    );
    callback(exitCode === 0 ? null : new Error(SECRET), '', '');
    await Promise.resolve();
    expect(settled).toBe(false);
    expect(onClose).not.toHaveBeenCalled();
    child.emit('close', exitCode, signal);
    expect(await result).toBe(exitCode === 0 ? 'passed' : 'failed');
    expect(onClose).toHaveBeenCalledExactlyOnceWith({ exitCode, signal });
  });
  it('stdoutを呼出元に返し、shellを介さずstdinを直ちに閉じる', async () => {
    const options = commandOptions();
    const executable = 'C:\\owned-native\\git.exe';
    mocks.resolveExecutable.mockResolvedValue(executable);
    const result = runLocalCommand('git', ['status', '--porcelain'], options);
    await Promise.resolve();
    expect(mocks.end).toHaveBeenCalledTimes(1);
    await expect(result).resolves.toBe('result');
    expect(mocks.resolveExecutable).toHaveBeenCalledExactlyOnceWith(
      'git',
      options.env,
    );
    expect(mocks.execFile).toHaveBeenCalledWith(
      executable,
      ['status', '--porcelain'],
      expect.objectContaining({
        cwd: options.cwd,
        env: options.env,
        windowsHide: true,
        encoding: 'utf8',
        maxBuffer: expect.any(Number),
        timeout: expect.any(Number),
      }),
      expect.any(Function),
    );
    const settings: unknown = mocks.execFile.mock.calls[0]?.[2];
    expect(settings).not.toHaveProperty('shell');
    expect(settings).not.toHaveProperty('signal');
    expect(mocks.writeFile).not.toHaveBeenCalled();
  });

  it('stdin pipeが存在しなくても例外にしない', async () => {
    completeCommand(null, 'result', '', false);
    await expect(
      runLocalCommand('docker', ['version'], commandOptions()),
    ).resolves.toBe('result');
    expect(mocks.end).not.toHaveBeenCalled();
  });

  it('指定されたAbortSignalを子プロセスへそのまま渡す', async () => {
    const controller = new AbortController();
    const result = runLocalCommand('docker', ['version'], {
      ...commandOptions(),
      signal: controller.signal,
    });
    await Promise.resolve();
    controller.abort();
    expect(mocks.execFile).toHaveBeenCalledWith(
      'docker',
      ['version'],
      expect.objectContaining({ signal: controller.signal }),
      expect.any(Function),
    );
    await result;
  });

  it('明示したprivate logだけにstdout/stderrをowner-only・新規作成で記録する', async () => {
    completeCommand(null, `${SECRET}:stdout`, `${SECRET}:stderr`);
    const log = '/private/run/output.log';
    await runLocalCommand('supabase', ['start'], { ...commandOptions(), log });
    expect(mocks.writeFile).toHaveBeenCalledExactlyOnceWith(
      log,
      `${SECRET}:stdout\n${SECRET}:stderr`,
      { mode: 0o600, flag: 'wx' },
    );
  });

  it('execFileの失敗でstdout・stderr・Error.causeを公開しない', async () => {
    const error = Object.assign(
      new Error(`${SECRET}:error`, {
        cause: new Error(`${SECRET}:cause`),
      }),
      { stdout: `${SECRET}:stdout`, stderr: `${SECRET}:stderr` },
    );
    completeCommand(error, `${SECRET}:stdout`, `${SECRET}:stderr`);
    await expectSanitizedFailure(
      runLocalCommand('supabase', ['start'], commandOptions()),
    );
    expect(mocks.writeFile).not.toHaveBeenCalled();
  });

  it('失敗時も明示したprivate logを保存した後に公開用エラーへ変換する', async () => {
    completeCommand(new Error(SECRET), `${SECRET}:stdout`, `${SECRET}:stderr`);
    const log = '/private/run/failure.log';
    await expectSanitizedFailure(
      runLocalCommand('supabase', ['start'], {
        ...commandOptions(),
        log,
      }),
    );
    expect(mocks.writeFile).toHaveBeenCalledExactlyOnceWith(
      log,
      `${SECRET}:stdout\n${SECRET}:stderr`,
      { mode: 0o600, flag: 'wx' },
    );
  });

  it('private logの書込失敗もraw errorと秘密値を公開しない', async () => {
    mocks.writeFile.mockRejectedValue(
      new Error(SECRET, {
        cause: new Error(`${SECRET}:cause`),
      }),
    );
    await expectSanitizedFailure(
      runLocalCommand('supabase', ['start'], {
        ...commandOptions(),
        log: '/private/run/output.log',
      }),
    );
  });

  it('AbortError callback後もcloseまでは失敗を返さず、grace後も終了証明を待つ', async () => {
    vi.useFakeTimers();
    const child = fakeChild();
    let complete: CommandCallback = () => {
      throw new Error('未起動');
    };
    mocks.execFile.mockImplementation(
      (
        _tool: unknown,
        _args: unknown,
        _options: unknown,
        callback: CommandCallback,
      ) => {
        complete = callback;
        return child;
      },
    );
    const controller = new AbortController();
    const settled = vi.fn();
    const command = runLocalCommand('supabase', ['start'], {
      ...commandOptions(),
      signal: controller.signal,
    }).then(settled, settled);
    try {
      await Promise.resolve();
      controller.abort();
      complete(new Error(SECRET), '', '');
      await vi.advanceTimersByTimeAsync(4_999);
      expect(settled).not.toHaveBeenCalled();
      expect(mocks.kill).not.toHaveBeenCalled();
      await vi.advanceTimersByTimeAsync(1);
      expect(mocks.kill).toHaveBeenCalledExactlyOnceWith('SIGKILL');
      expect(settled).not.toHaveBeenCalled();
      child.emit('close');
      await command;
      expect(settled).toHaveBeenCalledExactlyOnceWith(expect.any(Error));
      expect(vi.getTimerCount()).toBe(0);
    } finally {
      child.emit('close');
      vi.useRealTimers();
    }
  });

  it('closeがcallbackより先でも両方の到着まで結果を返さない', async () => {
    const child = fakeChild();
    let complete: CommandCallback = () => {
      throw new Error('未起動');
    };
    mocks.execFile.mockImplementation(
      (
        _tool: unknown,
        _args: unknown,
        _options: unknown,
        callback: CommandCallback,
      ) => {
        complete = callback;
        return child;
      },
    );
    const settled = vi.fn();
    const command = runLocalCommand('git', ['status'], commandOptions()).then(
      settled,
    );
    await Promise.resolve();
    child.emit('close');
    await Promise.resolve();
    expect(settled).not.toHaveBeenCalled();
    complete(null, 'result', '');
    await command;
    expect(settled).toHaveBeenCalledExactlyOnceWith('result');
  });

  it('実childのabort callbackが先行してもcloseの後でのみrejectする', async () => {
    const { execFile: actualExecFile } =
      await vi.importActual<typeof import('node:child_process')>(
        'node:child_process',
      );
    const controller = new AbortController();
    const events: string[] = [];
    const callbackErrors: string[] = [];
    mocks.execFile.mockImplementation(
      (
        _tool: unknown,
        _args: unknown,
        options: Parameters<typeof runLocalCommand>[2],
        callback: CommandCallback,
      ) => {
        const child = actualExecFile(
          process.execPath,
          [
            '-e',
            "process.stdout.write('ready'); setInterval(() => {}, 1000); setTimeout(() => process.exit(0), 2000);",
          ],
          { ...options, encoding: 'utf8' },
          (error, stdout, stderr) => {
            events.push('callback');
            callbackErrors.push(error?.name ?? 'none');
            callback(error, stdout, stderr);
          },
        );
        child.stdout?.once('data', () => controller.abort());
        child.once('close', () => events.push('close'));
        return child;
      },
    );
    const result = runLocalCommand('supabase', [], {
      cwd: process.cwd(),
      env: process.env,
      signal: controller.signal,
    });
    await expectSanitizedFailure(result.finally(() => events.push('settled')));
    expect(callbackErrors).toEqual(['AbortError']);
    expect(events).toEqual(['callback', 'close', 'settled']);
  });

  it('native実体の解決失敗では子を起動せず秘密値を公開しない', async () => {
    mocks.resolveExecutable.mockRejectedValue(new Error(SECRET));
    await expectSanitizedFailure(
      runLocalCommand('supabase', [], commandOptions()),
    );
    expect(mocks.execFile).not.toHaveBeenCalled();
  });

  it('execFileの同期throwもcallbackと同じ秘密情報境界を通す', async () => {
    mocks.execFile.mockImplementation(() => {
      throw new Error(SECRET, { cause: new Error(`${SECRET}:cause`) });
    });
    await expectSanitizedFailure(
      runLocalCommand('supabase', ['start'], commandOptions()),
    );
    expect(mocks.writeFile).not.toHaveBeenCalled();
  });
});
