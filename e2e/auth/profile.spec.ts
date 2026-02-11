import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

import { ProfilePage } from '../pages/profile-page';

/**
 * プロフィール設定のE2Eテスト（認証必須）
 */
test.describe('プロフィール設定', () => {
  let profilePage: ProfilePage;

  test.beforeEach(async ({ page }) => {
    profilePage = new ProfilePage(page);
    await profilePage.goto();
  });

  test('プロフィール設定ページが表示される', async ({ page }) => {
    await expect(page).toHaveTitle(/プロフィール設定/);
  });

  test('フォームフィールドが表示される', async () => {
    await expect(profilePage.userNameInput).toBeVisible();
    await expect(profilePage.nicknameInput).toBeVisible();
    await expect(profilePage.bioTextarea).toBeVisible();
  });

  test('現在のプロフィール情報がプリセットされている', async () => {
    // ユーザーIDと表示名には値がプリセットされている
    await expect(profilePage.userNameInput).not.toHaveValue('');
    await expect(profilePage.nicknameInput).not.toHaveValue('');
  });

  test('「公開プロフィールを見る」リンクが存在する', async () => {
    await expect(profilePage.publicProfileLink).toBeVisible();
  });

  test('公開プロフィールに遷移できる', async ({ page }) => {
    await profilePage.publicProfileLink.click();
    await expect(page).toHaveURL(/\/users\//);
  });

  test('アクセシビリティ違反がない', async ({ page }) => {
    const results = await new AxeBuilder({ page })
      .include('header')
      .include('main')
      .include('footer')
      .disableRules(['color-contrast'])
      .analyze();
    expect(results.violations).toEqual([]);
  });
});
