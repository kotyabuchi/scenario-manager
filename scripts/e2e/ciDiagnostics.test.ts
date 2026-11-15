import { expect, it } from 'vitest';

import { advanceCiProgress, createCiFailure } from './ciDiagnostics';
import { ciVerificationSummarySchema } from './ciVerificationSummary';

const verificationId = 'abcdef123456';
const replay = { step: 'panda', processFailure: 'descendants-remained' };
const verificationSummary = ciVerificationSummarySchema.parse({
  verificationState: 'available',
  schemaVersion: 1,
  issueCount: 1,
  issueCounts: [{ code: 'REQUIRED_NOT_CLEAN_PASS', count: 1 }],
  unknownIssueCount: 0,
  stages: [],
  caseIssues: [{ code: 'REQUIRED_NOT_CLEAN_PASS', keySha256: 'a'.repeat(64) }],
  omittedCaseIssueCount: 0,
});

it('workerのreceipt以降だけに固定の検証要約を引き継ぐ', () => {
  const receipt = advanceCiProgress(
    { phase: 'execution' },
    { phase: 'receipt', verificationId, issueCount: 1, verificationSummary },
  );
  const artifacts = advanceCiProgress(receipt, { phase: 'artifacts' });
  for (const job of ['required', 'legacy-desktop', 'legacy-mobile'] as const) {
    for (const progress of [receipt, artifacts]) {
      expect(
        createCiFailure({
          job,
          progress,
          env: process.env,
          interrupted: false,
        }),
      ).toMatchObject({ verificationId, issueCount: 1, verificationSummary });
    }
  }
  for (const job of ['plan', 'aggregate', null] as const) {
    expect(
      createCiFailure({
        job,
        progress: artifacts,
        env: process.env,
        interrupted: false,
      }),
    ).not.toHaveProperty('verificationSummary');
  }
  expect(
    createCiFailure({
      job: 'legacy-desktop',
      progress: { ...receipt, phase: 'execution' },
      env: process.env,
      interrupted: false,
    }),
  ).not.toHaveProperty('verificationSummary');
});

it('検証要約の未許可フィールド・語彙・件数・識別子を公開しない', () => {
  const previous = { phase: 'execution' } as const;
  for (const invalid of [
    { ...verificationSummary, message: 'private-message' },
    {
      ...verificationSummary,
      issueCounts: [{ code: 'private-code', count: 1 }],
    },
    { ...verificationSummary, stages: [{ id: 'private-stage' }] },
    { ...verificationSummary, issueCount: -1 },
    {
      ...verificationSummary,
      caseIssues: [
        { code: 'REQUIRED_NOT_CLEAN_PASS', keySha256: 'private-key' },
      ],
    },
  ]) {
    expect(
      advanceCiProgress(previous, {
        phase: 'receipt',
        verificationSummary: invalid,
      }),
    ).toBe(previous);
  }
});

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
