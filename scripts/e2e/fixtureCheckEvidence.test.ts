import { isNil } from 'ramda';
import { describe, expect, it } from 'vitest';
import { z } from 'zod';

import { fixtureOwnerTag } from '../../e2e/fixtures/fixtureManifest';
import {
  fixtureActorSchema,
  fixtureManifestSchema,
  fixtureOwnerSchema,
} from '../../e2e/fixtures/fixtureSchema';
import { validateFixtureCheckEvidence } from './fixtureCheckEvidence';
import { fixture as environment } from './fixtures/environment/ownership';

const annotation = (type: string) => ({ type });
const attachment = (name: string, value: unknown) => ({
  name,
  contentType: 'application/json',
  body: Buffer.from(JSON.stringify(value)).toString('base64'),
});
const at = <T>(values: T[], index: number): T => {
  const value = values[index];
  if (isNil(value)) throw new Error('検査fixtureが不足しています。');
  return value;
};
const fixture = () => {
  const identities = [
    ['chromium', 'creator-only', '5f38a9d80d97bc73afac'],
    ['chromium', 'keeper-only', '107e8fcac18c29625526'],
    ['mobile-chrome', 'creator-only', 'd153b6f0d6cbd06c999c'],
    ['mobile-chrome', 'keeper-only', '647eb407c6baefd66be5'],
  ] as const;
  const journals = identities.map(([project, role, hash], index) => {
    const owner = {
      lease: environment().lease,
      project,
      caseId: `5db385c67e1993015e4c-${hash}`,
      workerIndex: index,
      retry: 0,
    };
    const actors = [
      'creator-only',
      'keeper-only',
      'confirmed-player',
      'outsider',
    ].map((kind, actor) => ({
      kind,
      authUserId: `00000000-0000-4000-8000-${String(index * 4 + actor + 1).padStart(12, '0')}`,
      appUserId: `01J${String(index * 4 + actor + 1).padStart(23, '0')}`,
    }));
    const journal = fixtureManifestSchema.parse({
      schemaVersion: 1,
      owner,
      ownerTag: fixtureOwnerTag(owner),
      resources: [
        ...actors.flatMap((actor) => [
          {
            resource: { kind: 'auth-user', id: actor.authUserId },
            status: 'removed',
          },
          {
            resource: {
              kind: 'users',
              id: actor.appUserId,
              authUserId: actor.authUserId,
            },
            status: 'removed',
          },
        ]),
        {
          resource: {
            kind: 'game_sessions',
            id: `01K${String(index + 1).padStart(23, '0')}`,
            createdBy: at(actors, 0).appUserId,
          },
          status: 'removed',
        },
      ],
      cleanup: { status: 'complete', remaining: [], issues: [] },
    });
    return { journal, actors, role };
  });
  const report = {
    config: {
      version: '1.57.0',
      workers: 2,
      fullyParallel: true,
      projects: ['chromium', 'mobile-chrome'].map((name) => ({
        name,
        id: name,
        repeatEach: 1,
        retries: 0,
      })),
    },
    suites: [
      {
        title: 'actors.spec.ts',
        file: 'actors.spec.ts',
        specs: journals.map(({ journal, actors, role }, index) => ({
          title: `${role}の認証とcase所有行を分離する`,
          id: journal.owner.caseId,
          file: 'actors.spec.ts',
          ok: true,
          tests: [
            {
              projectName: journal.owner.project,
              projectId: journal.owner.project,
              expectedStatus: 'passed',
              status: 'expected',
              annotations: [] as { type: string }[],
              results: [
                {
                  status: 'passed',
                  workerIndex: index,
                  parallelIndex: index % 2,
                  retry: 0,
                  errors: [] as unknown[],
                  annotations: [] as { type: string }[],
                  attachments: [
                    attachment('fixture-actors', {
                      owner: journal.owner,
                      actors: [...actors, { kind: 'anonymous' }],
                    }),
                    attachment('fixture-cleanup', {
                      owner: journal.owner,
                      result: journal.cleanup,
                    }),
                    attachment(
                      'fixture-used-actor',
                      actors.find((actor) => actor.kind === role),
                    ),
                    attachment('fixture-used-actor', { kind: 'anonymous' }),
                  ],
                },
              ],
            },
          ],
        })),
      },
    ],
    errors: [] as unknown[],
    stats: { expected: 4, unexpected: 0, skipped: 0, flaky: 0 },
  };
  return { report, journals: journals.map(({ journal }) => journal) };
};
type Evidence = ReturnType<typeof fixture>;
const spec = (input: Evidence, index = 0) =>
  at(at(input.report.suites, 0).specs, index);
const test = (input: Evidence, index = 0) => at(spec(input, index).tests, 0);
const attempt = (input: Evidence, index = 0) =>
  at(test(input, index).results, 0);
const check = (input: Evidence) =>
  validateFixtureCheckEvidence(input.report, input.journals);
const codes = (input: Evidence) => check(input).issues.map(({ code }) => code);

describe('基盤受入のブラウザ証拠', () => {
  it('4登録・各caseの4actorとsession・cleanup・実workerを照合する', () => {
    const input = fixture();
    const before = structuredClone(input);
    expect(check(input)).toEqual({
      issues: [],
      counts: {
        tests: 4,
        passed: 4,
        projects: 2,
        workers: 4,
        journals: 4,
        authUsers: 16,
        appUsers: 16,
        sessions: 4,
      },
    });
    expect(input).toEqual(before);
    input.journals.reverse();
    at(input.report.suites, 0).specs.reverse();
    expect(check(input).issues).toEqual([]);
  });

  it('空・null・必要構造欠落を成功にしない', () => {
    for (const report of [null, {}, { suites: [] }])
      expect(validateFixtureCheckEvidence(report, []).issues).toContainEqual({
        code: 'REPORT_INVALID',
        subject: 'report',
      });
    const input = fixture();
    input.report.suites = [];
    expect(codes(input)).toContain('TEST_MISSING');
    expect(
      validateFixtureCheckEvidence(fixture().report, [null]).issues,
    ).toContainEqual({ code: 'JOURNAL_INVALID', subject: 'journal:0' });
  });

  it('欠落・未知testId・重複を拒否する', () => {
    const missing = fixture();
    at(missing.report.suites, 0).specs.pop();
    expect(codes(missing)).toContain('TEST_MISSING');
    const unknown = fixture();
    spec(unknown).id = 'different';
    expect(codes(unknown)).toContain('TEST_IDENTITY_MISMATCH');
    const duplicate = fixture();
    at(duplicate.report.suites, 0).specs.push(structuredClone(spec(duplicate)));
    expect(codes(duplicate)).toContain('DUPLICATE_TEST');
    const empty = fixture();
    const extra = structuredClone(spec(empty));
    extra.tests = [];
    at(empty.report.suites, 0).specs.push(extra);
    expect(codes(empty)).toContain('SPEC_TEST_COUNT_MISMATCH');
  });

  it.each([
    'title',
    'file',
    'projectName',
    'projectId',
  ])('登録の%s変更を拒否する', (field) => {
    const input = fixture();
    Reflect.set(
      field.startsWith('project') ? test(input) : spec(input),
      field,
      'different',
    );
    expect(codes(input)).toContain('TEST_IDENTITY_MISMATCH');
  });

  it('異なるreporter版・project集合・repeat/retry設定を拒否する', () => {
    const input = fixture();
    input.report.config.version = '1.58.0';
    at(input.report.config.projects, 0).retries = 1;
    at(input.report.config.projects, 1).repeatEach = 2;
    expect(codes(input)).toEqual(
      expect.arrayContaining([
        'PLAYWRIGHT_VERSION_MISMATCH',
        'PROJECTS_MISMATCH',
      ]),
    );
  });

  it('global errorやsummaryだけのskip/flakyを見逃さず秘密値は転記しない', () => {
    const input = fixture();
    input.report.errors = [{ message: 'private-key-do-not-copy' }];
    input.report.stats.flaky = 1;
    const result = check(input);
    expect(result.issues.map(({ code }) => code)).toEqual(
      expect.arrayContaining(['GLOBAL_ERRORS', 'STATS_MISMATCH']),
    );
    expect(JSON.stringify(result)).not.toContain('private-key');
  });

  it.each([
    'skipped',
    'failed',
    'timedOut',
    'interrupted',
  ])('%sを正常終了として扱わない', (status) => {
    const input = fixture();
    attempt(input).status = status;
    expect(codes(input)).toContain('TEST_NOT_CLEAN_PASS');
  });

  it('expected failure・flaky・test/resultの制御annotationを拒否する', () => {
    const changes: Array<(input: Evidence) => void> = [
      (input) => {
        test(input).expectedStatus = 'failed';
      },
      (input) => {
        test(input).status = 'flaky';
      },
      (input) => {
        test(input).annotations = [annotation('fail')];
      },
      (input) => {
        attempt(input).annotations = [annotation('skip')];
      },
      (input) => {
        attempt(input).annotations = [annotation('fixme')];
      },
      (input) => {
        attempt(input).errors = [{}];
      },
      (input) => {
        Reflect.set(attempt(input), 'error', {});
      },
      (input) => {
        spec(input).ok = false;
      },
    ];
    for (const change of changes) {
      const input = fixture();
      change(input);
      expect(codes(input)).toContain('TEST_NOT_CLEAN_PASS');
    }
  });

  it('retry成功・複数attempt・attempt欠落を拒否する', () => {
    const input = fixture();
    attempt(input).retry = 1;
    expect(codes(input)).toContain('TEST_NOT_CLEAN_PASS');
    attempt(input).retry = 0;
    test(input).results.push(structuredClone(attempt(input)));
    expect(codes(input)).toContain('TEST_NOT_CLEAN_PASS');
    test(input).results = [];
    expect(codes(input)).toContain('TEST_NOT_CLEAN_PASS');
  });

  it('project間でworkerが変わるだけでは並列実行の証拠にしない', () => {
    const input = fixture();
    attempt(input, 1).workerIndex = 0;
    attempt(input, 1).parallelIndex = 0;
    attempt(input, 3).workerIndex = 2;
    attempt(input, 3).parallelIndex = 0;
    expect(
      codes(input).filter((code) => code === 'MULTIPLE_WORKERS_REQUIRED'),
    ).toHaveLength(2);
    input.report.config.workers = 1;
    expect(codes(input)).toContain('PARALLEL_CONFIG_REQUIRED');
  });

  it.each([
    'project',
    'workerIndex',
    'retry',
    'caseId',
  ])('journalの%sを実attemptに結び付ける', (field) => {
    const input = fixture();
    const journal = at(input.journals, 0);
    Reflect.set(
      journal.owner,
      field,
      field === 'retry' || field === 'workerIndex' ? 9 : 'different',
    );
    journal.ownerTag = fixtureOwnerTag(journal.owner);
    expect(codes(input)).toContain(
      field === 'caseId' ? 'JOURNAL_MISSING' : 'JOURNAL_ATTEMPT_MISMATCH',
    );
  });

  it('journal欠落・重複・別run lease・所有タグ改変を拒否する', () => {
    const input = fixture();
    input.journals.pop();
    expect(codes(input)).toContain('JOURNAL_COUNT_MISMATCH');
    input.journals.push(structuredClone(at(input.journals, 0)));
    expect(codes(input)).toContain('DUPLICATE_JOURNAL');
    at(input.journals, 1).owner.lease.ownerNonce =
      '00000000-0000-4000-8000-000000000001';
    expect(codes(input)).toEqual(
      expect.arrayContaining(['LEASE_MISMATCH', 'OWNER_TAG_MISMATCH']),
    );
  });

  it('case間でAuth UUID/app ULID/session IDを共有できない', () => {
    const input = fixture();
    at(input.journals, 1).resources = structuredClone(
      at(input.journals, 0).resources,
    );
    expect(codes(input)).toContain('RESOURCE_SHARED_BETWEEN_CASES');
  });

  it('actor不足・Authとappの多対一・session不足を拒否する', () => {
    const input = fixture();
    const journal = at(input.journals, 0);
    journal.resources = journal.resources.filter(
      ({ resource }) => resource.kind !== 'game_sessions',
    );
    const users = journal.resources.flatMap(({ resource }) =>
      resource.kind === 'users' ? [resource] : [],
    );
    at(users, 1).authUserId = at(users, 0).authUserId;
    expect(codes(input)).toEqual(
      expect.arrayContaining([
        'RESOURCE_COUNTS_MISMATCH',
        'ACTOR_MAPPING_DUPLICATE',
      ]),
    );
  });

  it('cleanup未完了・残留・問題・resource未削除を拒否する', () => {
    for (const change of [
      'null',
      'incomplete',
      'remaining',
      'issues',
      'created',
    ]) {
      const input = fixture();
      const journal = at(input.journals, 0);
      if (change === 'null') journal.cleanup = null;
      else if (change === 'created')
        at(journal.resources, 0).status = 'created';
      else {
        if (isNil(journal.cleanup)) throw new Error('fixture不足');
        if (change === 'incomplete') journal.cleanup.status = 'incomplete';
        if (change === 'remaining')
          journal.cleanup.remaining = [at(journal.resources, 0).resource];
        if (change === 'issues')
          journal.cleanup.issues = [
            { code: 'DELETE_FAILED', resource: 'auth-user' },
          ];
      }
      expect(
        codes(input).some((code) =>
          ['JOURNAL_INVALID', 'CLEANUP_INCOMPLETE'].includes(code),
        ),
      ).toBe(true);
    }
  });

  it('attachmentの欠落・重複・不正body・owner/cleanup差異を拒否する', () => {
    const input = fixture();
    attempt(input).attachments = [];
    expect(codes(input)).toEqual(
      expect.arrayContaining([
        'CLEANUP_ATTACHMENT_MISMATCH',
        'ACTOR_ATTACHMENT_INVALID',
      ]),
    );
    const malformed = fixture();
    at(attempt(malformed).attachments, 0).body = 'not-json';
    expect(codes(malformed)).toContain('ACTOR_ATTACHMENT_INVALID');
    const mismatch = fixture();
    at(attempt(mismatch).attachments, 1).body = attachment('x', {
      owner: at(mismatch.journals, 1).owner,
      result: at(mismatch.journals, 0).cleanup,
    }).body;
    expect(codes(mismatch)).toContain('CLEANUP_ATTACHMENT_MISMATCH');
    attempt(mismatch).attachments.push(
      structuredClone(at(attempt(mismatch).attachments, 0)),
    );
    expect(codes(mismatch)).toContain('ACTOR_ATTACHMENT_INVALID');
  });

  it('別case actor・役割重複・実際に使用したactorの取り違えを拒否する', () => {
    const input = fixture();
    at(attempt(input).attachments, 0).body = at(
      attempt(input, 1).attachments,
      0,
    ).body;
    expect(codes(input)).toContain('ACTOR_ATTACHMENT_INVALID');
    const swapped = fixture();
    at(attempt(swapped).attachments, 2).body = at(
      attempt(swapped).attachments,
      3,
    ).body;
    expect(codes(swapped)).toContain('USED_ACTOR_MISMATCH');
    const duplicate = fixture();
    const rawBody: unknown = JSON.parse(
      Buffer.from(
        at(attempt(duplicate).attachments, 0).body,
        'base64',
      ).toString('utf8'),
    );
    const body = z
      .object({
        owner: fixtureOwnerSchema,
        actors: z.array(fixtureActorSchema),
      })
      .parse(rawBody);
    body.actors[1] = at(body.actors, 0);
    at(attempt(duplicate).attachments, 0).body = attachment('x', body).body;
    expect(codes(duplicate)).toContain('ACTOR_ROLES_MISMATCH');
    const first = at(body.actors, 0);
    if (first.kind === 'anonymous') throw new Error('fixture不足');
    body.actors[1] = { ...first, kind: 'keeper-only' };
    at(attempt(duplicate).attachments, 0).body = attachment('x', body).body;
    expect(codes(duplicate)).toContain('ACTOR_IDENTITY_DUPLICATE');
  });
});
