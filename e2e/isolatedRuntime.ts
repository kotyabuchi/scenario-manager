// Windows/Linuxの既定TCP動的割当範囲を避け、専用runner間で共有する。
// OSの独自設定や他サービスの占有もあり得るため、起動時の空き検査は省略しない。
export const ISOLATED_SUPABASE_PORTS = {
  api: 27321,
  db: 27322,
  shadow: 27320,
};
export const ISOLATED_APP_PORT = 23100;
export const ISOLATED_STORYBOOK_PORT = 6007;
export const ISOLATED_BASE_URL = `http://127.0.0.1:${ISOLATED_APP_PORT}`;
