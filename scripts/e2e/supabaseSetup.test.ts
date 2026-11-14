import { describe, expect, it } from 'vitest';

import { spawnSync } from 'node:child_process';
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';

const action = readFileSync(
  path.resolve('.github/actions/setup-supabase/action.yml'),
  'utf8',
);
const steps = [
  ...action.matchAll(/ {4}- name: ([^\n]+)\n([\s\S]*?)(?= {4}- name: |$)/g),
].map((match) => {
  const body = match[2] ?? '';
  const run = body.split('      run: |\n')[1] ?? '';
  return {
    name: match[1] ?? '',
    run: run.replace(/^ {8}/gm, '').trim(),
  };
});
const script = (name: string) => {
  const step = steps.find((entry) => entry.name.startsWith(name));
  if (!step?.run) throw new Error('固定 action の step が見つからない');
  return step.run;
};

describe('固定 Supabase installer の policy', () => {
  it('固定Linux x64の公式archiveとchecksumを入力なしで選ぶ', () => {
    expect(action).not.toMatch(/^inputs:|^permissions:|^outputs:/m);
    expect(script('Prepare')).toContain('test "$RUNNER_OS" = Linux');
    expect(script('Prepare')).toContain('test "$RUNNER_ARCH" = X64');
    expect(script('Download')).toContain(
      'https://github.com/supabase/cli/releases/download/v2.75.0/supabase_linux_amd64.tar.gz',
    );
    expect(script('Verify fixed release checksum')).toContain(
      'e5597462f865d5ac72af0453358e37ecb0d85962ad6914a114a53de847303bde',
    );
    expect(script('Download')).toContain('--connect-timeout 10 --max-time 120');
    expect(script('Download')).not.toMatch(/--retry|--insecure/);
    expect(action).not.toMatch(
      /--version|actions\/cache|SUPABASE_ACCESS_TOKEN/,
    );
  });

  it('digestと実体と終了済みprobeの成功後だけPATHを公開する', () => {
    expect(steps.map((step) => step.name)).toEqual([
      'Prepare owned installation directory',
      'Download fixed release archive',
      'Verify fixed release checksum',
      'Extract verified native executable',
      'Verify fixed CLI without update communication',
      'Activate verified native CLI',
      'Clean owned installation scratch',
    ]);
    expect(script('Extract')).toContain('test ! -L "$binary"');
    expect(script('Extract')).toContain('7f454c46');
    expect(script('Verify fixed CLI')).toContain(
      'pnpm exec tsx scripts/e2e/checkSupabaseCli.ts "$SETUP_ROOT/bin"',
    );
    expect(
      steps.filter((step) => step.run.includes('$GITHUB_PATH')),
    ).toHaveLength(1);
    expect(script('Clean')).toContain(
      'test "$(dirname "$SETUP_ROOT")" = "$RUNNER_TEMP"',
    );
    expect(action).toContain("always() && steps.prepare.outputs.root != ''");
  });
});

// Windows では Bash の模倣をせず、Linux CI で実際の action の失敗境界を検査する。
describe.skipIf(process.platform !== 'linux')(
  '固定 installer の Bash 境界',
  () => {
    const runFixture = (failure: string, registry = '') => {
      const fixture = mkdtempSync(
        path.join(tmpdir(), 'supabase-installer-test-'),
      );
      const env = {
        ...process.env,
        RUNNER_TEMP: fixture,
        RUNNER_OS: 'Linux',
        RUNNER_ARCH: 'X64',
        GITHUB_OUTPUT: path.join(fixture, 'output'),
        GITHUB_PATH: path.join(fixture, 'path'),
        GITHUB_ENV: path.join(fixture, 'env'),
        FIXTURE_FAILURE: failure,
        SUPABASE_INTERNAL_IMAGE_REGISTRY: registry,
      };
      for (const file of [env.GITHUB_OUTPUT, env.GITHUB_PATH, env.GITHUB_ENV]) {
        writeFileSync(file, '');
      }
      // ネットワーク・CLIを実行せず、外部処理の結果だけを制御する。
      const mocks = `
curl() { test "$FIXTURE_FAILURE" != download; }
sha256sum() { cat >/dev/null; test "$FIXTURE_FAILURE" != checksum; }
tar() {
  if test "$1" = --list; then
    if test "$FIXTURE_FAILURE" = member; then
      printf 'lrwxrwxrwx runner/runner 0 2026-01-01 supabase -> other\\n'
    else
      printf '%s\\n' '-rwxr-xr-x runner/runner 4 2026-01-01 supabase'
    fi
  else
    printf '\\177ELF' > "$SETUP_ROOT/bin/supabase"
  fi
}
pnpm() { test "$FIXTURE_FAILURE" != probe; }
`;
      try {
        const prepare = spawnSync('bash', ['-c', script('Prepare')], { env });
        expect(prepare.status).toBe(0);
        const root = readFileSync(env.GITHUB_OUTPUT, 'utf8')
          .trim()
          .slice('root='.length);
        let succeeded = true;
        for (const step of steps.slice(1, -1)) {
          const result = spawnSync('bash', ['-c', `${mocks}\n${step.run}`], {
            env: { ...env, SETUP_ROOT: root },
          });
          if (result.status !== 0) {
            succeeded = false;
            break;
          }
        }
        const published = readFileSync(env.GITHUB_PATH, 'utf8');
        const exported = readFileSync(env.GITHUB_ENV, 'utf8');
        const cleanup = spawnSync('bash', ['-c', script('Clean')], {
          env: { ...env, SETUP_ROOT: root, SETUP_ACTIVATED: String(succeeded) },
        });
        expect(cleanup.status).toBe(0);
        const remaining = spawnSync(
          'bash',
          ['-c', 'test -d "$SETUP_ROOT/bin"'],
          {
            env: { ...env, SETUP_ROOT: root },
          },
        );
        return {
          succeeded,
          published,
          exported,
          retained: remaining.status === 0,
        };
      } finally {
        rmSync(fixture, { recursive: true, force: true });
      }
    };

    it.each([
      'download',
      'checksum',
      'member',
      'probe',
    ])('%s失敗ではPATHを公開せず所有tempを後始末する', (failure) => {
      expect(runFixture(failure)).toEqual({
        succeeded: false,
        published: '',
        exported: '',
        retained: false,
      });
    });

    it('成功時はbinを残してregistry既定値を設定する', () => {
      const result = runFixture('');
      expect(result.succeeded).toBe(true);
      expect(result.retained).toBe(true);
      expect(result.published).toMatch(/\/bin\n$/);
      expect(result.exported).toBe(
        'SUPABASE_INTERNAL_IMAGE_REGISTRY=ghcr.io\n',
      );
    });

    it('既存の非空registryを維持する', () => {
      expect(runFixture('', 'registry.example').exported).toBe('');
    });
  },
);
