import { afterEach, describe, expect, it } from 'vitest';

import { buildPendingItems } from './baseline';
import { assertCiStaticReport } from './ciStaticReport';
import { createGithubEventGit } from './fixtures/githubEventGit';
import events from './fixtures/githubEvents.json';
import { createLedgerFixture } from './fixtures/ledger';
import { inventoryFixture } from './fixtures/selection';
import { parseGithubEvent, resolveGithubEventPolicy } from './githubEvent';
import {
  ARTIFACTS,
  baselineDigest,
  checkStaticState,
  type StaticState,
} from './staticGate';

const roots: ReturnType<typeof createGithubEventGit>[] = [];
afterEach(() => {
  for (const repo of roots.splice(0)) repo.cleanup();
});

const createState = (): StaticState => ({
  inventory: inventoryFixture(),
  ledger: createLedgerFixture(),
  baseline: { schemaVersion: 1, items: [] },
  legacy: {
    schemaVersion: 1,
    tests: [],
    setups: [],
    groups: [],
    registered: [],
  },
  registrations: 0,
});

const createFixture = () => {
  const repo = createGithubEventGit();
  roots.push(repo);
  const state = createState();
  const json = (file: string, value: unknown) =>
    repo.write(file, `${JSON.stringify(value, null, 2)}\n`);
  const save = (state: StaticState, withBaseline = true) => {
    const { ledger } = state;
    for (const [name, value] of Object.entries({
      'profiles.json': ledger.profiles,
      'fixtures.json': ledger.fixtures,
      'execution-groups.json': ledger.executionGroups,
      'exceptions.json': ledger.exceptions,
      'contracts/schedule.json': ledger.contracts,
      'scenarios/schedule.json': ledger.scenarios,
    }))
      json(`e2e/ledger/${name}`, value);
    json(ARTIFACTS.inventory, state.inventory);
    json(ARTIFACTS.legacy, state.legacy);
    json(ARTIFACTS.migrations, { schemaVersion: 1, entries: [] });
    if (withBaseline) json(ARTIFACTS.baseline, state.baseline);
  };
  return { ...repo, state, save };
};

const resolvePush = (
  root: string,
  before: string,
  head: string,
  created = false,
) => {
  const eventPolicy = resolveGithubEventPolicy({
    root,
    event: parseGithubEvent({
      name: 'push',
      context: { ...events.push.context, sha: head },
      payload: { ...events.push.payload, before, after: head, created },
    }),
  });
  const { staticBase } = eventPolicy;
  return {
    base: staticBase.kind === 'push-bootstrap' ? head : staticBase.sha,
    head,
    eventPolicy,
  };
};

describe('CI静的検査へのイベント接続', { timeout: 30_000 }, () => {
  it('before不在のpushは既存初回承認を流用せず、完全一致の外部承認を要求する', async () => {
    const { root, commit, save, state } = createFixture();
    save(state);
    const head = commit('approved snapshot');
    const before = '0'.repeat(40);
    const revisions = resolvePush(root, before, head, true);
    const approval = {
      event: 'push',
      repository: 'example/project',
      ref: 'refs/heads/develop',
      before,
      head,
      baselineDigest: baselineDigest(state.baseline),
    };
    await expect(checkStaticState({ root, state, revisions })).rejects.toThrow(
      '外部承認',
    );
    for (const value of [
      { base: head, head, digest: approval.baselineDigest },
      { ...approval, ref: 'refs/heads/main' },
      { ...approval, repository: 'another/project' },
      { ...approval, baselineDigest: 'f'.repeat(64) },
    ]) {
      await expect(
        checkStaticState({
          root,
          state,
          revisions,
          bootstrapApproval: JSON.stringify(value),
        }),
      ).rejects.toThrow('外部承認');
    }
    await expect(
      checkStaticState({
        root,
        state,
        revisions,
        bootstrapApproval: JSON.stringify(approval),
      }),
    ).resolves.toEqual({
      issues: [],
      policyDeltas: [],
      isBootstrap: true,
      historicalComparison: 'unavailable',
    });
    await expect(
      checkStaticState({
        root,
        state,
        revisions: { ...revisions, base: before },
        bootstrapApproval: JSON.stringify(approval),
      }),
    ).rejects.toThrow('base/head');
  });

  it('実在するbeforeのbaselineが未導入でもPR承認はpushへ流用できない', async () => {
    const { root, commit, save, state } = createFixture();
    save(state, false);
    const before = commit('before baseline rollout');
    save(state);
    const head = commit('with baseline');
    const revisions = resolvePush(root, before, head);
    expect(revisions.eventPolicy.staticBase).toEqual({
      kind: 'comparison',
      sha: before,
    });
    const digest = baselineDigest(state.baseline);
    for (const approval of [
      undefined,
      { base: before, head, digest },
      {
        event: 'push',
        repository: 'example/project',
        ref: 'refs/heads/main',
        before,
        head,
        baselineDigest: digest,
      },
    ]) {
      await expect(
        checkStaticState({
          root,
          state,
          revisions,
          ...(approval ? { bootstrapApproval: JSON.stringify(approval) } : {}),
        }),
      ).rejects.toThrow('外部承認');
    }
    const result = await checkStaticState({
      root,
      state,
      revisions,
      bootstrapApproval: JSON.stringify({
        event: 'push',
        repository: 'example/project',
        ref: 'refs/heads/develop',
        before,
        head,
        baselineDigest: digest,
      }),
    });
    expect(result).toEqual({
      issues: [],
      policyDeltas: [],
      isBootstrap: true,
      historicalComparison: 'baseline-not-introduced',
    });
    const binding = {
      workflow: { runId: '123', attempt: 1 },
      snapshotDigest: 'a'.repeat(64),
      inputsDigest: 'b'.repeat(64),
    };
    const report = {
      ...binding,
      status: 'passed',
      mode: 'ci',
      ...revisions,
      ...result,
      baselineDigest: digest,
    };
    expect(
      assertCiStaticReport(root, report, revisions.eventPolicy, binding),
    ).toMatchObject({
      historicalComparison: 'baseline-not-introduced',
    });
    expect(() =>
      assertCiStaticReport(
        root,
        { ...report, historicalComparison: 'unavailable' },
        revisions.eventPolicy,
        binding,
      ),
    ).toThrow('由来');
  });

  it('baselineだけ欠落したPRは正確な旧承認でも拒否する', async () => {
    const { root, commit, save, state } = createFixture();
    save(state, false);
    const base = commit('legacy without baseline');
    save(state);
    const head = commit('with baseline');
    const eventPolicy = resolveGithubEventPolicy({
      root,
      event: parseGithubEvent({
        name: 'pull_request',
        ...events.pull_request,
        payload: {
          ...events.pull_request.payload,
          pull_request: {
            base: {
              ...events.pull_request.payload.pull_request.base,
              sha: base,
            },
            head: { sha: head },
          },
        },
      }),
    });
    await expect(
      checkStaticState({
        root,
        state,
        revisions: { base, head, eventPolicy },
        bootstrapApproval: JSON.stringify({
          base,
          head,
          digest: baselineDigest(state.baseline),
        }),
      }),
    ).rejects.toThrow('baselineとlegacy目録の両方');
  });

  it('実在するbeforeのpushではheadの不足増加を拒否する', async () => {
    const { root, commit, save, state } = createFixture();
    save(state);
    const before = commit('old baseline');
    state.inventory.diagnostics.push({
      code: 'UNRESOLVED_CALL',
      message: '呼出先が不明です',
      severity: 'warning',
      anchor: {
        ownerId: 'module:file.txt',
        syntaxHash: 'a'.repeat(64),
        occurrence: 0,
      },
    });
    state.baseline.items = buildPendingItems([], state.inventory.diagnostics);
    save(state);
    const head = commit('new debt');
    const revisions = resolvePush(root, before, head);
    const result = await checkStaticState({ root, state, revisions });
    expect(result.isBootstrap).toBe(false);
    expect(result.issues.map(({ code }) => code)).toContain('NEW_PENDING_ITEM');
  });

  it('scheduleは固定HEADの保存済みbaselineがない場合、旧初回承認で通さない', async () => {
    const { root, commit, save, state } = createFixture();
    save(state, false);
    const head = commit('missing baseline');
    save(state);
    const eventPolicy = resolveGithubEventPolicy({
      root,
      event: parseGithubEvent({
        name: 'schedule',
        ...events.schedule,
        context: { ...events.schedule.context, sha: head },
      }),
    });
    await expect(
      checkStaticState({
        root,
        state,
        revisions: { base: head, head, eventPolicy },
        bootstrapApproval: JSON.stringify({
          base: head,
          head,
          digest: baselineDigest(state.baseline),
        }),
      }),
    ).rejects.toThrow('固定HEADに保存済みbaseline');
  });
});
