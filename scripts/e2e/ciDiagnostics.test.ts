import { expect, it } from 'vitest';

import { advanceCiProgress, createCiFailure } from './ciDiagnostics';

const verificationId = 'abcdef123456';
const replay = { step: 'panda', processFailure: 'descendants-remained' };

it('失敗段階を更新しても判明済みの検証IDと後始末を保持する', () => {
  const execution = advanceCiProgress(
    { phase: 'execution' },
    { phase: 'receipt', verificationId, issueCount: 0, cleanup: 'complete' },
  );
  expect(advanceCiProgress(execution, { phase: 'artifacts' })).toEqual({
    phase: 'artifacts',
    verificationId,
    issueCount: 0,
    cleanup: 'complete',
  });
});

it('自由記述・不正なID・未知段階を公開診断に受け入れない', () => {
  const previous = { phase: 'execution' } as const;
  for (const update of [
    { phase: 'private-token' },
    { phase: 'receipt', verificationId: '../../private' },
    { phase: 'receipt', message: 'secret-token' },
    { phase: 'quality', qualityCheck: 'custom-command --secret' },
    { phase: 'receipt', cleanup: 'credential-value' },
  ]) {
    expect(advanceCiProgress(previous, update)).toBe(previous);
  }
});

it('有効なrunとattempt、固定コードと品質段階だけを公開する', () => {
  const env = {
    ...process.env,
    GITHUB_RUN_ID: '123456',
    GITHUB_RUN_ATTEMPT: '2',
    E2E_LEDGER_BOOTSTRAP_APPROVAL: 'fixture-secret',
  };
  const report = createCiFailure({
    job: 'plan',
    progress: { phase: 'quality', qualityCheck: 'typecheck' },
    env,
    interrupted: false,
  });
  expect(report).toMatchObject({
    schemaVersion: 1,
    status: 'failed',
    job: 'plan',
    phase: 'quality',
    qualityCheck: 'typecheck',
    code: 'CI_QUALITY_CHECK_FAILED',
    workflow: { runId: '123456', attempt: 2 },
  });
  expect(JSON.stringify(report)).not.toContain('fixture-secret');
  expect(
    createCiFailure({
      job: 'required',
      progress: { phase: 'receipt', verificationId },
      env: { ...env, GITHUB_RUN_ATTEMPT: '1e2' },
      interrupted: true,
    }),
  ).toMatchObject({
    status: 'failed',
    job: 'required',
    phase: 'receipt',
    code: 'CI_INTERRUPTED',
    verificationId,
  });
  expect(
    createCiFailure({
      job: 'plan',
      progress: { phase: 'context' },
      env: { ...env, GITHUB_RUN_ID: 'fixture-secret' },
      interrupted: false,
    }),
  ).not.toHaveProperty('workflow');
});

it('固定の歴史再生診断をplanの静的検査失敗だけに追加する', () => {
  const input = {
    job: 'plan',
    progress: { phase: 'static-ledger' },
    env: process.env,
    interrupted: false,
    surfaceReplay: replay,
  } as const;
  expect(createCiFailure(input)).toMatchObject({
    code: 'CI_STATIC_LEDGER_FAILED',
    surfaceReplay: replay,
  });
  expect(
    createCiFailure({
      ...input,
      interrupted: true,
      surfaceReplay: { step: 'panda', processFailure: 'aborted' },
    }),
  ).toMatchObject({
    code: 'CI_INTERRUPTED',
    surfaceReplay: { step: 'panda', processFailure: 'aborted' },
  });
  for (const override of [
    { job: 'required' },
    { progress: { phase: 'collection' } },
    { surfaceReplay: { ...replay, step: 'private-step' } },
    { surfaceReplay: { ...replay, processFailure: 'private-cause' } },
    { surfaceReplay: { ...replay, path: 'private-path' } },
  ] as const)
    expect(createCiFailure({ ...input, ...override })).not.toHaveProperty(
      'surfaceReplay',
    );
});
