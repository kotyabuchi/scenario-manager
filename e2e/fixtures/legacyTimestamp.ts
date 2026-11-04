import { z } from 'zod';

const TIMESTAMP =
  /^(\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2})(?:\.(\d{1,6}))?(Z|[+-]\d{2}:\d{2})?$/;
const MICROSECONDS_PER_MILLISECOND = BigInt(1_000);
const FRACTION_DIGITS = 6;

// local DBのtimestamp without time zoneはUTCのnaive値。元文字列はexact delete用に保持する。
export const legacyTimestampSchema = z.iso
  .datetime({ local: true, offset: true })
  .regex(TIMESTAMP);

/** ミリ秒未満も切り捨てず、明示offsetまたはUTCのnaive値として比較する。 */
const microseconds = (value: string): bigint => {
  const match = TIMESTAMP.exec(legacyTimestampSchema.parse(value));
  if (!match?.[1]) throw new Error('legacy作成日時が不正です。');
  const milliseconds = Date.parse(`${match[1]}${match[3] ?? 'Z'}`);
  if (!Number.isFinite(milliseconds))
    throw new Error('legacy作成日時が不正です。');
  const fraction = (match[2] ?? '').padEnd(FRACTION_DIGITS, '0');
  return BigInt(milliseconds) * MICROSECONDS_PER_MILLISECOND + BigInt(fraction);
};

export const legacyTimestampAtOrAfter = (value: string, threshold: string) =>
  microseconds(value) >= microseconds(threshold);
