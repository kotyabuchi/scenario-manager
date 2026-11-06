import { test as base } from '@playwright/test';
import { isNil } from 'ramda';

import { readEnvironmentCredentials } from '../../scripts/e2e/environmentCredentials';
import { DESKTOP_DEVICE, MOBILE_DEVICE } from '../devices';
import { ISOLATED_BASE_URL } from '../isolatedRuntime';
import { createApplicationActors, createCaseActors } from './actors';
import { closeActorContexts } from './closeActorContexts';
import { cleanupFixture } from './fixtureCleanup';
import { createFixtureJournal } from './fixtureManifest';
import { createSessionApplicationFixture } from './sessionApplication';
import { createSessionFixture } from './sessions';

import type { BrowserContext } from '@playwright/test';
import type { FixtureConnection } from '../../scripts/e2e/environmentCredentials';
import type { CaseActors } from './actors';
import type { FixtureJournal } from './fixtureManifest';

type SharedFixtures = {
  fixtureConnection: FixtureConnection;
  fixtureJournal: FixtureJournal;
};
type ActorMap = Record<string, CaseActors[keyof CaseActors]>;
type ActorFixtures<Actors extends ActorMap> = {
  actors: Actors;
  asActor: (kind: keyof Actors) => Promise<BrowserContext>;
};

/** 新しいcaseごとに独立した認証・行を作り、成否と独立して後始末する。 */
const isolated = base.extend<SharedFixtures>({
  fixtureConnection: async ({ baseURL }, use) => {
    if (baseURL !== ISOLATED_BASE_URL)
      throw new Error('専用baseURLが一致しません。');
    const file = process.env.SCENARIO_E2E_CREDENTIALS;
    if (isNil(file)) throw new Error('専用runnerから実行してください。');
    await use(readEnvironmentCredentials(process.cwd(), file));
  },
  fixtureJournal: async ({ fixtureConnection }, use, testInfo) => {
    const journal = await createFixtureJournal(fixtureConnection, {
      project: testInfo.project.name,
      workerIndex: testInfo.workerIndex,
      caseId: testInfo.testId,
      retry: testInfo.retry,
    });
    const failures: unknown[] = [];
    try {
      await use(journal);
    } catch (error) {
      failures.push(error);
    }
    try {
      const result = await cleanupFixture(fixtureConnection, journal);
      await testInfo.attach('fixture-cleanup', {
        body: Buffer.from(JSON.stringify({ owner: journal.owner, result })),
        contentType: 'application/json',
      });
      if (result.status !== 'complete')
        failures.push(new Error('fixtureの後始末が完了していません。'));
    } catch (error) {
      failures.push(error);
    }
    if (failures.length > 0)
      throw new AggregateError(
        failures,
        'fixtureの実行または後始末に失敗しました。',
      );
  },
});

const withActors = <Actors extends ActorMap>(
  createActors: (
    connection: FixtureConnection,
    journal: FixtureJournal,
  ) => Promise<Actors>,
) =>
  isolated.extend<ActorFixtures<Actors>>({
    actors: async ({ fixtureConnection, fixtureJournal }, use, testInfo) => {
      const actors = await createActors(fixtureConnection, fixtureJournal);
      await testInfo.attach('fixture-actors', {
        body: Buffer.from(
          JSON.stringify({
            owner: fixtureJournal.owner,
            actors: Object.values(actors).map((actor) => actor.identity),
          }),
        ),
        contentType: 'application/json',
      });
      await use(actors);
    },
    asActor: async (
      { actors, browser, baseURL, timezoneId },
      use,
      testInfo,
    ) => {
      if (isNil(baseURL)) throw new Error('専用baseURLがありません。');
      const contexts: BrowserContext[] = [];
      try {
        await use(async (kind: keyof Actors) => {
          const actor: ActorMap[string] | undefined = actors[kind];
          if (!Object.hasOwn(actors, kind) || isNil(actor))
            throw new Error('case所有のactorがありません。');
          const device =
            testInfo.project.name === 'mobile-chrome'
              ? MOBILE_DEVICE
              : DESKTOP_DEVICE;
          const context = await browser.newContext({
            ...device,
            ...(isNil(timezoneId) ? {} : { timezoneId }),
            baseURL,
            storageState: actor.storageState(baseURL),
          });
          contexts.push(context);
          await testInfo.attach('fixture-used-actor', {
            body: Buffer.from(JSON.stringify(actor.identity)),
            contentType: 'application/json',
          });
          return context;
        });
      } finally {
        await closeActorContexts(contexts);
      }
    },
  });

/** 日程ケースに既存のactorとセッションを提供する。 */
export const test = withActors(createCaseActors).extend<{
  sessionFixture: Awaited<ReturnType<typeof createSessionFixture>>;
}>({
  sessionFixture: async (
    { fixtureConnection, fixtureJournal, actors },
    use,
  ) => {
    await use(
      await createSessionFixture(fixtureConnection, fixtureJournal, actors),
    );
  },
});

/** 申請行がない募集セッションを、申請者と主催者の独立contextで検証する。 */
export const applicationTest = withActors(createApplicationActors).extend<{
  applicationFixture: Awaited<
    ReturnType<typeof createSessionApplicationFixture>
  >;
}>({
  applicationFixture: async (
    { fixtureConnection, fixtureJournal, actors },
    use,
  ) => {
    await use(
      await createSessionApplicationFixture(
        fixtureConnection,
        fixtureJournal,
        actors,
      ),
    );
  },
});

export { expect } from '@playwright/test';
