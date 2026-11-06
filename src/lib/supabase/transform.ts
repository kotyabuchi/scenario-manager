/**
 * スネークケース→キャメルケース変換ユーティリティ
 *
 * Supabase REST APIはスネークケースのカラム名を返すため、
 * アプリケーション層で使用するキャメルケースに変換する
 */

type CamelCase<S extends string> = S extends `${infer P}_${infer Q}`
  ? `${P}${Capitalize<CamelCase<Q>>}`
  : S;

type CamelCaseKeys<T> =
  T extends Array<infer U>
    ? CamelCaseKeys<U>[]
    : T extends Record<string, unknown>
      ? {
          [K in keyof T as K extends string
            ? CamelCase<K>
            : K]: T[K] extends Record<string, unknown> | null
            ? T[K] extends null
              ? null
              : CamelCaseKeys<T[K]>
            : T[K] extends Array<infer U>
              ? CamelCaseKeys<U>[]
              : T[K];
        }
      : T;

const toCamelCase = (str: string): string =>
  str.replace(/_([a-z])/g, (_, char: string) => char.toUpperCase());

/**
 * オブジェクトのキーをスネークケースからキャメルケースに変換する
 * ネストされたオブジェクトと配列も再帰的に変換する
 */
export const camelCaseKeys = <T extends Record<string, unknown>>(
  obj: T,
): CamelCaseKeys<T> => {
  if (Array.isArray(obj)) {
    return obj.map((item) =>
      typeof item === 'object' && item !== null
        ? camelCaseKeys(item as Record<string, unknown>)
        : item,
    ) as CamelCaseKeys<T>;
  }

  const result: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(obj)) {
    const camelKey = toCamelCase(key);
    if (Array.isArray(value)) {
      result[camelKey] = value.map((item) =>
        typeof item === 'object' && item !== null
          ? camelCaseKeys(item as Record<string, unknown>)
          : item,
      );
    } else if (typeof value === 'object' && value !== null) {
      result[camelKey] = camelCaseKeys(value as Record<string, unknown>);
    } else {
      result[camelKey] = value;
    }
  }
  return result as CamelCaseKeys<T>;
};

/**
 * 配列の各要素のキーをキャメルケースに変換する
 */
export const camelCaseRows = <T extends Record<string, unknown>>(
  rows: T[],
): CamelCaseKeys<T>[] => rows.map((row) => camelCaseKeys(row));

/**
 * unknown をランタイム型ガード付きで Record<string, unknown> に変換する
 * Supabase のリレーション結果など型が不確定な値に使用し、
 * 呼び出し元での `as Record<string, unknown>` キャストを排除する
 */
export const toRecord = (value: unknown): Record<string, unknown> =>
  typeof value === 'object' && value !== null
    ? (value as Record<string, unknown>)
    : {};

/**
 * unknown をランタイム型ガード付きで Array<Record<string, unknown>> に変換する
 */
export const toRecordArray = (
  value: unknown,
): Array<Record<string, unknown>> =>
  Array.isArray(value) ? value.map(toRecord) : [];

export type { CamelCaseKeys };
