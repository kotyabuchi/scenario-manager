import { isNil } from 'ramda';
import { describe, expect, it } from 'vitest';

import {
  createCiPartitionManifest,
  validateCiPartitionManifest,
} from './ciPartition';
import {
  CI_LEGACY_PROJECTS,
  ciPartitionManifestSchema,
  ciShardEnvelopeSchema,
} from './ciPartitionSchema';
import { ciPartitionFixture } from './fixtures/ciPartition';
import { githubEventPolicySchema } from './githubEventSchema';
import { legacyKey } from './legacy';
import { validateLegacyExecution } from './legacyExecution';
import { selectionReason } from './selectionSchema';
import { verificationTestKey } from './verificationPlan';
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
    expect(plans['legacy-desktop'].requirements).toEqual([input.appRow]);
    expect(plans['legacy-mobile'].requirements).toEqual([input.mobileAppRow]);
    for (const id of ['legacy-desktop', 'legacy-mobile'] as const)
      expect(plans[id].allowedExtraTests).toEqual(
        input.fullPlan.allowedExtraTests.filter(({ test }) =>
          CI_LEGACY_PROJECTS[id].some((project) => project === test.project),
        ),
      );
    expect(manifest.fixedSmoke.legacyKeys).toEqual(
      input.smokeReference.legacy.tests
        .filter(({ file }) => file === 'e2e/smoke.spec.ts')
        .map(({ key }) => key)
        .sort(),
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
    expect(plans['legacy-desktop'].requirements).toEqual([input.appRow]);
    expect(plans['legacy-mobile'].requirements).toEqual([input.mobileAppRow]);
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
      Object.values(plans)
        .flatMap(({ requirements }) => requirements)
        .map(({ key }) => key)
        .sort(),
    ).toEqual(input.fullPlan.requirements.map(({ key }) => key).sort());
    for (const id of ['legacy-desktop', 'legacy-mobile'] as const)
      expect(plans[id].allowedExtraTests).toEqual(
        input.fullPlan.allowedExtraTests.filter(({ test }) =>
          CI_LEGACY_PROJECTS[id].some((project) => project === test.project),
        ),
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
    expect(input.legacy.tests).toHaveLength(16);
    expect(
      input.legacy.tests.filter(({ file }) => file === 'e2e/smoke.spec.ts'),
    ).toHaveLength(14);
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

describe('固定legacy projectの分割契約', () => {
  it('各scopeの2projectと正当な実行先を保持し、全キーを一度だけ割り当てる', () => {
    const input = ciPartitionFixture(true);
    expect(CI_LEGACY_PROJECTS).toEqual({
      'legacy-desktop': ['chromium', 'chromium-auth'],
      'legacy-mobile': ['mobile-chrome', 'mobile-chrome-auth'],
    });
    expect(
      validateLegacyExecution({
        legacy: input.legacy,
        execution: input.execution,
      }).issues,
    ).toEqual([]);
    const { manifest, plans } = createCiPartitionManifest(input);
    expect(manifest.schemaVersion).toBe(2);
    expect(manifest.shards.map(({ id }) => id)).toEqual([
      'required',
      'legacy-desktop',
      'legacy-mobile',
    ]);
    expect(manifest.fixedSmoke.legacyKeys).toHaveLength(14);
    for (const id of ['legacy-desktop', 'legacy-mobile'] as const) {
      const plan = plans[id];
      expect(plan.requirements).toHaveLength(1);
      expect(plan.allowedExtraTests).toHaveLength(8);
      expect(
        [
          ...new Set(
            [...plan.requirements, ...plan.allowedExtraTests].map(
              ({ test }) => test.project,
            ),
          ),
        ].sort(),
      ).toEqual([...CI_LEGACY_PROJECTS[id]].sort());
    }
    const actual = Object.values(plans)
      .flatMap(({ requirements, allowedExtraTests }) => [
        ...requirements,
        ...allowedExtraTests,
      ])
      .map(({ key }) => key)
      .sort();
    const expected = [
      ...input.fullPlan.requirements,
      ...input.fullPlan.allowedExtraTests,
    ]
      .map(({ key }) => key)
      .sort();
    expect(actual).toEqual(expected);
    expect(new Set(actual).size).toBe(actual.length);
  });

  it('planと正本に存在しても固定scope外のprojectを拒否する', () => {
    const input = ciPartitionFixture();
    const extra = input.fullPlan.allowedExtraTests.find(
      ({ test }) => test.project === 'chromium-auth',
    );
    const saved = input.legacy.tests.find(
      ({ key }) => key === extra?.legacy.key,
    );
    if (isNil(extra) || isNil(saved))
      throw new Error('認証extraがありません。');
    extra.test.project = 'unknown-project';
    extra.legacy.key = legacyKey('app', extra.test);
    extra.key = verificationTestKey('app', extra.test);
    saved.project = extra.test.project;
    saved.key = extra.legacy.key;
    input.changeDecision.fullPlanDigest = digestVerificationPlan(
      input.fullPlan,
    );
    expect(() => createCiPartitionManifest(input)).toThrow('固定割当');
  });

  it('認証projectを全planと正本から削除しても固定scopeの欠落として拒否する', () => {
    const input = ciPartitionFixture();
    input.fullPlan.allowedExtraTests = input.fullPlan.allowedExtraTests.filter(
      ({ test }) => test.project !== 'mobile-chrome-auth',
    );
    input.legacy.tests = input.legacy.tests.filter(
      ({ project }) => project !== 'mobile-chrome-auth',
    );
    input.changeDecision.fullPlanDigest = digestVerificationPlan(
      input.fullPlan,
    );
    expect(() => createCiPartitionManifest(input)).toThrow('固定割当');
  });

  it('同じextraの二重割当を拒否する', () => {
    const input = ciPartitionFixture();
    const extra = input.fullPlan.allowedExtraTests[0];
    if (isNil(extra)) throw new Error('extraがありません。');
    input.fullPlan.allowedExtraTests.push(structuredClone(extra));
    input.changeDecision.fullPlanDigest = digestVerificationPlan(
      input.fullPlan,
    );
    expect(() => createCiPartitionManifest(input)).toThrow();
  });

  it('desktopからmobileへのrunner依存を拒否する', () => {
    const input = ciPartitionFixture();
    input.appRow.dependencies.push(input.mobileAppRow.key);
    input.changeDecision.fullPlanDigest = digestVerificationPlan(
      input.fullPlan,
    );
    expect(() => createCiPartitionManifest(input)).toThrow('runner依存');
  });

  it('app以外のextraが混入した計画を拒否する', () => {
    const input = ciPartitionFixture();
    const extra = input.fullPlan.allowedExtraTests[0];
    if (isNil(extra)) throw new Error('extraがありません。');
    extra.profile = 'storybook';
    input.changeDecision.fullPlanDigest = digestVerificationPlan(
      input.fullPlan,
    );
    expect(() => createCiPartitionManifest(input)).toThrow();
  });

  it('旧版と未知・重複・欠損shardのmanifestを拒否する', () => {
    const input = ciPartitionFixture();
    const { manifest } = createCiPartitionManifest(input);
    expect(
      ciPartitionManifestSchema.safeParse({ ...manifest, schemaVersion: 1 })
        .success,
    ).toBe(false);
    expect(
      ciPartitionManifestSchema.safeParse({
        ...manifest,
        shards: manifest.shards.slice(0, 2),
      }).success,
    ).toBe(false);
    expect(
      ciPartitionManifestSchema.safeParse({
        ...manifest,
        shards: [manifest.shards[0], manifest.shards[1], manifest.shards[1]],
      }).success,
    ).toBe(false);
    expect(
      ciPartitionManifestSchema.safeParse({
        ...manifest,
        shards: [
          manifest.shards[0],
          manifest.shards[1],
          { ...manifest.shards[2], id: 'legacy-unknown' },
        ],
      }).success,
    ).toBe(false);
    const envelope = {
      schemaVersion: 2,
      shard: 'legacy-desktop',
      workflow: manifest.workflow,
      manifestDigest: 'a'.repeat(64),
      fullCollectionDigest: manifest.fullCollectionDigest,
      fullPlanDigest: manifest.fullPlanDigest,
      verificationId: '012345abcdef',
    };
    expect(ciShardEnvelopeSchema.safeParse(envelope).success).toBe(true);
    expect(
      ciShardEnvelopeSchema.safeParse({ ...envelope, schemaVersion: 1 })
        .success,
    ).toBe(false);
    expect(
      ciShardEnvelopeSchema.safeParse({ ...envelope, shard: 'legacy-local' })
        .success,
    ).toBe(false);
  });
});
