import { isNil } from 'ramda';

const RESERVED = ['case', 'variant', 'binding'] as const;
const ID_PATTERN = /^[a-zA-Z0-9][a-zA-Z0-9_.-]*$/;

/** runnerの内部IDと区別した恒久IDを読む。予約タグのtypoをlegacyへ降格しない。 */
export const readTestTags = (tags: string[]) => {
  const values = new Map<string, string>();
  for (const tag of tags) {
    for (const name of RESERVED) {
      if (tag !== `@${name}` && !tag.startsWith(`@${name}:`)) continue;
      const value = tag.slice(name.length + 2);
      if (!ID_PATTERN.test(value) || values.has(name)) {
        throw new Error(`予約タグ ${tag} が不正または重複しています`);
      }
      values.set(name, value);
    }
  }
  if (values.size === 0) return null;
  const caseId = values.get('case');
  const variant = values.get('variant');
  if (isNil(caseId) || isNil(variant)) {
    throw new Error('@caseと@variantは両方の指定が必要です');
  }
  return { caseId, variant, binding: values.get('binding') ?? 'main' };
};
