import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import {
  classifyDockerJournal,
  createDockerJournalTiming,
} from './dockerJournalTiming';
import { writeProgressStderr } from './progressStderr';

import { spawn } from 'node:child_process';
import { EventEmitter } from 'node:events';
import { PassThrough } from 'node:stream';

vi.mock('node:child_process', () => ({ spawn: vi.fn() }));
vi.mock('./progressStderr', () => ({ writeProgressStderr: vi.fn() }));

const row = (message: string, timestamp = '1500000') =>
  JSON.stringify({
    _SYSTEMD_UNIT: 'docker.service',
    __REALTIME_TIMESTAMP: timestamp,
    MESSAGE: message,
  });
const child = () => {
  const result = Object.assign(new EventEmitter(), {
    stdout: new PassThrough(),
    stderr: new PassThrough(),
    kill: vi.fn(),
  });
  vi.mocked(spawn).mockReturnValue(
    result as unknown as ReturnType<typeof spawn>,
  );
  return result;
};
beforeEach(() => {
  vi.resetAllMocks();
  vi.stubEnv('GITHUB_ACTIONS', 'true');
});
afterEach(() => {
  vi.unstubAllEnvs();
  vi.useRealTimers();
  vi.restoreAllMocks();
});

describe('docker journalの限定観測', () => {
  it('固定error種別と時刻だけを残し、秘密と所有帰属を公開しない', () => {
    const parsed = classifyDockerJournal(
      `${row('Error initiating layer download: private-secret')}\n${row('Download failed, retrying (1/5): token')}\n${row('Download failed after 5 attempts: hidden')}\n`,
      1000,
      2000,
    );
    expect(parsed).toEqual([
      { kind: 'layer-init-error', elapsedMs: 500, attribution: 'unattributed' },
      {
        kind: 'download-retrying',
        elapsedMs: 500,
        attribution: 'unattributed',
      },
      { kind: 'download-failed', elapsedMs: 500, attribution: 'unattributed' },
    ]);
    expect(JSON.stringify(parsed)).not.toMatch(/private|secret|token|hidden/);
  });
  it('不正・空・行超過・別unitはunknownにする', () => {
    expect(classifyDockerJournal('', 1000, 2000)).toBeNull();
    expect(classifyDockerJournal('secret', 1000, 2000)).toBeNull();
    expect(
      classifyDockerJournal(
        Array(513).fill(row('safe')).join('\n'),
        1000,
        2000,
      ),
    ).toBeNull();
    expect(
      classifyDockerJournal(row('x'.repeat(17_000)), 1000, 2000),
    ).toBeNull();
    expect(
      classifyDockerJournal(
        JSON.stringify({
          _SYSTEMD_UNIT: 'other',
          __REALTIME_TIMESTAMP: '1500000',
          MESSAGE: 'safe',
        }),
        1000,
        2000,
      ),
    ).toBeNull();
    expect(
      classifyDockerJournal(
        row('Download failed after 5 attempts: hidden', '900000'),
        1000,
        2000,
      ),
    ).toEqual([]);
  });
  it('固定Moby messageだけを分類し、errorとURLを捨てる', () => {
    const parsed = classifyDockerJournal(
      [
        row(
          'time="2026-11-16T00:00:00Z" level=info msg="Attempting next endpoint for pull after error: private-secret https://example.invalid/token"',
        ),
        row(
          'time="2026-11-16T00:00:00Z" level=error msg="Not continuing with pull after error" error="private-secret"',
        ),
        row(
          'time="2026-11-16T00:00:00Z" level=info msg="Attempting next endpoint for pull after errors: private-secret"',
        ),
        row(
          'time="2026-11-16T00:00:00Z" level=error msg="Not continuing with pull after errors"',
        ),
        row(
          'time="2026-11-16T00:00:00Z" level=error error="Not continuing with pull after error"',
        ),
        row(
          'time="2026-11-16T00:00:00Z" level=error msg="Not continuing with pull after error"',
          '900000',
        ),
      ].join('\n'),
      1000,
      2000,
    );
    expect(parsed).toEqual([
      {
        kind: 'pull-next-endpoint',
        elapsedMs: 500,
        attribution: 'unattributed',
      },
      {
        kind: 'pull-not-continuing',
        elapsedMs: 500,
        attribution: 'unattributed',
      },
    ]);
    expect(JSON.stringify(parsed)).not.toMatch(
      /private|secret|example|token|error=/,
    );
  });
  it('外側msgを優先し、error本文の別messageへ誤分類しない', () => {
    const parsed = classifyDockerJournal(
      [
        row(
          'level=info msg="Attempting next endpoint for pull after error: Download failed after 5 attempts: secret"',
        ),
        row(
          'level=error msg="Not continuing with pull after error" error="Download failed after 5 attempts: secret"',
        ),
        row(
          'level=error msg="Download failed after 5 attempts: Attempting next endpoint for pull after error: secret"',
        ),
        row(
          'level=error msg="unrelated" error="Download failed after 5 attempts: secret"',
        ),
        row(
          'level=error msg="unrelated" error="Not continuing with pull after error"',
        ),
        row(
          'level=error msg="unrelated" error="inner msg=\\"Not continuing with pull after error\\""',
        ),
        row(
          'level=error msg="Not continuing with pull after error" msg="unrelated"',
        ),
      ].join('\n'),
      1000,
      2000,
    );
    expect(parsed).toEqual([
      {
        kind: 'pull-next-endpoint',
        elapsedMs: 500,
        attribution: 'unattributed',
      },
      {
        kind: 'pull-not-continuing',
        elapsedMs: 500,
        attribution: 'unattributed',
      },
      { kind: 'download-failed', elapsedMs: 500, attribution: 'unattributed' },
    ]);
    expect(JSON.stringify(parsed)).not.toContain('secret');
  });
  it('外側msg内の旧4種類はprefix付きでも検出する', () => {
    const parsed = classifyDockerJournal(
      [
        row('level=error msg="prefix Error initiating layer download: secret"'),
        row(
          'level=error msg="prefix filesystem layer verification failed for digest secret"',
        ),
        row('level=info msg="prefix Download failed, retrying (1/5): secret"'),
        row(
          'level=error msg="prefix Download failed after 5 attempts: secret"',
        ),
      ].join('\n'),
      1000,
      2000,
    );
    expect(parsed?.map((event) => event.kind)).toEqual([
      'layer-init-error',
      'layer-checksum-error',
      'download-retrying',
      'download-failed',
    ]);
    expect(JSON.stringify(parsed)).not.toContain('secret');
  });
  it('closeまで待ち、固定unitと固定時刻引数だけを使う', async () => {
    vi.spyOn(Date, 'now').mockReturnValueOnce(1000).mockReturnValueOnce(2000);
    vi.spyOn(performance, 'now')
      .mockReturnValueOnce(10)
      .mockReturnValueOnce(1010)
      .mockReturnValueOnce(1100)
      .mockReturnValueOnce(1120);
    const c = child();
    const timing = createDockerJournalTiming({
      signal: new AbortController().signal,
      platform: 'linux',
    });
    timing.start();
    timing.onClose();
    let done = false;
    const pending = timing.finish().then(() => {
      done = true;
    });
    c.stdout.write(`${row('Download failed after 5 attempts: private')}\n`);
    expect(done).toBe(false);
    c.emit('close', 0);
    await pending;
    expect(spawn).toHaveBeenCalledWith(
      '/usr/bin/journalctl',
      expect.arrayContaining([
        '--no-pager',
        '--unit=docker.service',
        '--boot=0',
        '--since=@1',
        '--until=@2',
      ]),
      expect.objectContaining({
        env: {
          PATH: '/usr/bin:/bin',
          LANG: 'C',
          NODE_ENV: 'production',
          NEXT_PUBLIC_SUPABASE_URL: '',
          NEXT_PUBLIC_SUPABASE_ANON_KEY: '',
        },
      }),
    );
    const result = vi.mocked(writeProgressStderr).mock.calls[0]?.[0] ?? '';
    expect(result).toContain('download-failed');
    expect(result).not.toContain('private');
  });
  it('親abortは終了要求だけでcloseまで待ちunknown', async () => {
    vi.useFakeTimers();
    const c = child();
    const controller = new AbortController();
    const timing = createDockerJournalTiming({
      signal: controller.signal,
      platform: 'linux',
    });
    timing.start();
    timing.onClose();
    let done = false;
    const pending = timing.finish().then(() => {
      done = true;
    });
    controller.abort();
    expect(c.kill).toHaveBeenCalledWith('SIGTERM');
    expect(done).toBe(false);
    c.emit('close', null);
    await pending;
    expect(vi.mocked(writeProgressStderr).mock.calls[0]?.[0]).toContain(
      '"status":"unknown"',
    );
  });
  it('2秒deadlineは終了要求のみでclose後にunknownとする', async () => {
    vi.useFakeTimers();
    const c = child();
    const timing = createDockerJournalTiming({
      signal: new AbortController().signal,
      platform: 'linux',
    });
    timing.start();
    timing.onClose();
    let done = false;
    const pending = timing.finish().then(() => {
      done = true;
    });
    await vi.advanceTimersByTimeAsync(2_000);
    expect(c.kill).toHaveBeenCalledWith('SIGTERM');
    expect(done).toBe(false);
    c.emit('close', null);
    await pending;
    expect(vi.mocked(writeProgressStderr).mock.calls[0]?.[0]).toContain(
      '"status":"unknown"',
    );
  });
  it('出力上限超過はchild停止後も部分値を成功として出さない', async () => {
    const c = child();
    const timing = createDockerJournalTiming({
      signal: new AbortController().signal,
      platform: 'linux',
    });
    timing.start();
    timing.onClose();
    const pending = timing.finish();
    c.stdout.write(Buffer.alloc(262_145, 'x'));
    expect(c.kill).toHaveBeenCalledWith('SIGTERM');
    c.emit('close', 0);
    await pending;
    expect(vi.mocked(writeProgressStderr).mock.calls[0]?.[0]).toContain(
      '"status":"unknown"',
    );
  });
  it('壁時計のジャンプ時はjournalを読まない', async () => {
    vi.spyOn(Date, 'now')
      .mockReturnValueOnce(1_000)
      .mockReturnValueOnce(10_000);
    vi.spyOn(performance, 'now')
      .mockReturnValueOnce(10)
      .mockReturnValueOnce(20)
      .mockReturnValueOnce(30)
      .mockReturnValueOnce(40);
    const timing = createDockerJournalTiming({
      signal: new AbortController().signal,
      platform: 'linux',
    });
    timing.start();
    timing.onClose();
    await timing.finish();
    expect(spawn).not.toHaveBeenCalled();
    expect(vi.mocked(writeProgressStderr).mock.calls[0]?.[0]).toContain(
      '"status":"unknown"',
    );
  });
  it('Windows・無効時と未closeではspawnしない', async () => {
    const w = createDockerJournalTiming({
      signal: new AbortController().signal,
      platform: 'win32',
    });
    w.start();
    w.onClose();
    await w.finish();
    vi.stubEnv('GITHUB_ACTIONS', 'false');
    const disabled = createDockerJournalTiming({
      signal: new AbortController().signal,
      platform: 'linux',
    });
    disabled.start();
    disabled.onClose();
    await disabled.finish();
    vi.stubEnv('GITHUB_ACTIONS', 'true');
    const missing = createDockerJournalTiming({
      signal: new AbortController().signal,
      platform: 'linux',
    });
    missing.start();
    await missing.finish();
    expect(spawn).not.toHaveBeenCalled();
  });
});
