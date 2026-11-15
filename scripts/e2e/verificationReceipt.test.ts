import { afterEach, describe, expect, it } from 'vitest';

import { inputFingerprintSchema } from './fingerprint';
import { verificationFixture } from './fixtures/verification';
import { writeArtifact } from './ledgerArtifacts';
import {
  loadVerificationArtifacts,
  validateVerificationArtifacts,
} from './verificationReceipt';
import { verificationReceiptSchema } from './verificationReceiptSchema';
import { verificationReportSchema } from './verificationSchema';
import { verifyResults } from './verifyResults';

import { createHash } from 'node:crypto';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const roots: string[] = [];
afterEach(async () => {
  await Promise.all(
    roots.splice(0).map((root) => rm(root, { recursive: true, force: true })),
  );
});
const fixture = () => {
  const value = verificationFixture();
  const inputs = inputFingerprintSchema.parse({
    schemaVersion: 1,
    algorithm: 'sha256',
    root: '/fixture',
    rules: 'fixed-input-scope-v1-next16-template-v1',
    files: [],
    digest: createHash('sha256').update('[]').digest('hex'),
  });
  value.stage.context.inputDigest = inputs.digest;
  value.stage.evidence.context.inputDigest = inputs.digest;
  value.report.context.inputDigest = inputs.digest;
  value.stage.report = value.report;
  const verification = verifyResults({
    ...value.input,
    inputDigestBefore: inputs.digest,
    inputDigestAfter: inputs.digest,
    stages: [value.stage],
  });
  const receipt = verificationReceiptSchema.parse({
    schemaVersion: 1,
    verificationId: value.stage.context.verificationId,
    mode: 'full-required',
    selection: null,
    status: 'passed',
    phase: 'complete',
    selectionDigest: value.stage.context.selectionDigest,
    inputDigestBefore: inputs.digest,
    inputDigestAfter: inputs.digest,
    checkpoints: [
      'before-stages',
      ...[
        'before-environment',
        'before-tests',
        'after-tests',
        'after-cleanup',
      ].map((phase) => `${value.stage.context.stageId}:${phase}`),
    ].map((phase) => ({
      phase,
      digest: inputs.digest,
      changes: { added: [], removed: [], changed: [] },
    })),
    execution: {
      stages: [value.stage],
      runs: [
        {
          stageId: value.stage.context.stageId,
          runId: 'abcdef012345',
          status: 'passed',
        },
      ],
    },
    verification,
    failure: null,
    legacyLocalRequested: true,
    integrationLegacyExecuted: false,
  });
  return {
    plan: value.plan,
    receipt,
    inputsStart: inputs,
    inputsEnd: structuredClone(inputs),
  };
};

describe('保存した検証結果の独立照合', () => {
  it('全runner結果と集計を照合する', () => {
    const input = fixture();
    expect(
      validateVerificationArtifacts(input).receipt.verification?.issues,
    ).toEqual([]);
  });
  const faults: [string, (input: ReturnType<typeof fixture>) => void][] = [
    [
      'running',
      (v) => {
        v.receipt.status = 'running';
      },
    ],
    [
      'incomplete',
      (v) => {
        v.receipt.phase = 'verification';
      },
    ],
    [
      'failure',
      (v) => {
        v.receipt.failure = 'INTERRUPTED';
      },
    ],
    [
      'missing execution',
      (v) => {
        v.receipt.execution = null;
      },
    ],
    [
      'count',
      (v) => {
        if (v.receipt.verification) v.receipt.verification.counts.passed++;
      },
    ],
    [
      'plan digest',
      (v) => {
        v.receipt.selectionDigest = 'a'.repeat(64);
      },
    ],
    [
      'input digest',
      (v) => {
        v.inputsStart.digest = 'a'.repeat(64);
      },
    ],
    [
      'root',
      (v) => {
        v.inputsEnd.root = '/other';
      },
    ],
    [
      'checkpoint missing',
      (v) => {
        v.receipt.checkpoints = [];
      },
    ],
    [
      'checkpoint drift',
      (v) => {
        const p = v.receipt.checkpoints[0];
        if (p) p.changes.changed.push('src/test.ts');
      },
    ],
    [
      'wrong run',
      (v) => {
        const run = v.receipt.execution?.runs[0];
        if (run) run.stageId = 'other';
      },
    ],
    [
      'runner failed',
      (v) => {
        const run = v.receipt.execution?.runs[0];
        if (run) run.status = 'failed';
      },
    ],
    [
      'missing owner',
      (v) => {
        const run = v.receipt.execution?.runs[0];
        if (run) run.runId = null;
      },
    ],
    [
      'missing report',
      (v) => {
        const stage = v.receipt.execution?.stages[0];
        if (stage) stage.report = null;
      },
    ],
    [
      'process alive',
      (v) => {
        const stage = v.receipt.execution?.stages[0];
        if (stage) stage.processCleanup.exited = false;
      },
    ],
    [
      'cleanup missing',
      (v) => {
        const stage = v.receipt.execution?.stages[0];
        if (stage) stage.cleanup = null;
      },
    ],
    [
      'partial provenance missing',
      (v) => {
        v.receipt.mode = 'partial';
      },
    ],
    [
      'legacy scope',
      (v) => {
        v.receipt.legacyLocalRequested = false;
      },
    ],
  ];
  it.each(faults)('%sを成功表示でも拒否する', (_label, mutate) => {
    const input = fixture();
    mutate(input);
    expect(() => validateVerificationArtifacts(input)).toThrow();
  });
  it.each([
    'before-environment',
    'before-tests',
    'after-tests',
    'after-cleanup',
  ])('stageの%s checkpoint欠落を拒否する', (phase) => {
    const input = fixture();
    input.receipt.checkpoints = input.receipt.checkpoints.filter(
      (checkpoint) => !checkpoint.phase.endsWith(`:${phase}`),
    );
    expect(() => validateVerificationArtifacts(input)).toThrow(/checkpoint/);
  });
  it.each(['duplicate', 'order'])('checkpointの%sを拒否する', (fault) => {
    const input = fixture();
    if (fault === 'duplicate')
      input.receipt.checkpoints.push(...input.receipt.checkpoints);
    else input.receipt.checkpoints.reverse();
    expect(() => validateVerificationArtifacts(input)).toThrow(/checkpoint/);
  });

  it('成功要約が残っていても必須testのskipを拒否する', () => {
    const input = fixture();
    const stage = input.receipt.execution?.stages[0];
    if (!stage) throw new Error('fixture不足');
    const report = verificationReportSchema.parse(stage.report);
    const test = report.tests.find(({ testId }) => testId === 'first-0');
    if (!test) throw new Error('fixture不足');
    test.outcome = 'skipped';
    test.results = [
      { retry: 0, status: 'skipped', errorCount: 0, annotations: [] },
    ];
    stage.report = report;
    expect(() => validateVerificationArtifacts(input)).toThrow(/runner結果/);
  });

  it('unique IDの成果物だけ読み、latestや別IDを流用しない', async () => {
    const root = await mkdtemp(join(tmpdir(), 'receipt-'));
    roots.push(root);
    const value = fixture();
    const id = value.receipt.verificationId;
    for (const [file, data] of Object.entries({
      'plan.json': value.plan,
      'receipt.json': value.receipt,
      'inputs-start.json': value.inputsStart,
      'inputs-end.json': value.inputsEnd,
    }))
      writeArtifact(
        root,
        `test-results/verification/${id}/${file}`,
        JSON.stringify(data),
      );
    expect(loadVerificationArtifacts(root, id).receipt.status).toBe('passed');
    expect(() => loadVerificationArtifacts(root, '../quality')).toThrow();
    expect(() => loadVerificationArtifacts(root, 'aaaaaaaaaaaa')).toThrow();
    value.receipt.verificationId = 'aaaaaaaaaaaa';
    writeArtifact(
      root,
      `test-results/verification/${id}/receipt.json`,
      JSON.stringify(value.receipt),
    );
    expect(() => loadVerificationArtifacts(root, id)).toThrow();
  });
});

describe('legacy公開結果のreceipt互換', () => {
  const row = {
    key: 'legacy-key',
    fingerprint: 'a'.repeat(64),
    status: 'passed',
    expectedStatus: 'passed',
    annotations: [],
  } as const;

  it('旧receiptを受け入れ、legacyの安全なoptional結果を保持する', () => {
    const value = fixture();
    const stage = value.receipt.execution?.stages[0];
    if (!stage) throw new Error('stage fixture不足');
    expect(stage.evidence.kind).toBe('legacy');
    expect(validateVerificationArtifacts(value).receipt.status).toBe('passed');
    stage.legacyResults = [{ ...row, annotations: [] }];
    expect(
      verificationReceiptSchema.parse(value.receipt).execution?.stages[0]
        ?.legacyResults,
    ).toEqual([row]);
  });

  it.each([
    'annotation',
    'unknown-field',
    'non-legacy',
  ])('受信した%sを拒否する', (fault) => {
    const value = fixture();
    const stage = value.receipt.execution?.stages[0];
    if (!stage) throw new Error('stage fixture不足');
    stage.legacyResults = [{ ...row, annotations: [] }];
    if (fault === 'non-legacy') stage.evidence.kind = 'schedule';
    else if (fault === 'annotation')
      stage.legacyResults[0]?.annotations.push({
        type: 'custom',
        description: 'fixture-private-token',
      });
    else
      Object.assign(stage.legacyResults[0] ?? {}, {
        private: 'fixture-private-token',
      });
    expect(() => verificationReceiptSchema.parse(value.receipt)).toThrow();
  });
});
