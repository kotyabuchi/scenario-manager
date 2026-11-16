import { afterEach, describe, expect, it, vi } from 'vitest';

import {
  captureQualityToolsDirectory,
  parseQualityToolsCandidates,
  qualityToolsFailureSummary,
} from './qualityToolsFailure';

import { execFileSync } from 'node:child_process';
import {
  link,
  mkdtemp,
  realpath,
  rm,
  symlink,
  writeFile,
} from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const state = vi.hoisted(() => ({ failClose: false, replaceWithFifo: '' }));
vi.mock('node:fs/promises', async (importOriginal) => {
  const actual = await importOriginal<typeof import('node:fs/promises')>();
  return {
    ...actual,
    open: async (...args: Parameters<typeof actual.open>) => {
      if (state.replaceWithFifo && typeof args[0] === 'string') {
        await actual.rename(state.replaceWithFifo, args[0]);
        state.replaceWithFifo = '';
      }
      const file = await actual.open(...args);
      if (!state.failClose) return file;
      return new Proxy(file, {
        get(target, prop) {
          if (prop === 'close')
            return async () => {
              await target.close();
              throw new Error('private close');
            };
          const value: unknown = Reflect.get(target, prop, target);
          return typeof value === 'function' ? value.bind(target) : value;
        },
      });
    },
  };
});

const safe = 'scripts/e2e/example.test.ts';
const others: string[] = [];
afterEach(async () => {
  state.failClose = false;
  state.replaceWithFifo = '';
  for (const directory of others.splice(0))
    await rm(directory, { recursive: true, force: true });
});

describe('quality tools failure candidates', () => {
  it('許可済みtracked pathだけを候補として重複排除する', () => {
    const result = parseQualityToolsCandidates(
      ` FAIL  ${safe} > private title\n FAIL ${safe}\n FAIL scripts/e2e/other.test.ts\n`,
      [safe],
    );
    expect(result).toEqual({ candidatePaths: [safe], coverage: 'complete' });
    expect(JSON.stringify(result)).not.toContain('private title');
  });
  it('実ログのe2e-tools project付き・なしを認識し未知projectを拒否する', () => {
    const other = 'scripts/e2e/another.test.ts';
    const unknown = 'scripts/e2e/unknown.test.ts';
    const text = ` FAIL  |e2e-tools| ${safe} > private title\n FAIL ${other}\n FAIL  |other| ${unknown}\n`;
    const result = parseQualityToolsCandidates(text, [safe, other, unknown]);
    expect(result).toEqual({
      candidatePaths: [other, safe],
      coverage: 'complete',
    });
  });
  it('制御文字付きの行を候補にせず解析欠損とする', () => {
    const text = ` FAIL  |e2e-tools| \u001b[31m${safe}\n`;
    expect(parseQualityToolsCandidates(text, [safe])).toEqual({
      candidatePaths: [],
      coverage: 'truncated',
    });
  });
  it('絶対path、部分一致、制御文字、fixturesを拒否する', () => {
    const text = `FAIL /tmp/${safe}\nFAIL ${safe}.private\nFAIL \u001b[31m${safe}\nFAIL scripts/e2e/fixtures/x.test.ts\n`;
    expect(
      parseQualityToolsCandidates(text, [
        safe,
        'scripts/e2e/fixtures/x.test.ts',
      ]).candidatePaths,
    ).toEqual([]);
  });
  it.skipIf(process.platform !== 'linux')(
    '所有fileから安全なclose値と候補を抽出する',
    async () => {
      const dir = await realpath(
        await mkdtemp(join(tmpdir(), 'quality-tools-')),
      );
      others.push(dir);
      const owner = await captureQualityToolsDirectory(dir);
      await writeFile(
        join(dir, 'test-e2e-tools.log'),
        `FAIL ${safe}\nprivate error`,
      );
      const result = await qualityToolsFailureSummary(
        dir,
        [safe],
        { exitCode: 1, signal: null },
        owner,
      );
      expect(result).toMatchObject({
        candidatePaths: [safe],
        coverage: 'truncated',
        exitCode: 1,
        signal: 'unknown',
      });
      expect(JSON.stringify(result)).not.toContain('private error');
    },
  );
  it('所有file欠落・symlinkをunknownとして処理する', async () => {
    const dir = await realpath(await mkdtemp(join(tmpdir(), 'quality-tools-')));
    others.push(dir);
    expect(
      (
        await qualityToolsFailureSummary(
          dir,
          [safe],
          undefined,
          await captureQualityToolsDirectory(dir),
        )
      ).coverage,
    ).toBe('unknown');
    // Windowsでsymlink権限がない環境は既存native fixtureの対応方針に合わせる。
    if (process.platform !== 'win32') {
      await symlink(join(dir, 'elsewhere'), join(dir, 'test-e2e-tools.log'));
      expect(
        (
          await qualityToolsFailureSummary(
            dir,
            [safe],
            undefined,
            await captureQualityToolsDirectory(dir),
          )
        ).coverage,
      ).toBe('unknown');
    }
  });
  it.skipIf(process.platform !== 'linux')(
    'hard linkとclose失敗はunknown',
    async () => {
      const dir = await realpath(
        await mkdtemp(join(tmpdir(), 'quality-tools-')),
      );
      others.push(dir);
      const owner = await captureQualityToolsDirectory(dir);
      const external = join(dir, 'external');
      const log = join(dir, 'test-e2e-tools.log');
      await writeFile(external, `FAIL ${safe}\n`);
      await link(external, log);
      expect(
        (await qualityToolsFailureSummary(dir, [safe], undefined, owner))
          .coverage,
      ).toBe('unknown');
      await rm(log);
      await writeFile(log, `FAIL ${safe}\n`);
      state.failClose = true;
      const result = await qualityToolsFailureSummary(
        dir,
        [safe],
        undefined,
        owner,
      );
      expect(result).toMatchObject({ candidatePaths: [], coverage: 'unknown' });
    },
  );
  it('dot segmentを含むtracked pathは候補にしない', () => {
    const path = 'scripts/e2e/../private.test.ts';
    expect(
      parseQualityToolsCandidates(`FAIL ${path}\n`, [path]).candidatePaths,
    ).toEqual([]);
  });

  it.skipIf(process.platform !== 'linux')(
    'open直前のFIFO差替えもblockせずunknown',
    async () => {
      const dir = await realpath(
        await mkdtemp(join(tmpdir(), 'quality-tools-')),
      );
      others.push(dir);
      const owner = await captureQualityToolsDirectory(dir);
      const log = join(dir, 'test-e2e-tools.log');
      const fifo = join(dir, 'replacement');
      await writeFile(log, `FAIL ${safe}\n`);
      execFileSync('mkfifo', [fifo]);
      state.replaceWithFifo = fifo;
      const result = await qualityToolsFailureSummary(
        dir,
        [safe],
        undefined,
        owner,
      );
      expect(result).toMatchObject({ candidatePaths: [], coverage: 'unknown' });
    },
  );
});
