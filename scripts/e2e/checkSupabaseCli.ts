import { isNil } from 'ramda';

import { measureCliStep } from './cliTiming';
import { localCommandEnvironment } from './environmentCommands';
import { writeProgressStderr } from './progressStderr';
import { SUPABASE_CLI_VERSION, verifySupabaseCli } from './supabaseCli';

import { isAbsolute } from 'node:path';
import { pathToFileURL } from 'node:url';

/** CIの展開先、または既存PATHにある固定版native CLIを同じ規則で検査する。 */
export const runSupabaseCliCheck = async (args: string[]): Promise<boolean> => {
  const controller = new AbortController();
  const interrupt = () => controller.abort();
  process.once('SIGINT', interrupt);
  process.once('SIGTERM', interrupt);
  try {
    const binDirectory = args[0];
    if (
      args.length > 1 ||
      (!isNil(binDirectory) && !isAbsolute(binDirectory))
    ) {
      throw new Error('CLI directory must be absolute');
    }
    const env = localCommandEnvironment(process.env);
    if (!isNil(binDirectory)) {
      for (const key of Object.keys(env)) {
        if (key.toUpperCase() === 'PATH') Reflect.deleteProperty(env, key);
      }
      env.PATH = binDirectory;
    }
    await measureCliStep('supabase-version', () =>
      verifySupabaseCli(env, controller.signal),
    );
    process.stdout.write(
      `${JSON.stringify({ status: 'passed', cliVersion: SUPABASE_CLI_VERSION })}\n`,
    );
    return true;
  } catch {
    writeProgressStderr('固定版Supabase CLIの検査に失敗しました。\n');
    return false;
  } finally {
    process.removeListener('SIGINT', interrupt);
    process.removeListener('SIGTERM', interrupt);
  }
};

if (
  !isNil(process.argv[1]) &&
  import.meta.url === pathToFileURL(process.argv[1]).href
) {
  runSupabaseCliCheck(process.argv.slice(2)).then((passed) => {
    if (!passed) process.exitCode = 1;
  });
}
