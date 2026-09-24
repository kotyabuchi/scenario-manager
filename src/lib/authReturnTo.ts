export const AUTH_RETURN_TO_KEY = 'scenario-manager:auth-return-to';

/** 認証後の遷移先をアプリ内の相対パスに限定する。 */
export const normalizeAuthReturnTo = (value: string | null | undefined) => {
  if (
    !value?.startsWith('/') ||
    value.startsWith('//') ||
    value.includes('\\')
  ) {
    return '/home';
  }

  const url = new URL(value, 'https://scenario-manager.invalid');
  if (url.origin !== 'https://scenario-manager.invalid') return '/home';
  if (url.pathname.startsWith('/auth/')) return '/home';

  return `${url.pathname}${url.search}${url.hash}`;
};
