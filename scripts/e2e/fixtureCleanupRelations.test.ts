import { isNil } from 'ramda';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { cleanupFixture } from '../../e2e/fixtures/fixtureCleanup';
import { FIXTURE_PARENT_REFERENCES } from '../../e2e/fixtures/fixtureCleanupRelations';
import { createFixtureJournal } from '../../e2e/fixtures/fixtureManifest';
import { EXPECTED_ENVIRONMENT_CATALOG } from './environmentCatalogExpected';
import {
  createFeedbackCleanupFixture,
  feedback,
} from './fixtures/environment/feedbackCleanup';
import { scenario, session, user } from './fixtures/environment/fixtureCleanup';

import { mkdir, mkdtemp, readFile, rm } from 'node:fs/promises';
import { join, resolve, sep } from 'node:path';

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
  const value = createFeedbackCleanupFixture();
  mocks.createClient.mockReturnValue(value.client);
  return value;
};

describe('親削除による記録外の行変更を防ぐ', () => {
  it('固定catalogにある全incoming FKと検査一覧が完全一致する', () => {
    const expected = EXPECTED_ENVIRONMENT_CATALOG.constraints
      .filter((constraint) => constraint.type === 'f')
      .flatMap((constraint) => {
        const match =
          /^FOREIGN KEY \(([^)]+)\) REFERENCES (users|scenarios|game_sessions|feedbacks)\(/.exec(
            constraint.definition,
          );
        if (isNil(match)) return [];
        return [
          { parent: match[2], table: constraint.table, column: match[1] },
        ];
      });
    const key = (value: {
      parent: string | undefined;
      table: string;
      column: string | undefined;
    }) => JSON.stringify([value.parent, value.table, value.column]);
    expect(FIXTURE_PARENT_REFERENCES.map(key).sort()).toEqual(
      expected.map(key).sort(),
    );
    expect(
      expected.filter((reference) => reference.parent !== 'feedbacks'),
    ).toHaveLength(25);
    expect(expected).toHaveLength(27);
  });

  it('未記録participantを残し、session削除とscenarioのSET NULLを止める', async () => {
    const value = setup();
    const foreign = {
      session_id: session.id,
      user_id: '01J00000000000000000000999',
    };
    value.rows.get('session_participants')?.push(foreign);
    const result = await cleanupFixture(value.connection, value.journal);
    expect(result.status).toBe('incomplete');
    expect(result.issues).toContainEqual({
      code: 'REFERENCE_REMAINS',
      resource: `game_sessions:${session.id}`,
      reference: { table: 'session_participants', column: 'session_id' },
    });
    expect(value.rows.get('session_participants')).toContainEqual(foreign);
    expect(value.deleted).not.toContain('game_sessions');
    expect(value.deleted).not.toContain('scenarios');
    expect(value.deleted).not.toContain('users');
    expect(value.deleted).not.toContain('auth-user');
  });

  it.each(
    FIXTURE_PARENT_REFERENCES,
  )('$table / $column の未記録行がある親 $parent を削除しない', async (reference) => {
    const value = setup();
    const ids = {
      feedbacks: feedback.id,
      users: user.id,
      scenarios: scenario.id,
      game_sessions: session.id,
    };
    const foreign = {
      [reference.column]: ids[reference.parent],
      fixture_foreign_row: true,
    };
    value.rows.set(reference.table, [
      ...(value.rows.get(reference.table) ?? []),
      foreign,
    ]);
    const result = await cleanupFixture(value.connection, value.journal);
    expect(result.status).toBe('incomplete');
    expect(value.deleted).not.toContain(reference.parent);
    expect(value.rows.get(reference.table)).toContainEqual(foreign);
  });

  it('未記録session_linksのtable/columnだけを実journalへ保存する', async () => {
    const value = setup();
    const base = resolve('test-results');
    await mkdir(base, { recursive: true });
    const directory = await mkdtemp(join(base, 'fixture-reference-'));
    if (!resolve(directory).startsWith(`${base}${sep}fixture-reference-`))
      throw new Error('テスト所有外です。');
    try {
      const connection = {
        ...value.connection,
        manifest: { ...value.connection.manifest, workdir: directory },
      };
      const { project, workerIndex, caseId, retry } = value.journal.owner;
      const journal = await createFixtureJournal(connection, {
        project,
        workerIndex,
        caseId,
        retry,
      });
      for (const { resource } of value.manifest.resources) {
        await journal.reserve(resource);
        await journal.record(resource);
      }
      value.rows.set('session_links', [
        {
          session_id: session.id,
          label: 'private-row-value',
          url: 'https://secret.example/path',
        },
      ]);
      const result = await cleanupFixture(connection, journal);
      const diagnostic = {
        code: 'REFERENCE_REMAINS',
        resource: `game_sessions:${session.id}`,
        reference: { table: 'session_links', column: 'session_id' },
      };
      expect(result.issues).toContainEqual(diagnostic);
      const saved = await readFile(journal.path, 'utf8');
      expect(JSON.parse(saved).cleanup.issues).toContainEqual(diagnostic);
      expect(saved).not.toMatch(
        /private-row-value|secret\.example|admin-only|anon-only/,
      );
      expect(value.deleted).not.toContain('game_sessions');
    } finally {
      await rm(directory, { recursive: true, force: true });
    }
  });

  it('参照一覧取得に失敗したparentを削除しない', async () => {
    const value = setup();
    value.observeErrors.add('session_links');
    const result = await cleanupFixture(value.connection, value.journal);
    expect(result.issues).toContainEqual({
      code: 'OBSERVATION_FAILED',
      resource: `game_sessions:${session.id}`,
      reference: { table: 'session_links', column: 'session_id' },
    });
    expect(value.deleted).not.toContain('game_sessions');
    expect(value.deleted).not.toContain('scenarios');
  });
});
