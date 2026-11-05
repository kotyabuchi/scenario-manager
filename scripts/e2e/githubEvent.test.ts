import { afterEach, describe, expect, it, vi } from 'vitest';

import { createGithubEventGit } from './fixtures/githubEventGit';
import events from './fixtures/githubEvents.json';
import { parseGithubEvent, resolveGithubEventPolicy } from './githubEvent';
import { githubEventPolicySchema } from './githubEventSchema';

import { join } from 'node:path';

const roots: ReturnType<typeof createGithubEventGit>[] = [];
const createRepo = () => {
  const repo = createGithubEventGit();
  roots.push(repo);
  return repo;
};
afterEach(() => {
  vi.unstubAllEnvs();
  for (const repo of roots.splice(0)) repo.cleanup();
});

const pullRequest = (base: string, head: string) =>
  parseGithubEvent({
    name: 'pull_request',
    ...events.pull_request,
    payload: {
      ...events.pull_request.payload,
      pull_request: {
        base: { ...events.pull_request.payload.pull_request.base, sha: base },
        head: { sha: head },
      },
    },
  });

const push = (before: string, after: string, created = false) =>
  parseGithubEvent({
    name: 'push',
    context: { ...events.push.context, sha: after },
    payload: { ...events.push.payload, before, after, created },
  });

describe('GitHubイベントのJSON契約', () => {
  it.each(Object.entries(events))('%sから固定headを選ぶ', (name, fixture) => {
    const parsed = parseGithubEvent({ name, ...fixture });
    expect(parsed.event).toBe(name);
    expect(parsed.head).toBe(
      name === 'pull_request' ? 'b'.repeat(40) : fixture.context.sha,
    );
    expect(parsed).toMatchObject({
      repository: fixture.context.repository,
      eventRef: fixture.context.ref,
    });
  });

  it.each([
    { name: 'pull_request_target', ...events.pull_request },
    {
      name: 'pull_request',
      ...events.pull_request,
      context: { ...events.pull_request.context, ref: 'refs/pull/41/merge' },
    },
    {
      name: 'pull_request',
      ...events.pull_request,
      context: {
        ...events.pull_request.context,
        repository: 'another/repository',
      },
    },
    {
      name: 'push',
      ...events.push,
      context: { ...events.push.context, sha: 'a'.repeat(40) },
    },
    {
      name: 'push',
      ...events.push,
      context: { ...events.push.context, ref: 'refs/heads/main' },
    },
    {
      name: 'push',
      ...events.push,
      payload: { ...events.push.payload, before: undefined },
    },
    {
      name: 'push',
      ...events.push,
      payload: { ...events.push.payload, deleted: true },
    },
    {
      name: 'push',
      ...events.push,
      payload: { ...events.push.payload, before: '0'.repeat(40) },
    },
    {
      name: 'schedule',
      ...events.schedule,
      context: { ...events.schedule.context, sha: undefined },
    },
    {
      name: 'schedule',
      ...events.schedule,
      context: { ...events.schedule.context, ref: 'refs/tags/main' },
    },
    {
      name: 'workflow_dispatch',
      ...events.workflow_dispatch,
      payload: { ref: 'unrelated' },
    },
  ])('不正なイベント情報を拒否する ($name)', (input) => {
    expect(() => parseGithubEvent(input)).toThrow();
  });
});

describe('GitHubイベントを実Gitへ固定する', { timeout: 30_000 }, () => {
  it('PRのイベントbaseと一意のmerge-baseを分離し、graft・replace・環境汚染を無効化する', () => {
    const { root, git, write, commit } = createRepo();
    const mergeBase = commit('ancestor');
    const eventBase = commit('base branch');
    git('checkout', '--detach', mergeBase);
    const head = commit('PR branch');
    const tree = git('rev-parse', 'HEAD^{tree}');
    const forged = git(
      'commit-tree',
      tree,
      '-p',
      eventBase,
      '-m',
      'fake ancestry',
    );
    git('replace', head, forged);
    write('.git/info/grafts', `${head} ${eventBase}\n`);
    vi.stubEnv('GIT_DIR', join(root, 'wrong-repository'));
    vi.stubEnv('GIT_INDEX_FILE', join(root, 'wrong-index'));
    vi.stubEnv('GIT_GRAFT_FILE', join(root, '.git/info/grafts'));
    const policy = resolveGithubEventPolicy({
      root,
      event: pullRequest(eventBase, head),
    });
    expect(policy).toMatchObject({
      event: 'pull_request',
      head,
      staticBase: { kind: 'comparison', sha: eventBase },
      impactBase: mergeBase,
      execution: 'changed-plus-smoke',
    });
    expect(githubEventPolicySchema.parse(policy)).toEqual(policy);
  });

  it('PRの複数merge-baseとshallow履歴を拒否する', () => {
    const { root, git, write, commit } = createRepo();
    const ancestor = commit('ancestor');
    const left = commit('left');
    git('checkout', '--detach', ancestor);
    const right = commit('right');
    const tree = git('rev-parse', 'HEAD^{tree}');
    const base = git(
      'commit-tree',
      tree,
      '-p',
      left,
      '-p',
      right,
      '-m',
      'left merge',
    );
    const head = git(
      'commit-tree',
      tree,
      '-p',
      right,
      '-p',
      left,
      '-m',
      'right merge',
    );
    git('checkout', '--detach', head);
    const event = pullRequest(base, head);
    expect(() => resolveGithubEventPolicy({ root, event })).toThrow('一意');
    write('.git/shallow', `${head}\n`);
    expect(() => resolveGithubEventPolicy({ root, event })).toThrow('shallow');
  });

  it('pushでは実在する非祖先beforeも固定し、zeroと実際のmissingだけを別分類する', () => {
    const { root, git, commit } = createRepo();
    const initial = commit('initial');
    const before = commit('before');
    git('checkout', '--detach', initial);
    const head = commit('after');
    const basePolicy = {
      event: 'push',
      head,
      impactBase: null,
      execution: 'full-required',
    };
    expect(
      resolveGithubEventPolicy({ root, event: push(before, head) }),
    ).toMatchObject({
      ...basePolicy,
      staticBase: { kind: 'comparison', sha: before },
    });
    const zero = '0'.repeat(40);
    const missing = 'f'.repeat(40);
    expect(
      resolveGithubEventPolicy({ root, event: push(zero, head, true) }),
    ).toMatchObject({
      ...basePolicy,
      staticBase: {
        kind: 'push-bootstrap',
        before: zero,
        reason: 'ZERO_BEFORE',
      },
    });
    expect(
      resolveGithubEventPolicy({ root, event: push(missing, head) }),
    ).toMatchObject({
      ...basePolicy,
      staticBase: {
        kind: 'push-bootstrap',
        before: missing,
        reason: 'BEFORE_OBJECT_MISSING',
      },
    });
    const blob = git('rev-parse', 'HEAD:file.txt');
    expect(() =>
      resolveGithubEventPolicy({ root, event: push(blob, head) }),
    ).toThrow('commit');
    expect(() =>
      resolveGithubEventPolicy({ root, event: push(before, initial) }),
    ).toThrow('HEAD');
  });

  it('壊れたpush before objectをmissingとして扱わない', () => {
    const { root, write, commit } = createRepo();
    const head = commit('after');
    const damaged = 'd'.repeat(40);
    write(
      `.git/objects/${damaged.slice(0, 2)}/${damaged.slice(2)}`,
      'broken object',
    );
    expect(() =>
      resolveGithubEventPolicy({ root, event: push(damaged, head) }),
    ).toThrow();
  });

  it.each([
    'schedule',
    'workflow_dispatch',
  ] as const)('%sはイベントSHAの現在整合だけを対象にする', (name) => {
    const { root, commit } = createRepo();
    const head = commit('scheduled');
    const fixture = events[name];
    const event = parseGithubEvent({
      name,
      ...fixture,
      context: { ...fixture.context, sha: head },
    });
    expect(resolveGithubEventPolicy({ root, event })).toMatchObject({
      event: name,
      head,
      impactBase: null,
      execution: 'full-required',
      staticBase: { kind: 'self', sha: head },
    });
    commit('ref moved');
    expect(() => resolveGithubEventPolicy({ root, event })).toThrow('HEAD');
  });
});
