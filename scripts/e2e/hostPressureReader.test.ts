import { afterEach, describe, expect, it, vi } from 'vitest';

type Fixture = { stat?: string; io?: string };

// reader entry 自体を実行し、固定 proc の read だけを制御する。
const readFixture = async (fixture: Fixture) => {
  vi.resetModules();
  const paths: string[] = [];
  const closed: number[] = [];
  const content = new Map<number, Buffer>();
  const offsets = new Map<number, number>();
  vi.doMock('node:fs', () => ({
    openSync: (path: string) => {
      paths.push(path);
      const value = path === '/proc/stat' ? fixture.stat : fixture.io;
      if (value === undefined) throw new Error('private-error-sentinel');
      const fd = content.size + 1;
      content.set(fd, Buffer.from(value));
      offsets.set(fd, 0);
      return fd;
    },
    readSync: (fd: number, output: Buffer, offset: number, length: number) => {
      const input = content.get(fd);
      const position = offsets.get(fd);
      if (input === undefined || position === undefined)
        throw new Error('fixture');
      const count = input.copy(output, offset, position, position + length);
      offsets.set(fd, position + count);
      return count;
    },
    closeSync: (fd: number) => {
      closed.push(fd);
    },
  }));
  const output = vi
    .spyOn(process.stdout, 'write')
    .mockImplementation(() => true);
  try {
    await import('./hostPressureReader.mjs');
    const text = output.mock.calls.map((call) => String(call[0])).join('');
    return { value: JSON.parse(text), text, paths, closed };
  } finally {
    output.mockRestore();
    vi.doUnmock('node:fs');
  }
};

afterEach(() => {
  vi.restoreAllMocks();
  vi.doUnmock('node:fs');
});

const stat =
  'cpu  100 20 30 40 50 60 70 80 900 1000\ncpu1 10 2 3 4 5 6 7 8 9 10\ncpu0 90 18 27 36 45 54 63 72 891 990\n';
const io =
  'some avg10=1.00 avg60=0.25 avg300=0.10 total=123456\nfull avg10=0.00 avg60=0.00 avg300=0.00 total=123\n';

describe('host pressure reader の固定 proc 実経路', () => {
  it('kernel 形式から 8 counter と PSI total だけを読み、guest は加算しない', async () => {
    const result = await readFixture({ stat, io });
    expect(result.paths).toEqual(['/proc/stat', '/proc/pressure/io']);
    expect(result.closed).toEqual([1, 2]);
    expect(result.value).toEqual({
      cpu: {
        fields: ['100', '20', '30', '40', '50', '60', '70', '80'],
        ids: ['0', '1'],
      },
      io: { some: '123456', full: '123' },
    });
    expect(Buffer.byteLength(result.text)).toBeLessThanOrEqual(4097);
  });

  it.each([
    ['不足', 'cpu 1 2 3 4 5 6 7\ncpu0 1\n'],
    ['重複 aggregate', `${stat}cpu 1 2 3 4 5 6 7 8\n`],
    ['重複 ID', `${stat}cpu0 1\n`],
    ['不正数値', 'cpu 1 2 3 4 5 6 7 private-sentinel\ncpu0 1\n'],
    ['長い数値', 'cpu 1 2 3 4 5 6 7 123456789012345678901\ncpu0 1\n'],
    ['巨大入力', 'private-sentinel'.repeat(5000)],
  ])('%s の CPU は unknown であり raw 値を出さない', async (_label, bad) => {
    const result = await readFixture({ stat: bad, io });
    expect(result.value.cpu).toBeNull();
    expect(result.value.io).toEqual({ some: '123456', full: '123' });
    expect(result.text).not.toContain('private-sentinel');
  });

  it.each([
    ['full 不足', 'some avg10=0.0 total=5\n', '5', null],
    ['some 不足', 'full avg10=0.0 total=6\n', null, '6'],
    ['重複行', 'some total=1\nsome total=2\nfull total=6\n', null, '6'],
    ['重複 total', 'some total=1 total=2\nfull total=6\n', null, '6'],
    ['不正数値', 'some total=private-sentinel\nfull total=6\n', null, '6'],
    ['長い数値', 'some total=123456789012345678901\nfull total=6\n', null, '6'],
  ])('%s の PSI 値は unknown にする', async (_label, bad, some, full) => {
    const result = await readFixture({ stat, io: bad });
    expect(result.value.io).toEqual({ some, full });
    expect(result.text).not.toContain('private-sentinel');
  });

  it('read 不能と巨大 PSI は各々 unknown、例外を公開しない', async () => {
    const result = await readFixture({ io: 'private-sentinel'.repeat(5000) });
    expect(result.value).toEqual({ cpu: null, io: null });
    expect(result.closed).toEqual([1]);
    expect(result.text).not.toContain('private');
  });
});
