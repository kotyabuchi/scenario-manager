import { isNil } from 'ramda';
import { describe, expect, it } from 'vitest';

import {
  createCiPartitionManifest,
  validateCiPartitionManifest,
} from './ciPartition';
import { ciPartitionFixture } from './fixtures/ciPartition';
import { githubEventPolicySchema } from './githubEventSchema';
import { legacyKey } from './legacy';
import { selectionReason } from './selectionSchema';
import { digestVerificationPlan } from './verificationPlanDigest';

describe('CIの有効計画とowner分割', () => {
  it('履歴移行digestはmanifest自身を信用せず検証済み静的証跡と照合する', () => {
    const input = ciPartitionFixture();
    const surfaceMigrationHistoryDigest = 'd'.repeat(64);
    const { manifest } = createCiPartitionManifest({
      ...input,
      surfaceMigrationHistoryDigest,
    });
    expect(() =>
      validateCiPartitionManifest({
        ...input,
        manifest,
        surfaceMigrationHistoryDigest,
      }),
    ).not.toThrow();
    for (const expected of [undefined, 'e'.repeat(64)])
      expect(() =>
        validateCiPartitionManifest({
          ...input,
          manifest,
          ...(isNil(expected)
            ? {}
            : { surfaceMigrationHistoryDigest: expected }),
        }),
      ).toThrow('分割と一致しません');
    const { surfaceMigrationHistoryDigest: _saved, ...missing } = manifest;
    expect(() =>
      validateCiPartitionManifest({
        ...input,
        manifest: missing,
        surfaceMigrationHistoryDigest,
      }),
    ).toThrow('分割と一致しません');
  });

  it('文書のみの変更判断を保持して固定Storybookと全legacyを追加する', () => {
    const input = ciPartitionFixture();
    const { manifest, plans } = createCiPartitionManifest(input);
    expect(manifest.changeDecision).toEqual(input.changeDecision);
    expect(manifest.changeDecision?.requestedRequiredKeys).toEqual([]);
    expect(manifest.projectionReasons.map(({ code }) => code)).toContain(
      'CI_FIXED_SMOKE',
    );
    expect(plans.required.requirements).toEqual([input.storyRow]);
    expect(plans.required.allowedExtraTests).toEqual([]);
    expect(plans['legacy-local'].requirements).toEqual([input.appRow]);
    expect(plans['legacy-local'].allowedExtraTests).toEqual(
      input.fullPlan.allowedExtraTests,
    );
    expect(manifest.fixedSmoke.legacyKeys).toEqual(
      input.smokeReference.legacy.tests.map(({ key }) => key).sort(),
    );
    expect(validateCiPartitionManifest({ ...input, manifest })).toEqual({
      manifest,
      plans,
    });
  });

  it('runner fallbackは元の判断を保持し、再射影で全件集合を保証する', () => {
    const input = ciPartitionFixture();
    const { manifest, plans } = createCiPartitionManifest({
      ...input,
      runnerSelectionFallback: true,
    });
    expect(manifest.changeDecision).toEqual(input.changeDecision);
    expect(manifest.effectivePlanDigest).toBe(manifest.fullPlanDigest);
    expect(plans.required.requirements).toEqual([
      input.storyRow,
      input.isolatedRow,
    ]);
    expect(validateCiPartitionManifest({ ...input, manifest })).toEqual({
      manifest,
      plans,
    });
    const { runnerSelectionFallback: _fallback, ...withoutFallback } = manifest;
    expect(() =>
      validateCiPartitionManifest({ ...input, manifest: withoutFallback }),
    ).toThrow('分割と一致しません');
  });

  it('appだけの変更でも非appの固定登録を保持し、shardをまたぐgroupを閉じる', () => {
    const input = ciPartitionFixture();
    const appCase = input.appRow.claim?.caseId;
    const isolatedCase = input.isolatedRow.claim?.caseId;
    if (appCase === undefined || isolatedCase === undefined)
      throw new Error('fixture不足');
    input.changeDecision.mode = 'partial';
    input.changeDecision.requestedRequiredKeys = [input.appRow.key];
    input.changeDecision.caseIds = [appCase];
    input.changeDecision.reasons = [
      selectionReason('TEST_FILE', { caseIds: [appCase] }),
    ];
    input.ledger.executionGroups.push({
      id: 'cross-profile',
      caseIds: [appCase, isolatedCase],
      dependsOn: [],
    });
    const { manifest, plans } = createCiPartitionManifest(input);
    expect(plans.required.requirements).toEqual([
      input.storyRow,
      input.isolatedRow,
    ]);
    expect(plans['legacy-local'].requirements).toEqual([input.appRow]);
    expect(manifest.changeDecision?.requestedRequiredKeys).toEqual([
      input.appRow.key,
    ]);
    expect(manifest.projectionReasons).toContainEqual(
      expect.objectContaining({
        code: 'EXECUTION_GROUP',
        ruleIds: ['cross-profile'],
      }),
    );
  });

  it.each([
    'push',
    'schedule',
    'workflow_dispatch',
  ] as const)('%sでは分割の和が全登録・全legacy extrasと一致する', (event) => {
    const input = ciPartitionFixture();
    const { head } = input.eventPolicy;
    const eventPolicy = githubEventPolicySchema.parse({
      ...input.eventPolicy,
      event,
      eventRef: 'refs/heads/main',
      staticBase:
        event === 'push'
          ? input.eventPolicy.staticBase
          : { kind: 'self', sha: head },
      impactBase: null,
      execution: 'full-required',
    });
    const { manifest, plans } = createCiPartitionManifest({
      ...input,
      eventPolicy,
      changeDecision: null,
    });
    expect(manifest.effectivePlanDigest).toBe(
      digestVerificationPlan(input.fullPlan),
    );
    expect(manifest.fixedSmoke).toEqual({
      requiredCaseIds: [],
      legacyKeys: [],
    });
    expect(
      [...plans.required.requirements, ...plans['legacy-local'].requirements]
        .map(({ key }) => key)
        .sort(),
    ).toEqual(input.fullPlan.requirements.map(({ key }) => key).sort());
    expect(plans['legacy-local'].allowedExtraTests).toEqual(
      input.fullPlan.allowedExtraTests,
    );
  });

  it('app必須のreplacementが移行目録から消えた場合は失敗する', () => {
    const input = ciPartitionFixture();
    input.legacy.registered.pop();
    expect(() => createCiPartitionManifest(input)).toThrow(/移行目録/u);
  });

  it('runner依存のownerが異なる場合は必要登録を落とさず失敗する', () => {
    const input = ciPartitionFixture();
    input.storyRow.dependencies.push(input.appRow.key);
    input.changeDecision.fullPlanDigest = digestVerificationPlan(
      input.fullPlan,
    );
    expect(() => createCiPartitionManifest(input)).toThrow(/runner依存/u);
  });

  it('保存manifestから業務登録を別shardへ移し替えても再射影で拒否する', () => {
    const input = ciPartitionFixture();
    const { manifest } = createCiPartitionManifest(input);
    manifest.shards[0].requiredKeys.push(input.appRow.key);
    manifest.shards[1].requiredKeys.splice(0, 1, input.storyRow.key);
    expect(() => validateCiPartitionManifest({ ...input, manifest })).toThrow(
      /分割/u,
    );
  });
});

describe('CI固定smokeの完全性', () => {
  it.each([
    'missing',
    'planned',
    'skip',
    'only',
  ] as const)('Storybook smokeが%sなら非appを補えない', (failure) => {
    const input = ciPartitionFixture();
    const cases = input.ledger.scenarios[0]?.cases;
    const smoke = cases?.find(
      ({ caseId }) => caseId === 'scenario-search-reset',
    );
    if (smoke === undefined || cases === undefined)
      throw new Error('fixture不足');
    if (failure === 'missing') cases.splice(cases.indexOf(smoke), 1);
    else if (failure === 'planned') smoke.status = 'planned';
    else input.storyRow.test.annotations.push({ type: failure });
    input.changeDecision.fullPlanDigest = digestVerificationPlan(
      input.fullPlan,
    );
    expect(() => createCiPartitionManifest(input)).toThrow(/Storybook smoke/u);
  });

  it('旧testを同数の異なるcanonical keyで置き換えても通さない', () => {
    const input = ciPartitionFixture();
    const row = input.legacy.tests[0];
    const extra = input.fullPlan.allowedExtraTests[0];
    if (row === undefined || extra === undefined)
      throw new Error('fixture不足');
    row.titlePath = ['別の既存test'];
    row.key = legacyKey(row.profile, row);
    extra.test.titlePath = row.titlePath;
    extra.legacy.key = row.key;
    input.changeDecision.fullPlanDigest = digestVerificationPlan(
      input.fullPlan,
    );
    expect(input.legacy.tests).toHaveLength(14);
    expect(() => createCiPartitionManifest(input)).toThrow(/exact key/u);
  });

  it.each([
    'missing',
    'deferred-live',
  ] as const)('legacy smokeの%sを拒否する', (failure) => {
    const input = ciPartitionFixture();
    const extra = input.fullPlan.allowedExtraTests[0];
    if (extra === undefined) throw new Error('fixture不足');
    if (failure === 'missing') input.fullPlan.allowedExtraTests.shift();
    else
      extra.legacy = {
        key: extra.legacy.key,
        fingerprint: extra.legacy.fingerprint,
        disposition: 'deferred-live',
        reason: 'fixture',
      };
    input.changeDecision.fullPlanDigest = digestVerificationPlan(
      input.fullPlan,
    );
    expect(() => createCiPartitionManifest(input)).toThrow(/exact key/u);
  });
});
