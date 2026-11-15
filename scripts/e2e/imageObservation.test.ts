import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { runLocalCommand } from './environmentCommands';
import { collectImageObservation } from './imageObservation';
import { writeProgressStderr } from './progressStderr';

vi.mock('./environmentCommands', () => ({ runLocalCommand: vi.fn() }));
vi.mock('./progressStderr', () => ({ writeProgressStderr: vi.fn() }));
const hash = `sha256:${'a'.repeat(64)}`;
const options = {
  projectId: 'test-project',
  cwd: 'private-path',
  env: {
    NODE_ENV: 'test' as const,
    NEXT_PUBLIC_SUPABASE_URL: 'http://127.0.0.1',
    NEXT_PUBLIC_SUPABASE_ANON_KEY: 'test',
  },
  signal: new AbortController().signal,
  containers: [
    {
      id: 'b'.repeat(64),
      name: 'supabase_db_test-project',
      projectLabel: 'test-project',
      createdAt: '2026-01-01T00:00:00Z',
      imageId: hash,
    },
  ],
};
const output = () =>
  vi
    .mocked(writeProgressStderr)
    .mock.calls.map(([line]) => line)
    .join('');
const info = {
  id: 'b'.repeat(64),
  name: '/supabase_db_test-project',
  project: 'test-project',
  reference: 'public.ecr.aws/supabase/postgres:17.6.1',
  image: hash,
};
const mockInfo = (container: unknown = info) => {
  vi.mocked(runLocalCommand)
    .mockResolvedValueOnce(
      JSON.stringify({ driver: 'overlayfs', version: '28.0.0' }),
    )
    .mockResolvedValueOnce(JSON.stringify(container))
    .mockResolvedValueOnce(
      JSON.stringify({
        id: hash,
        digests: [`public.ecr.aws/supabase/postgres@${hash}`],
      }),
    );
};
beforeEach(() => {
  vi.stubEnv('E2E_CLI_TIMING', '1');
  vi.stubEnv('GITHUB_ACTIONS', 'false');
});
afterEach(() => {
  vi.resetAllMocks();
  vi.unstubAllEnvs();
});
describe('所有 image の安全な観測', () => {
  it('所有 image と存在しない役割を区別し、機密情報を出さない', async () => {
    mockInfo();
    await collectImageObservation(options);
    expect(output()).toContain('"status":"observed"');
    expect(output()).toContain('"tag":"17.6.1"');
    expect(output()).toContain('"role":"storage","status":"absent"');
    expect(output()).toContain(hash);
    expect(output()).toContain('"driver":"overlayfs"');
    expect(output()).toMatch(/"durationMs":\d+/);
    expect(output()).not.toMatch(/private-path|test-project/);
  });
  it('所有者不一致や任意の reference は生値を出さず失敗として記録する', async () => {
    mockInfo({ ...info, project: 'secret-value' });
    await collectImageObservation(options);
    expect(output()).toContain('"status":"collection-failed"');
    expect(output()).not.toContain('secret-value');
    expect(output()).toMatch(/"durationMs":\d+/);
  });
  it('許可されていない image reference を公開しない', async () => {
    mockInfo({ ...info, reference: 'private.example/secret:1' });
    await collectImageObservation(options);
    expect(output()).toContain('"status":"collection-failed"');
    expect(output()).not.toContain('secret');
  });
  it('診断の失敗を呼び出し元に伝播しない', async () => {
    vi.mocked(runLocalCommand).mockRejectedValue(new Error('secret-value'));
    await expect(collectImageObservation(options)).resolves.toBeUndefined();
    expect(output()).not.toContain('secret-value');
  });
});
