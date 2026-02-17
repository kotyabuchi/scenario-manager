/** Crockford's Base32（ULID使用文字セット）に対応する26文字の検証 */
const ULID_REGEX = /^[0-9A-HJKMNP-TV-Z]{26}$/i;

/** ULID フォーマットの簡易検証 */
export const isValidUlid = (id: string): boolean => ULID_REGEX.test(id);
