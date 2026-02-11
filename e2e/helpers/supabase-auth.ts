import { createClient } from '@supabase/supabase-js';

import type { Session } from '@supabase/supabase-js';

/** ブラウザCookieのパラメータ型 */
type BrowserCookie = {
  name: string;
  value: string;
  domain: string;
  path: string;
  sameSite: 'Strict' | 'Lax' | 'None';
  httpOnly: boolean;
  secure: boolean;
};

/** Supabase SSR のCookieチャンクサイズ上限（バイト） */
const CHUNK_SIZE = 3180;

/** 文字列をbase64url形式にエンコード */
function stringToBase64URL(str: string): string {
  return Buffer.from(str).toString('base64url');
}

/**
 * Supabase SSR v0.8.0 のCookie形式でセッションCookieを構築する
 *
 * - Cookie名: sb-<projectRef>-auth-token
 * - Cookie値: base64-<base64url encoded session JSON>
 * - 3180バイト超の場合はチャンク化（.0, .1, ...）
 */
export function buildSupabaseCookies(
  supabaseUrl: string,
  session: Session,
): BrowserCookie[] {
  const projectRef = new URL(supabaseUrl).hostname.split('.')[0];
  const cookieName = `sb-${projectRef}-auth-token`;

  const sessionJson = JSON.stringify(session);
  const cookieValue = `base64-${stringToBase64URL(sessionJson)}`;

  const cookieOptions = {
    domain: 'localhost',
    path: '/',
    sameSite: 'Lax' as const,
    httpOnly: false,
    secure: false,
  };

  if (cookieValue.length <= CHUNK_SIZE) {
    return [{ name: cookieName, value: cookieValue, ...cookieOptions }];
  }

  const chunks: BrowserCookie[] = [];
  for (let i = 0; i < cookieValue.length; i += CHUNK_SIZE) {
    chunks.push({
      name: `${cookieName}.${chunks.length}`,
      value: cookieValue.slice(i, i + CHUNK_SIZE),
      ...cookieOptions,
    });
  }

  return chunks;
}

/**
 * テストユーザーでSupabaseにログインしセッションを取得する
 */
export async function signInTestUser(
  supabaseUrl: string,
  anonKey: string,
  email: string,
  password: string,
): Promise<Session> {
  const supabase = createClient(supabaseUrl, anonKey);

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    throw new Error(`テストユーザーのログインに失敗: ${error.message}`);
  }

  if (!data.session) {
    throw new Error('セッションが取得できませんでした');
  }

  return data.session;
}
