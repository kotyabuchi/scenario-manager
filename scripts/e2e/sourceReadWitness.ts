import { createHash } from 'node:crypto';

type SourceReadQuery =
  | {
      operation:
        | 'git.listFiles'
        | 'fs.realpath'
        | 'fs.exists'
        | 'ts.readFile'
        | 'ts.fileExists'
        | 'ts.directoryExists'
        | 'ts.getDirectories'
        | 'ts.realpath';
      arguments: readonly [string];
    }
  | {
      operation: 'ts.readDirectory';
      arguments: readonly [
        string,
        readonly string[] | undefined,
        readonly string[] | undefined,
        readonly string[] | undefined,
        number | undefined,
      ];
    };

type SourceReadObserver = <T>(read: () => T, query?: SourceReadQuery) => T;

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

/** 実readの値を保持せず、queryの初出順で再読できる証拠だけを残す。 */
export const createSourceReadWitness = () => {
  const reads: { read: () => unknown; digest: string }[] = [];
  const keyedDigests = new Map<string, string>();
  let isValid = true;
  const observe: SourceReadObserver = <T>(
    read: () => T,
    query?: SourceReadQuery,
  ): T => {
    let value: T;
    try {
      // 初回のreadとguardの順序は変えず、値の揺れも観測する。
      value = read();
    } catch (error) {
      isValid = false;
      throw error;
    }
    const valueDigest = digest(value);
    if (valueDigest === undefined) isValid = false;
    else {
      const key = query === undefined ? undefined : JSON.stringify(query);
      const previous = key === undefined ? undefined : keyedDigests.get(key);
      if (previous !== undefined) {
        if (previous !== valueDigest) isValid = false;
      } else {
        if (key !== undefined) keyedDigests.set(key, valueDigest);
        reads.push({ read, digest: valueDigest });
      }
    }
    return value;
  };
  const matches = () => {
    if (!isValid || reads.length === 0) return false;
    // 同一queryの実readは初出位置で一度行う。呼出しをまたぐmemoは持たない。
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

export type { SourceReadObserver, SourceReadQuery };
