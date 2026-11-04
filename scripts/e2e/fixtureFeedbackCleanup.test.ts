import { beforeEach, describe, expect, it, vi } from 'vitest';

import { cleanupFixture } from '../../e2e/fixtures/fixtureCleanup';
import { fixtureManifestSchema } from '../../e2e/fixtures/fixtureSchema';
import {
  comment,
  createFeedbackCleanupFixture,
  feedback,
  vote,
} from './fixtures/environment/feedbackCleanup';
import { user } from './fixtures/environment/fixtureCleanup';

const mocks = vi.hoisted(() => ({
  createClient: vi.fn(),
  assertConnection: vi.fn(),
}));
vi.mock('@supabase/supabase-js', () => ({ createClient: mocks.createClient }));
vi.mock('./environmentCredentials', () => ({
  assertFixtureConnection: mocks.assertConnection,
}));
beforeEach(() => {
  vi.clearAllMocks();
  mocks.assertConnection.mockReset();
});
const setup = () => {
  const value = createFeedbackCleanupFixture(true);
  mocks.createClient.mockReturnValue(value.client);
  return value;
};

describe('所有feedbackのUI生成子を回収する', () => {
  it('同caseのcommentとvoteをjournal保存してから子・feedback・userの順にexact削除する', async () => {
    const value = setup();
    expect((await cleanupFixture(value.connection, value.journal)).status).toBe(
      'complete',
    );
    for (const child of [comment, vote]) {
      expect(value.journal.reserve).toHaveBeenCalledWith(child);
      expect(value.journal.record).toHaveBeenCalledWith(child);
    }
    expect(value.deleted.indexOf('feedback_comments')).toBeLessThan(
      value.deleted.indexOf('feedbacks'),
    );
    expect(value.deleted.indexOf('feedback_votes')).toBeLessThan(
      value.deleted.indexOf('feedbacks'),
    );
    expect(value.deleted.indexOf('feedbacks')).toBeLessThan(
      value.deleted.indexOf('users'),
    );
    expect(value.observed).toContainEqual({
      table: 'feedback_comments',
      filters: {
        comment_id: comment.id,
        feedback_id: feedback.id,
        user_id: user.id,
      },
      deleting: true,
    });
    expect(value.observed).toContainEqual({
      table: 'feedback_votes',
      filters: { feedback_id: feedback.id, user_id: user.id },
      deleting: true,
    });
    expect(
      fixtureManifestSchema.safeParse(value.journal.snapshot()).success,
    ).toBe(true);
  });

  it.each([
    'feedback_comments',
    'feedback_votes',
  ] as const)('未知userの%sは所有と認めず親とuserも保護する', async (table) => {
    const value = setup();
    const rows = value.rows.get(table);
    if (!rows?.[0]) throw new Error('fixture不足');
    rows[0].user_id = '01J00000000000000000000999';
    const result = await cleanupFixture(value.connection, value.journal);
    expect(result.status).toBe('incomplete');
    expect(
      result.issues.some((issue) => issue.code === 'OWNERSHIP_MISMATCH'),
    ).toBe(true);
    expect(value.deleted).not.toContain(table);
    expect(value.deleted).not.toContain('feedbacks');
    expect(value.deleted).not.toContain('users');
    expect(value.deleted).not.toContain('auth-user');
  });

  it('feedback owner差替えを子収集より前に拒否する', async () => {
    const value = setup();
    value.rows.set('feedbacks', [
      { feedback_id: feedback.id, user_id: 'foreign-user' },
    ]);
    expect((await cleanupFixture(value.connection, value.journal)).status).toBe(
      'incomplete',
    );
    expect(value.journal.reserve).not.toHaveBeenCalled();
    expect(value.deleted).not.toContain('feedback_comments');
    expect(value.deleted).not.toContain('feedback_votes');
    expect(value.deleted).not.toContain('feedbacks');
  });

  it('予約保存が失敗したUI子を削除せずfeedbackのCASCADEも止める', async () => {
    const value = setup();
    vi.mocked(value.journal.reserve).mockRejectedValue(
      new Error('private-save-error'),
    );
    const result = await cleanupFixture(value.connection, value.journal);
    expect(result.status).toBe('incomplete');
    expect(
      result.issues.some((issue) => issue.code === 'JOURNAL_SAVE_FAILED'),
    ).toBe(true);
    expect(value.deleted).not.toContain('feedbacks');
    expect(value.deleted).not.toContain('feedback_comments');
    expect(value.deleted).not.toContain('feedback_votes');
    expect(JSON.stringify(result)).not.toContain('private-save-error');
  });

  it('record保存失敗でも予約済の子をexact削除し失敗結果は保持する', async () => {
    const value = setup();
    vi.mocked(value.journal.record).mockRejectedValue(new Error('save failed'));
    const result = await cleanupFixture(value.connection, value.journal);
    expect(result.status).toBe('incomplete');
    expect(result.remaining).toEqual([]);
    expect(value.deleted).toContain('feedback_comments');
    expect(value.deleted).toContain('feedback_votes');
  });

  it.each([
    'feedback_comments',
    'feedback_votes',
  ] as const)('%sの一覧取得失敗でfeedbackを保護する', async (table) => {
    const value = setup();
    value.discoveryErrors.add(table);
    const result = await cleanupFixture(value.connection, value.journal);
    expect(result.status).toBe('incomplete');
    expect(value.deleted).not.toContain('feedbacks');
    expect(value.deleted).not.toContain('users');
  });

  it('削除済みvoteが再出現しても再削除しない', async () => {
    const value = setup();
    value.manifest.resources.push({ resource: vote, status: 'removed' });
    const result = await cleanupFixture(value.connection, value.journal);
    expect(result.remaining).toContainEqual(vote);
    expect(value.deleted).not.toContain('feedback_votes');
    expect(value.deleted).not.toContain('feedbacks');
  });

  it('feedback子のuser・feedback参照を同case所有IDに限定する', () => {
    const value = setup();
    value.manifest.resources.push({
      resource: { ...comment, userId: '01J00000000000000000000999' },
      status: 'reserved',
    });
    expect(fixtureManifestSchema.safeParse(value.manifest).success).toBe(false);
    value.manifest.resources.pop();
    value.manifest.resources.push({
      resource: { ...vote, feedbackId: '01J00000000000000000000999' },
      status: 'reserved',
    });
    expect(fixtureManifestSchema.safeParse(value.manifest).success).toBe(false);
  });
});
