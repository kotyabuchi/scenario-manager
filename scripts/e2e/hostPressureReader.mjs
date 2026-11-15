import { closeSync, openSync, readSync } from 'node:fs';

// 固定proc以外を受け取らず、全量を小さい上限で読み取る。
const LIMIT = 65536;
const read = (path) => {
  const fd = openSync(path, 'r');
  try {
    const buffer = Buffer.alloc(LIMIT + 1);
    let offset = 0;
    while (offset < buffer.length) {
      const length = readSync(fd, buffer, offset, buffer.length - offset, null);
      if (length === 0) break;
      offset += length;
    }
    if (offset > LIMIT) throw new Error('oversized');
    return buffer.subarray(0, offset).toString('utf8');
  } finally {
    closeSync(fd);
  }
};

const sample = () => {
  let cpu = null;
  let io = null;
  try {
    const lines = read('/proc/stat').split('\n');
    const aggregate = lines.filter((line) => /^cpu\s/.test(line));
    const ids = lines.flatMap((line) => /^cpu(\d+)\s/.exec(line)?.[1] ?? []);
    const fields = aggregate[0]?.trim().split(/\s+/).slice(1, 9);
    if (
      aggregate.length === 1 &&
      fields?.length === 8 &&
      fields.every((x) => /^\d{1,20}$/.test(x)) &&
      ids.length > 0 &&
      new Set(ids).size === ids.length
    )
      cpu = { fields, ids: ids.sort() };
  } catch {
    // 個別の未取得をnullにして他の値を保つ。
  }
  try {
    const lines = read('/proc/pressure/io').split('\n');
    const value = (kind) => {
      const matches = lines.filter((line) => line.startsWith(`${kind} `));
      if (matches.length !== 1) return null;
      const totals = matches[0]
        .split(/\s+/)
        .filter((item) => item.startsWith('total='));
      return totals.length === 1 && /^total=\d{1,20}$/.test(totals[0])
        ? totals[0].slice(6)
        : null;
    };
    io = { some: value('some'), full: value('full') };
  } catch {
    // 未対応または取得不能。
  }
  return { cpu, io };
};

const output = JSON.stringify(sample());
process.stdout.write(
  `${Buffer.byteLength(output) <= 4096 ? output : '{"cpu":null,"io":null}'}\n`,
);
