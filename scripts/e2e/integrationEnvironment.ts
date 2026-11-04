const REQUIRED_ENV_NAMES = [
  'E2E_SUPABASE_URL',
  'E2E_SUPABASE_ANON_KEY',
  'E2E_SUPABASE_SERVICE_ROLE_KEY',
] as const;

const LOCAL_SUPABASE_URL =
  /^https?:\/\/(?:localhost|127\.0\.0\.1|\[::1\])(?::\d+)?\/?$/i;

/**
 * DB統合テストの接続先を検証する。既存のアプリ設定や.envへはフォールバックしない。
 * 接続情報をエラーメッセージに含めず、DB通信前に設定不足・非ローカル接続を拒否する。
 */
export const assertIntegrationEnvironment = (
  env: Partial<NodeJS.ProcessEnv>,
) => {
  const missingNames = REQUIRED_ENV_NAMES.filter((name) => !env[name]?.trim());
  if (missingNames.length > 0) {
    throw new Error(
      `DB統合テストの専用環境変数が不足しています: ${missingNames.join(', ')}`,
    );
  }

  const url = env.E2E_SUPABASE_URL ?? '';
  const anonKey = env.E2E_SUPABASE_ANON_KEY ?? '';
  const serviceRoleKey = env.E2E_SUPABASE_SERVICE_ROLE_KEY ?? '';

  // URLの正規化前にも検証し、userinfo・path・query・別表記のIPを許可しない。
  if (url !== url.trim() || !LOCAL_SUPABASE_URL.test(url)) {
    throw new Error(
      'E2E_SUPABASE_URLにはlocalhost・127.0.0.1・[::1]のHTTP(S)ルートURLを指定してください。認証情報・パス・クエリ・フラグメントは使用できません。',
    );
  }

  try {
    new URL(url);
  } catch {
    throw new Error('E2E_SUPABASE_URLのURL形式またはポートが不正です。');
  }

  return { url, anonKey, serviceRoleKey };
};
