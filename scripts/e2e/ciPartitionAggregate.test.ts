import { describe, expect, it } from 'vitest';

import { digestCiPartitionManifest } from './ciPartition';
import { aggregateCiPartition } from './ciPartitionAggregate';
import { ciPartitionArtifactsFixture } from './fixtures/ciPartitionArtifacts';
import { verificationReportSchema } from './verificationSchema';

describe('CIの分割結果の集約', () => {
  it('履歴移行の証跡が変われば古いshardの成功を再利用しない', () => {
    const input = ciPartitionArtifactsFixture();
    const surfaceMigrationHistoryDigest = 'd'.repeat(64);
    const manifest = { ...input.manifest, surfaceMigrationHistoryDigest };
    const updated = { ...input, manifest, surfaceMigrationHistoryDigest };
    expect(() => aggregateCiPartition(updated)).toThrow(
      /由来またはverification ID/u,
    );
    const digest = digestCiPartitionManifest(manifest);
    for (const shard of Object.values(updated.shards))
      shard.envelope.manifestDigest = digest;
    expect(aggregateCiPartition(updated).status).toBe('passed');
    expect(() =>
      aggregateCiPartition({
        ...updated,
        surfaceMigrationHistoryDigest: 'e'.repeat(64),
      }),
    ).toThrow('分割と一致しません');
  });

  it('別の検証IDと作業rootを持つ両shardの証拠を照合する', () => {
    const input = ciPartitionArtifactsFixture();
    expect(aggregateCiPartition(input)).toMatchObject({
      status: 'passed',
      workflow: input.workflow,
      effectivePlanDigest: input.manifest.effectivePlanDigest,
      integrationLegacyExecuted: false,
      shards: [
        {
          id: 'required',
          verificationId: '111111111111',
          business: 1,
          extras: 0,
        },
        {
          id: 'legacy-local',
          verificationId: '222222222222',
          business: 1,
          extras: 14,
        },
      ],
    });
  });

  it.each([
    'failure',
    'skipped',
  ] as const)('必須jobの結果が%sなら集約しない', (status) => {
    const input = ciPartitionArtifactsFixture();
    input.jobResults['legacy-local'] = status;
    expect(() => aggregateCiPartition(input)).toThrow(/必須job/u);
  });

  it('片方の実行artifact欠落を拒否する', () => {
    const input = ciPartitionArtifactsFixture();
    expect(() =>
      aggregateCiPartition({
        ...input,
        shards: { required: input.shards.required },
      }),
    ).toThrow(/artifact集合/u);
  });

  it.each([
    'attempt',
    'policy',
  ] as const)('現在のworkflowと異なる%sを拒否する', (field) => {
    const input = ciPartitionArtifactsFixture();
    if (field === 'attempt') input.workflow.attempt++;
    else input.eventPolicy.head = '9'.repeat(40);
    expect(() => aggregateCiPartition(input)).toThrow(
      /workflow attemptまたはイベント/u,
    );
  });

  it.each([
    'manifest',
    'collection',
    'full-plan',
    'verification-id',
  ] as const)('片方だけ異なる%s由来を拒否する', (field) => {
    const input = ciPartitionArtifactsFixture();
    const envelope = input.shards['legacy-local'].envelope;
    if (field === 'manifest') envelope.manifestDigest = '9'.repeat(64);
    else if (field === 'collection')
      envelope.fullCollectionDigest = '9'.repeat(64);
    else if (field === 'full-plan') envelope.fullPlanDigest = '9'.repeat(64);
    else
      envelope.verificationId = input.shards.required.envelope.verificationId;
    expect(() => aggregateCiPartition(input)).toThrow(
      /由来またはverification ID/u,
    );
  });

  it('分割実行側のsnapshot由来が一致しなければ拒否する', () => {
    const input = ciPartitionArtifactsFixture();
    const selection = input.shards.required.verification.receipt.selection;
    if (selection === null) throw new Error('fixture不足');
    selection.snapshotDigest = '9'.repeat(64);
    expect(() => aggregateCiPartition(input)).toThrow(
      /固定入力、または選択由来/u,
    );
  });

  it('legacy側の必須業務登録をextrasとして代用できない', () => {
    const input = ciPartitionArtifactsFixture();
    const artifacts = input.shards['legacy-local'].verification;
    artifacts.plan.requirements.splice(0, 1);
    expect(() => aggregateCiPartition(input)).toThrow(/計画/u);
  });

  it('成功の要約が残っていてもlegacy smokeのskipは再検査で拒否する', () => {
    const input = ciPartitionArtifactsFixture();
    const stage =
      input.shards['legacy-local'].verification.receipt.execution?.stages[0];
    if (stage === undefined) throw new Error('fixture不足');
    const report = verificationReportSchema.parse(stage.report);
    const smoke = report.tests.find(({ file }) => file === 'e2e/smoke.spec.ts');
    if (smoke === undefined) throw new Error('fixture不足');
    smoke.outcome = 'skipped';
    smoke.results = [
      { retry: 0, status: 'skipped', errorCount: 0, annotations: [] },
    ];
    stage.report = report;
    expect(() => aggregateCiPartition(input)).toThrow(/runner結果/u);
  });

  it('legacyのpartial-passedと未回収資源を成功にしない', () => {
    const input = ciPartitionArtifactsFixture();
    const execution =
      input.shards['legacy-local'].verification.receipt.execution;
    const run = execution?.runs[0];
    const cleanup = execution?.stages[0]?.cleanup;
    if (run === undefined || cleanup === undefined || cleanup === null)
      throw new Error('fixture不足');
    run.status = 'partial-passed';
    expect(() => aggregateCiPartition(input)).toThrow(/runner実行記録/u);
    run.status = 'passed';
    cleanup.status = 'incomplete';
    cleanup.remaining.volumes.push({
      name: 'fixture-leftover',
      projectLabel: 'fixture',
      createdAt: cleanup.at,
    });
    expect(() => aggregateCiPartition(input)).toThrow(/cleanup/u);
  });
});
