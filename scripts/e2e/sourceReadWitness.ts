import { createHash } from 'node:crypto';

type SourceReadObserver = <T>(read: () => T) => T;

const digest = (value: unknown): string | undefined => {
  try {
    const serialized =
      value === undefined ? 'undefined' : JSON.stringify(value);
    if (serialized === undefined) return undefined;
    return createHash('sha256').update(serialized).digest('hex');
  } catch {
    return undefined;
  }
};

/** 実readの値を保持せず、同じ順序で再読できる証拠だけを残す。 */
export const createSourceReadWitness = () => {
  const reads: { read: () => unknown; digest: string }[] = [];
  let isValid = true;
  const observe: SourceReadObserver = <T>(read: () => T): T => {
    let value: T;
    try {
      value = read();
    } catch (error) {
      isValid = false;
      throw error;
    }
    const valueDigest = digest(value);
    if (valueDigest === undefined) isValid = false;
    else reads.push({ read, digest: valueDigest });
    return value;
  };
  const matches = () => {
    if (!isValid || reads.length === 0) return false;
    for (const entry of reads) {
      try {
        if (digest(entry.read()) !== entry.digest) return false;
      } catch {
        return false;
      }
    }
    return true;
  };
  return { observe, matches };
};

export type { SourceReadObserver };
