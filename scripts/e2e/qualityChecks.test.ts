import { beforeEach, describe, expect, it, vi } from 'vitest';

import { runLocalCommand } from './environmentCommands';
import { writeProgressStderr } from './progressStderr';
import { runQualityChecks } from './qualityChecks';
import {
  captureQualityToolsDirectory,
  qualityToolsFailureSummary,
} from './qualityToolsFailure';

vi.mock('./environmentCommands', () => ({
  localCommandEnvironment: () => ({}),
  runLocalCommand: vi.fn(),
}));
vi.mock('./progressStderr', () => ({ writeProgressStderr: vi.fn() }));
vi.mock('./qualityToolsFailure', () => ({
  captureQualityToolsDirectory: vi.fn(),
  qualityToolsFailureSummary: vi.fn(),
}));

const signal = new AbortController().signal;
const candidate = 'scripts/e2e/example.test.ts';
const input = () => ({
  root: process.cwd(),
  directory: process.cwd(),
  signal,
  toolsCandidatePaths: [candidate],
});

beforeEach(() => {
  vi.resetAllMocks();
  vi.mocked(runLocalCommand).mockResolvedValue('');
  vi.mocked(captureQualityToolsDirectory).mockResolvedValue({ dev: 1, ino: 2 });
  vi.mocked(qualityToolsFailureSummary).mockResolvedValue({
    kind: 'e2e-tools-failure-candidates',
    evidence: 'log-derived-candidate',
    candidatePaths: [candidate],
    coverage: 'complete',
    exitCode: 1,
    signal: 'unknown',
    code: 'unknown',
  });
});

describe('quality tools失敗時の候補診断', () => {
  it('成功時はreadとstderrを実行しない', async () => {
    await runQualityChecks(input());
    expect(qualityToolsFailureSummary).not.toHaveBeenCalled();
    expect(writeProgressStderr).not.toHaveBeenCalled();
  });
  it('子失敗で候補を出し、同じerrorとcheckpointを維持する', async () => {
    const original = new Error('private original');
    vi.mocked(runLocalCommand).mockImplementation(
      async (_tool, _args, options) => {
        if (options.log?.endsWith('test-e2e-tools.log')) {
          options.onClose?.({ exitCode: 1, signal: null });
          throw original;
        }
        return '';
      },
    );
    const checkpoint = vi.fn();
    await expect(runQualityChecks({ ...input(), checkpoint })).rejects.toBe(
      original,
    );
    expect(checkpoint).toHaveBeenCalledTimes(4);
    expect(qualityToolsFailureSummary).toHaveBeenCalledWith(
      process.cwd(),
      [candidate],
      { exitCode: 1, signal: null },
      { dev: 1, ino: 2 },
    );
    expect(writeProgressStderr).toHaveBeenCalledOnce();
    expect(vi.mocked(writeProgressStderr).mock.calls[0]?.[0]).not.toContain(
      'private original',
    );
  });
  it('診断例外でも元errorを維持し、checkpoint例外の優先順位を維持する', async () => {
    const original = new Error('original');
    const checkpointError = new Error('checkpoint');
    vi.mocked(runLocalCommand)
      .mockResolvedValueOnce('')
      .mockResolvedValueOnce('')
      .mockResolvedValueOnce('')
      .mockRejectedValueOnce(original);
    vi.mocked(qualityToolsFailureSummary).mockRejectedValue(
      new Error('diagnostic'),
    );
    const checkpoint = vi
      .fn()
      .mockResolvedValueOnce(undefined)
      .mockResolvedValueOnce(undefined)
      .mockResolvedValueOnce(undefined)
      .mockRejectedValueOnce(checkpointError);
    await expect(runQualityChecks({ ...input(), checkpoint })).rejects.toBe(
      checkpointError,
    );
    expect(checkpoint).toHaveBeenCalledTimes(4);
  });
  it('診断例外とstderr例外は元の子errorを変えない', async () => {
    const original = new Error('original');
    vi.mocked(runLocalCommand)
      .mockResolvedValueOnce('')
      .mockResolvedValueOnce('')
      .mockResolvedValueOnce('')
      .mockRejectedValueOnce(original);
    vi.mocked(qualityToolsFailureSummary).mockRejectedValueOnce(
      new Error('diagnostic'),
    );
    const checkpoint = vi.fn();
    await expect(runQualityChecks({ ...input(), checkpoint })).rejects.toBe(
      original,
    );
    expect(checkpoint).toHaveBeenCalledTimes(4);
    vi.mocked(runLocalCommand)
      .mockResolvedValueOnce('')
      .mockResolvedValueOnce('')
      .mockResolvedValueOnce('')
      .mockRejectedValueOnce(original);
    vi.mocked(writeProgressStderr).mockImplementationOnce(() => {
      throw new Error('write');
    });
    await expect(runQualityChecks({ ...input(), checkpoint })).rejects.toBe(
      original,
    );
    expect(checkpoint).toHaveBeenCalledTimes(8);
  });
  it('checkpointだけの失敗には子ログ診断を出さない', async () => {
    const failure = new Error('checkpoint');
    const checkpoint = vi
      .fn()
      .mockResolvedValueOnce(undefined)
      .mockResolvedValueOnce(undefined)
      .mockResolvedValueOnce(undefined)
      .mockRejectedValueOnce(failure);
    await expect(runQualityChecks({ ...input(), checkpoint })).rejects.toBe(
      failure,
    );
    expect(qualityToolsFailureSummary).not.toHaveBeenCalled();
    expect(writeProgressStderr).not.toHaveBeenCalled();
  });
});
