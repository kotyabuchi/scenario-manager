import { expect, applicationTest as test } from '../fixtures/test';
import { SessionDetailPage } from '../pages/session-detail-page';

test(
  '参加申請と取り消しが申請者と主催者の再読み込みに反映される',
  {
    tag: [
      '@case:session-application-round-trip',
      '@variant:applicant',
      '@binding:main',
    ],
  },
  async ({ applicationFixture, fixtureJournal, asActor }) => {
    const { sessionId, applicantId } = applicationFixture;
    const participant = {
      kind: 'session_participants',
      sessionId,
      userId: applicantId,
    } as const;
    const message = `参加申請の往復 ${sessionId}`;
    const applicantPage = await (await asActor('applicant')).newPage();
    const creatorPage = await (await asActor('creator-only')).newPage();
    const applicant = new SessionDetailPage(applicantPage);
    const creator = new SessionDetailPage(creatorPage);
    const request = applicantPage.getByRole('button', {
      name: '参加申請',
      exact: true,
    });
    const applicantCard = creatorPage.getByRole('article').filter({
      has: creatorPage.getByText('E2E applicant', { exact: true }),
    });
    const confirmedCard = creatorPage.getByRole('article').filter({
      has: creatorPage.getByText('E2E confirmed-player', { exact: true }),
    });

    await applicant.goto(sessionId);
    await creator.goto(sessionId);
    await creator.clickApplicationsLink();
    await expect(
      creatorPage.getByRole('heading', { name: '参加申請管理', exact: true }),
    ).toBeVisible();
    await expect(confirmedCard).toBeVisible();
    await expect(applicantCard).toHaveCount(0);

    await request.click();
    const applyDialog = applicantPage.getByRole('dialog', {
      name: 'セッションに参加申請',
      exact: true,
    });
    await expect(
      applyDialog.getByRole('radio', { name: /^プレイヤーとして参加/ }),
    ).toBeChecked();
    await applyDialog.getByLabel('一言メッセージ').fill(message);
    // UI操作が途中で失敗しても、申請者の所有行をcleanupできるよう先に予約する。
    await fixtureJournal.reserve(participant);
    await applyDialog.getByRole('button', { name: '申請を送る' }).click();
    await expect(applyDialog).toBeHidden();

    await applicantPage.reload();
    await expect(request).toHaveCount(0);
    await creatorPage.reload();
    await expect(applicantCard).toHaveCount(1);
    await expect(
      applicantCard.getByText(message, { exact: true }),
    ).toBeVisible();
    await expect(
      applicantCard.getByRole('button', {
        name: 'E2E applicantの申請を承認する',
        exact: true,
      }),
    ).toBeVisible();
    await applicant.clickMoreActionsMenu();
    const cancelAction = applicantPage.getByRole('menuitem', {
      name: '申請取り消し',
      exact: true,
    });
    await expect(cancelAction).toBeVisible();
    await fixtureJournal.record(participant);

    await cancelAction.click();
    const cancelDialog = applicantPage.getByRole('dialog', {
      name: '参加申請を取り消す',
      exact: true,
    });
    await cancelDialog.getByRole('button', { name: '申請を取り消す' }).click();
    await expect(cancelDialog).toBeHidden();

    await applicantPage.reload();
    await expect(request).toBeVisible();
    await creatorPage.reload();
    await expect(confirmedCard).toBeVisible();
    await expect(applicantCard).toHaveCount(0);
    await fixtureJournal.removed(participant);
  },
);
