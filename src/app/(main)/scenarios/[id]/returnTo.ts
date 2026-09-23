const DEFAULT_RETURN_TO = '/scenarios';
const RETURN_TO_ORIGIN = 'https://scenario-manager.invalid';
const ALLOWED_SEARCH_PARAMS = new Set([
  'q',
  'systems',
  'tags',
  'minPlayer',
  'maxPlayer',
  'minPlaytime',
  'maxPlaytime',
  'sort',
]);

/** 詳細URLに含まれる一覧への戻り先を、同一サイトの一覧URLだけに制限する。 */
export const resolveScenarioListReturnTo = (
  value: string | string[] | undefined,
): string => {
  if (typeof value !== 'string' || !value.startsWith('/scenarios')) {
    return DEFAULT_RETURN_TO;
  }

  try {
    const url = new URL(value, RETURN_TO_ORIGIN);
    if (
      url.origin !== RETURN_TO_ORIGIN ||
      url.pathname !== DEFAULT_RETURN_TO ||
      url.username !== '' ||
      url.password !== '' ||
      [...url.searchParams.keys()].some(
        (key) => !ALLOWED_SEARCH_PARAMS.has(key),
      )
    ) {
      return DEFAULT_RETURN_TO;
    }
    return `${url.pathname}${url.search}`;
  } catch {
    return DEFAULT_RETURN_TO;
  }
};
