import { beforeEach, describe, expect, it, vi } from 'vitest';

import { assertCiUnchanged, captureCiInputs, readCiContext } from './ciContext';
import { captureInputs } from './fingerprint';
import { ciRuntimeFixture } from './fixtures/ciRuntime';
import { captureGitSnapshot } from './gitSnapshot';
import { resolveRevisions } from './trustedRevision';

vi.mock('./fingerprint', async (original) => ({
  ...(await original<typeof import('./fingerprint')>()),
  captureInputs: vi.fn(),
}));
vi.mock('./gitSnapshot', () => ({ captureGitSnapshot: vi.fn() }));
vi.mock('./trustedRevision', () => ({ resolveRevisions: vi.fn() }));

const root = 'fixture-ci-context';
const env = {
  ...process.env,
  CI: 'true',
  GITHUB_RUN_ID: '111',
  GITHUB_RUN_ATTEMPT: '1',
};
const { context, initial } = ciRuntimeFixture();
const { eventPolicy } = context;
if (eventPolicy.event !== 'pull_request')
  throw new Error('PR fixtureが必要です。');
const revisions = {
  base: eventPolicy.staticBase.sha,
  head: eventPolicy.head,
  mode: 'ci' as const,
  eventPolicy,
};

beforeEach(() => {
  vi.resetAllMocks();
  vi.mocked(resolveRevisions).mockResolvedValue(revisions);
  vi.mocked(captureInputs).mockResolvedValue(initial.inputs);
  vi.mocked(captureGitSnapshot).mockReturnValue({ snapshot: initial.snapshot });
});

describe('CI contextの再照合', () => {
  it('CI以外のrevisionと不正なrun/attemptを拒否する', async () => {
    vi.mocked(resolveRevisions).mockResolvedValueOnce({
      base: revisions.base,
      head: revisions.head,
      mode: 'local',
    });
    await expect(readCiContext(root, env)).rejects.toThrow('CIイベント');
    await expect(
      readCiContext(root, { ...env, GITHUB_RUN_ID: 'not-a-run' }),
    ).rejects.toThrow();
    await expect(
      readCiContext(root, { ...env, GITHUB_RUN_ATTEMPT: '0' }),
    ).rejects.toThrow();
    await expect(readCiContext(root, env)).resolves.toEqual(context);
  });

  it('PRの静的baseとmerge-baseを分けて採取し、commit済み差分を許可する', async () => {
    await expect(captureCiInputs(root, eventPolicy)).resolves.toEqual(initial);
    expect(vi.mocked(captureGitSnapshot)).toHaveBeenCalledExactlyOnceWith({
      root,
      base: eventPolicy.impactBase,
      expectedHead: eventPolicy.head,
      eventBase: revisions.base,
      mode: 'ci',
      runtimeInputPaths: [],
    });
  });

  it.each([
    'staged',
    'unstaged',
    'untracked',
  ] as const)('%sの変更はCI checkoutから拒否する', async (origin) => {
    vi.mocked(captureGitSnapshot).mockReturnValueOnce({
      snapshot: {
        ...initial.snapshot,
        changedPaths: [
          {
            origin,
            status: origin === 'untracked' ? 'A' : 'M',
            newPath: 'README.md',
          },
        ],
      },
    });
    await expect(captureCiInputs(root, eventPolicy)).rejects.toThrow(
      '未コミット',
    );
  });

  it('実行中にrun attemptまたはGit digestが変われば停止する', async () => {
    await expect(
      assertCiUnchanged(root, env, context, initial),
    ).resolves.toEqual(initial);
    await expect(
      assertCiUnchanged(
        root,
        { ...env, GITHUB_RUN_ATTEMPT: '2' },
        context,
        initial,
      ),
    ).rejects.toThrow('変化');
    vi.mocked(captureGitSnapshot).mockReturnValueOnce({
      snapshot: { ...initial.snapshot, digest: '0'.repeat(64) },
    });
    await expect(
      assertCiUnchanged(root, env, context, initial),
    ).rejects.toThrow('変化');
  });
});
