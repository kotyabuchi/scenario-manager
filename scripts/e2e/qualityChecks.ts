import { z } from 'zod';

import {
  localCommandEnvironment,
  runLocalCommand,
} from './environmentCommands';

import { readFile } from 'node:fs/promises';
import { createRequire } from 'node:module';
import { join } from 'node:path';

const CHECKS = [
  ['check:ci', '@biomejs/biome/bin/biome', ['check'], 'biome check'],
  ['typecheck', 'typescript/bin/tsc', ['--noEmit'], 'tsc --noEmit'],
  [
    'test:unit',
    'vitest/vitest.mjs',
    ['run', '--config', 'vitest.config.ts'],
    'vitest run --config vitest.config.ts',
  ],
  [
    'test:e2e-tools',
    'vitest/vitest.mjs',
    ['run', '--config', 'scripts/e2e/vitest.config.ts'],
    'vitest run --config scripts/e2e/vitest.config.ts',
  ],
] as const;
const packageScripts = z.object({ scripts: z.record(z.string(), z.string()) });

type QualityCheck = (typeof CHECKS)[number][0];
type QualityCheckStatus = 'running' | 'passed' | 'failed';

/** package scriptsと同じreadonly lint・型・純粋testをshellなしで順に実行する。 */
export const runQualityChecks = async (input: {
  root: string;
  directory: string;
  signal: AbortSignal;
  env?: NodeJS.ProcessEnv;
  checkpoint?: (name: QualityCheck) => Promise<void>;
  onStage?: (name: QualityCheck, status: QualityCheckStatus) => void;
}) => {
  const { root, directory, signal, checkpoint, onStage } = input;
  signal.throwIfAborted();
  const manifest = join(root, 'package.json');
  const { scripts } = packageScripts.parse(
    JSON.parse(await readFile(manifest, 'utf8')),
  );
  if (CHECKS.some(([name, , , expected]) => scripts[name] !== expected))
    throw new Error('quality用のpackage scriptsが固定コマンドと一致しません。');
  const require = createRequire(manifest);
  const env = localCommandEnvironment(input.env ?? process.env);
  for (const [name, entry, args] of CHECKS) {
    signal.throwIfAborted();
    onStage?.(name, 'running');
    try {
      try {
        await runLocalCommand('node', [require.resolve(entry), ...args], {
          cwd: root,
          env,
          signal,
          log: join(directory, `${name.replace(':', '-')}.log`),
        });
      } finally {
        signal.throwIfAborted();
        await checkpoint?.(name);
      }
      onStage?.(name, 'passed');
    } catch (error) {
      onStage?.(name, 'failed');
      throw error;
    }
  }
};

export type { QualityCheck, QualityCheckStatus };
