// OSの動的ポート範囲と既存dev/E2Eポートを避け、新経路で共有する固定値。
export const ISOLATED_APP_PORT = 43100;
export const ISOLATED_BASE_URL = `http://127.0.0.1:${ISOLATED_APP_PORT}`;
