import { expect, vi } from 'vitest';

import { createCaseActors } from '../../../../e2e/fixtures/actors';
import { cleanupFixture } from '../../../../e2e/fixtures/fixtureCleanup';
import {
  createFixtureJournal,
  fixtureOwnerTag,
} from '../../../../e2e/fixtures/fixtureManifest';
import { withLegacyContext } from '../../../../e2e/fixtures/legacyContext';
import { legacyContextSchema } from '../../../../e2e/fixtures/legacySchema';
import { prepareLegacySeed } from '../../../../e2e/fixtures/legacySeed';
import { cleanupLegacySessions } from '../../../../e2e/fixtures/legacySessionCleanup';
import { runLocalCommand } from '../../environmentCommands';
import {
  readEnvironmentCredentials,
  writeEnvironmentCredentials,
} from '../../environmentCredentials';
import { probeEnvironment } from '../../environmentProbe';
import { withIsolatedApp } from '../../isolatedApp';
import { parseLegacyProjectResults } from '../../legacyResults';
import { createLegacySelection } from '../../legacySelection';
import { fixtureContext, mockFixtureApi } from '../fixtureApi';
import { appFixture } from '../isolatedApp';

import {
  existsSync,
  mkdirSync,
  readFileSync,
  realpathSync,
  rmSync,
  writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import type { LegacyExecutionResult } from '../../legacyExecutionSchema';

const roots: string[] = [];
const gate = () => {
  let release = () => {};
  const promise = new Promise<void>((resolve) => {
    release = resolve;
  });
  return { promise, release };
};
/** DB・本番appを起動せず、所有project実行の障害と終了順序を観測する。 */
export const setupLegacyProjectRun = async () => {
  const value = appFixture();
  roots.push(value.root);
  const { connection, workdir, root } = value;
  const { journal: memory } = fixtureContext(0, 'legacy-suite');
  const owner = {
    ...memory.owner,
    project: 'chromium-auth',
    lease: connection.lease,
  };
  const journal = { ...memory, owner, ownerTag: fixtureOwnerTag(owner) };
  mockFixtureApi();
  const actors = await createCaseActors(connection, journal);
  const actor = actors['creator-only'];
  const context = legacyContextSchema.parse({
    schemaVersion: 1,
    owner,
    ownerTag: journal.ownerTag,
    actor: actor.identity,
    startedAt: new Date().toISOString(),
    stateHash: 'a'.repeat(64),
  });
  const credentials = join(workdir, 'connection.private.json');
  const contextFile = join(workdir, 'legacy-context.private.json');
  writeFileSync(
    join(workdir, 'runtime.json'),
    JSON.stringify({ ...value.runtime, dockerHost: 'unix:///local.sock' }),
  );
  const packageRoot = join(root, 'node_modules', '@playwright', 'test');
  mkdirSync(packageRoot, { recursive: true });
  writeFileSync(
    join(packageRoot, 'package.json'),
    '{"exports":{"./cli":"./cli.js"}}',
  );
  writeFileSync(join(packageRoot, 'cli.js'), '// 実行しないmock用module');
  const input = {
    legacy: {},
    execution: {},
    currentLegacy: {},
    project: 'chromium-auth' as const,
  };
  const events: string[] = [];
  const results: LegacyExecutionResult[] = [
    {
      key: 'selected',
      fingerprint: 'a'.repeat(64),
      status: 'passed',
      expectedStatus: 'passed',
      annotations: [],
    },
  ];
  const control = {
    seedFailure: false,
    appFailure: false,
    browserFailure: false,
    report: 'valid' as 'valid' | 'missing' | 'malformed' | 'invalid',
    uiFailure: false,
    cleanup: 'complete' as 'complete' | 'incomplete' | 'throw',
    credentialsReadFailure: false,
    credentialsDeleteFailure: false,
  };
  const cleanupStarted = gate();
  const cleanupPending = gate();
  let shouldWaitForCleanup = false;
  vi.mocked(createLegacySelection).mockReturnValue({
    project: input.project,
    entries: [],
    keys: ['selected'],
    testList: '[chromium-auth] › selected.spec.ts › selected\n',
  });
  vi.mocked(createFixtureJournal).mockImplementation(async () => {
    events.push('journal');
    return journal;
  });
  vi.mocked(prepareLegacySeed, { partial: true }).mockImplementation(
    async () => {
      events.push('seed');
      if (control.seedFailure) throw new Error('private-seed-error');
      return { actor };
    },
  );
  vi.mocked(writeEnvironmentCredentials).mockImplementation(() => {
    events.push('credentials');
    writeFileSync(credentials, 'private-credentials', { flag: 'wx' });
    return credentials;
  });
  vi.mocked(readEnvironmentCredentials).mockImplementation(() => {
    if (control.credentialsReadFailure) throw new Error('private-read-error');
    return connection;
  });
  vi.mocked(withLegacyContext).mockImplementation(
    async (_connection, _journal, _actor, operation) => {
      events.push('context-open');
      try {
        return await operation(contextFile, context);
      } finally {
        events.push('context-close');
      }
    },
  );
  vi.mocked(withIsolatedApp).mockImplementation(
    async (_connection, signal, operation, progress) => {
      events.push('app-open');
      try {
        await progress?.({ phase: 'build', runId: connection.manifest.runId });
        if (control.appFailure) throw new Error('private-app-error');
        await progress?.({
          phase: 'readiness',
          runId: connection.manifest.runId,
        });
        await operation({
          baseURL: 'http://127.0.0.1:23100',
          env: {
            NODE_ENV: 'production',
            NEXT_PUBLIC_SUPABASE_URL: connection.manifest.apiUrl,
            NEXT_PUBLIC_SUPABASE_ANON_KEY: connection.anonKey,
          },
          signal,
        });
      } finally {
        events.push('app-close');
      }
    },
  );
  vi.mocked(runLocalCommand).mockImplementation(async (tool, args, options) => {
    if (tool === 'supabase') return '{}';
    events.push('browser');
    expect(options.env.SCENARIO_E2E_CREDENTIALS === credentials).toBe(true);
    expect(options.env.SCENARIO_E2E_LEGACY_CONTEXT === contextFile).toBe(true);
    expect(options.env.SCENARIO_E2E_LEGACY_PROJECT).toBe(input.project);
    expect(args).toContain('--test-list');
    const list = args.at(-1);
    if (!list) throw new Error('選択fileがありません。');
    expect(readFileSync(list, 'utf8')).toBe(
      '[chromium-auth] › selected.spec.ts › selected\n',
    );
    if (control.report !== 'missing')
      writeFileSync(
        join(
          root,
          'test-results',
          'legacy',
          connection.manifest.runId,
          'playwright.json',
        ),
        control.report === 'malformed' ? '{invalid' : '{"synthetic":true}',
      );
    if (control.browserFailure) throw new Error('private-browser-error');
    return '';
  });
  vi.mocked(parseLegacyProjectResults).mockImplementation(() => {
    events.push('results');
    if (control.report === 'invalid')
      throw new Error('private-invalid-results');
    return results;
  });
  vi.mocked(cleanupLegacySessions).mockImplementation(async () => {
    events.push('ui-cleanup');
    expect(events).toContain('app-close');
    expect(events).not.toContain('context-close');
    if (control.uiFailure) throw new Error('private-ui-cleanup');
  });
  vi.mocked(cleanupFixture).mockImplementation(async () => {
    events.push('fixture-cleanup');
    expect(existsSync(credentials)).toBe(true);
    if (shouldWaitForCleanup) {
      cleanupStarted.release();
      await cleanupPending.promise;
    }
    if (control.credentialsDeleteFailure) {
      rmSync(credentials);
      mkdirSync(credentials);
    }
    if (control.cleanup === 'throw') throw new Error('private-seed-cleanup');
    return { status: control.cleanup, remaining: [], issues: [] };
  });
  vi.mocked(probeEnvironment).mockImplementation(
    async (_root, _signal, progress, operation) => {
      events.push('environment-open');
      progress?.({
        phase: 'working',
        runId: connection.manifest.runId,
        workdir,
      });
      let passed = false;
      try {
        await operation?.(
          connection.manifest,
          _signal ?? new AbortController().signal,
        );
        passed = true;
      } catch {
        /* 実probeと同じくoperationの失敗後に診断とcleanupを完了する。 */
      } finally {
        events.push('environment-close');
        if (!control.credentialsDeleteFailure)
          expect(existsSync(credentials)).toBe(false);
        progress?.({
          phase: 'cleanup',
          runId: connection.manifest.runId,
          workdir,
        });
      }
      return {
        runId: connection.manifest.runId,
        workdir,
        cliVersion: connection.manifest.cliVersion,
        inputHashes: connection.manifest.inputHashes,
        migrationReplayPassed: true,
        schemaParityPassed: true,
        catalogStatus: 'verified',
        authorizationStatus: 'not-verified',
        fingerprint: 'a'.repeat(64),
        catalogIssues: [],
        knownAuthorizationGaps: [],
        passed,
        cleanup: null,
      };
    },
  );
  return {
    ...value,
    journal,
    actor,
    input,
    events,
    control,
    results,
    credentials,
    cleanupStarted,
    cleanupPending,
    waitForCleanup: () => {
      shouldWaitForCleanup = true;
    },
  };
};

/** このfixtureが作成した一時領域だけを破棄する。 */
export const cleanupLegacyProjectRuns = () => {
  vi.unstubAllGlobals();
  for (const root of roots.splice(0)) {
    if (!root.startsWith(join(realpathSync(tmpdir()), 'e2e-isolated-app-')))
      throw new Error('テスト所有外は削除しません。');
    rmSync(root, { recursive: true, force: true });
  }
};
