import { test as setup } from '@playwright/test';

import { buildSupabaseCookies, signInTestUser } from './helpers/supabase-auth';

const authFile = 'e2e/.auth/user.json';

setup('テストユーザーで認証', async ({ page }) => {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const email = process.env.E2E_TEST_USER_EMAIL;
  const password = process.env.E2E_TEST_USER_PASSWORD;

  if (!supabaseUrl || !anonKey || !email || !password) {
    setup.skip(true, '認証用環境変数が設定されていません');
    return;
  }

  // Supabase にログイン
  const session = await signInTestUser(supabaseUrl, anonKey, email, password);

  // Cookie を構築してブラウザに設定
  const cookies = buildSupabaseCookies(supabaseUrl, session);
  await page.context().addCookies(cookies);

  // 認証確認: /scenarios/import にアクセスしてリダイレクトされないこと
  await page.goto('/scenarios/import');
  await page.waitForLoadState('domcontentloaded');

  // storageState を保存
  await page.context().storageState({ path: authFile });
});
