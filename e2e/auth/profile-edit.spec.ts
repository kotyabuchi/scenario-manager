import { expect, test } from '@playwright/test';

import { ProfilePage } from '../pages/profile-page';

/**
 * プロフィール編集のE2Eテスト（認証必須・DB書き込みあり）
 *
 * テストユーザーのユーザーIDが日本語（Zodスキーマの英数字制約に違反）の場合、
 * 有効な値に一時修正してから送信する。
 */
test.describe('プロフィール編集', () => {
  test.describe.configure({ mode: 'serial' });

  let profilePage: ProfilePage;

  test.beforeEach(async ({ page }) => {
    profilePage = new ProfilePage(page);
    await profilePage.goto();
    // フォームのハイドレーション完了を待つ
    await expect(profilePage.nicknameInput).not.toHaveValue('');
  });

  test('表示名を変更して送信すると成功メッセージが表示される', async ({
    page,
  }) => {
    // 元の値を保存
    const originalUserName = await profilePage.userNameInput.inputValue();
    const originalNickname = await profilePage.nicknameInput.inputValue();

    // ユーザーIDが英数字のみでない場合、有効な値に修正
    const isValidUserName = /^[a-zA-Z0-9_]{3,30}$/.test(originalUserName);
    if (!isValidUserName) {
      await profilePage.userNameInput.clear();
      await profilePage.userNameInput.fill('e2e_test_user');
    }

    // 表示名を一時変更して送信
    const tempNickname = `${originalNickname}_E2E`;
    await profilePage.nicknameInput.clear();
    await profilePage.nicknameInput.fill(tempNickname);
    await profilePage.submitButton.click();

    // 成功メッセージの確認
    await expect(page.getByText('プロフィールを更新しました')).toBeVisible();

    // 元の表示名に復元（ユーザーIDは有効な値のまま維持）
    await profilePage.nicknameInput.clear();
    await profilePage.nicknameInput.fill(originalNickname);
    await profilePage.submitButton.click();

    // 復元の成功も確認
    await expect(page.getByText('プロフィールを更新しました')).toBeVisible();
  });

  test('空のユーザーIDで送信するとバリデーションエラー', async ({ page }) => {
    await profilePage.userNameInput.clear();
    await profilePage.submitButton.click();

    await expect(
      page.getByText('ユーザーIDは3文字以上で入力してください'),
    ).toBeVisible();
  });
});
