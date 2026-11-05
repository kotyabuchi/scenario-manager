import { isNil } from 'ramda';

import {
  localCommandEnvironment,
  runLocalCommand,
} from './environmentCommands';
import { playwrightSourceMapOptions } from './playwrightSourceMaps';
import { preflightPlaywrightSelection } from './preflightPlaywrightSelection';
import {
  verificationEnvironment,
  verificationStagePath,
} from './verificationContext';
import { verificationReportSchema } from './verificationSchema';

import { readFile } from 'node:fs/promises';
import { createRequire } from 'node:module';
import { createServer } from 'node:net';
import { join } from 'node:path';
import { isDeepStrictEqual } from 'node:util';

import type { PlaywrightRunnerSelection } from './runnerSelection';
import type { VerificationStageHooks } from './verificationContext';

const STORYBOOK_PORT = 6007;
const STORYBOOK_CONFIG = '.storybook/playwright.config.ts';

const assertFreePort = async () => {
  const server = createServer();
  await new Promise<void>((resolve, reject) => {
    server.once('error', reject);
    server.listen(
      { host: '127.0.0.1', port: STORYBOOK_PORT, exclusive: true },
      () => {
        server.removeListener('error', reject);
        server.close((error) => (isNil(error) ? resolve() : reject(error)));
      },
    );
  });
};

/** 既存Playwright webServerの所有範囲でStorybookを検証し、実close後に解放を確認する。 */
export const runStorybookVerification = async (
  root: string,
  verification: VerificationStageHooks,
  selection?: PlaywrightRunnerSelection,
) => {
  let status: 'passed' | 'failed' = 'failed';
  let exitCode: number | null = null;
  let signal: string | null = null;
  let hasStarted = false;
  let hasClosed = false;
  let cleanupErrors = 0;
  try {
    verification.signal.throwIfAborted();
    const filterArgs = await preflightPlaywrightSelection({
      root,
      config: STORYBOOK_CONFIG,
      profile: 'storybook',
      selection,
      verification,
    });
    await verification.checkpoint('before-tests');
    await assertFreePort();
    const cli = createRequire(join(root, 'package.json')).resolve(
      '@playwright/test/cli',
    );
    const sourceMaps = await playwrightSourceMapOptions(cli);
    const env = {
      ...localCommandEnvironment(process.env),
      ...sourceMaps.env,
      ...verificationEnvironment(verification.context),
    };
    const log = verificationStagePath(
      root,
      verification.context,
      'runner-private.log',
    );
    hasStarted = true;
    await runLocalCommand(
      'node',
      [
        ...sourceMaps.args,
        cli,
        'test',
        '--config',
        STORYBOOK_CONFIG,
        ...filterArgs,
      ],
      {
        cwd: root,
        env,
        log,
        signal: verification.signal,
        onClose: (result) => {
          hasClosed = true;
          exitCode = result.exitCode;
          signal = result.signal;
          verification.onExit(result);
        },
      },
    );
    const report = verificationReportSchema.parse(
      JSON.parse(
        await readFile(
          verificationStagePath(root, verification.context, 'playwright.json'),
          'utf8',
        ),
      ),
    );
    if (
      hasClosed &&
      exitCode === 0 &&
      isNil(signal) &&
      report.runner === 'playwright' &&
      report.profile === 'storybook' &&
      report.status === 'passed' &&
      report.reporterCompleted &&
      report.errorCount === 0 &&
      report.reporterErrorCount === 0 &&
      isDeepStrictEqual(report.context, verification.context)
    )
      status = 'passed';
  } catch {
    status = 'failed';
  } finally {
    if (hasStarted) {
      try {
        await verification.checkpoint('after-tests');
      } catch {
        status = 'failed';
        cleanupErrors++;
      }
      if (!hasClosed) {
        cleanupErrors++;
      } else {
        try {
          await assertFreePort();
        } catch {
          cleanupErrors++;
        }
      }
    }
    try {
      await verification.checkpoint('after-cleanup');
    } catch {
      status = 'failed';
      cleanupErrors++;
    }
  }
  if (cleanupErrors > 0 || verification.signal.aborted) status = 'failed';
  return {
    status,
    exitCode,
    signal,
    processCleanup: {
      exited: !hasStarted || hasClosed,
      errorCount: cleanupErrors,
    },
  };
};
