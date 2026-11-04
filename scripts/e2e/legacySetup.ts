import { isNil } from 'ramda';

import {
  assertLegacyState,
  legacyAdmin,
  legacyContextFromEnvironment,
} from '../../e2e/fixtures/legacyContext';
import { ISOLATED_BASE_URL } from '../../e2e/isolatedRuntime';

import type { FullConfig } from '@playwright/test';

/** PlaywrightのglobalSetup入口。検査が通るまで旧testのbodyを実行しない。 */
export default async function legacySetup(config: FullConfig) {
  const local = legacyContextFromEnvironment();
  if (isNil(local)) throw new Error('専用legacy runnerから実行してください。');
  const { connection, context } = local;
  if (
    process.env.SCENARIO_E2E_RUN_ID !== connection.manifest.runId ||
    process.env.SCENARIO_E2E_LEGACY_PROJECT !== context.owner.project ||
    config.projects.length !== 1 ||
    config.projects[0]?.name !== context.owner.project ||
    config.projects[0]?.use.baseURL !== ISOLATED_BASE_URL ||
    config.workers !== 1 ||
    config.projects[0]?.retries !== 0
  )
    throw new Error('legacy実行条件と所有環境が一致しません。');
  assertLegacyState(connection.manifest.worktreeRoot, context);
  await legacyAdmin(connection, context);
}
