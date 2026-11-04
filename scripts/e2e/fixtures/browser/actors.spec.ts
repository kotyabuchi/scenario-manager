import { expect, test } from '../../../../e2e/fixtures/test';
import { ProfilePage } from '../../../../e2e/pages/profile-page';

// 同一projectの独立testを2 workerへ配分し、PC/mobileとも実画面の本人情報を検査する。
for (const kind of ['creator-only', 'keeper-only'] as const) {
  test(`${kind}の認証とcase所有行を分離する`, async ({
    actors,
    asActor,
    sessionFixture,
  }) => {
    const context = await asActor(kind);
    const page = await context.newPage();
    const profile = new ProfilePage(page);
    await profile.goto();
    await expect(profile.userNameInput).toHaveValue(
      `e2e_${actors[kind].identity.appUserId.toLowerCase()}`,
    );
    expect(sessionFixture.creatorId).not.toBe(sessionFixture.keeperId);
    expect(sessionFixture.playerId).not.toBe(
      actors.outsider.identity.appUserId,
    );
    const anonymous = await asActor('anonymous');
    expect(await anonymous.cookies()).toEqual([]);
  });
}
