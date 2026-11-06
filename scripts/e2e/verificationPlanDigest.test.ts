import { describe, expect, it } from 'vitest';

import { verificationFixture } from './fixtures/verification';
import {
  digestVerificationPlan,
  serializeVerificationPlan,
} from './verificationPlanDigest';

import { createHash } from 'node:crypto';

describe('保存planとselection digestの共有規則', () => {
  it('保存するUTF-8本文と末尾LFを含むSHA256がcontextに一致する', () => {
    const { plan, input } = verificationFixture();
    const text = serializeVerificationPlan(plan);
    expect(text.endsWith('\n')).toBe(true);
    expect(text.endsWith('\n\n')).toBe(false);
    expect(digestVerificationPlan(plan)).toBe(
      createHash('sha256').update(Buffer.from(text)).digest('hex'),
    );
    expect(input.selectionDigest).toBe(digestVerificationPlan(plan));
  });

  it('objectのfield挿入順に依存せず、同じschema順で保存する', () => {
    const { plan } = verificationFixture();
    const reordered = {
      allowedExtraTests: plan.allowedExtraTests,
      requirements: plan.requirements,
      schemaVersion: plan.schemaVersion,
    };
    expect(serializeVerificationPlan(reordered)).toBe(
      serializeVerificationPlan(plan),
    );
  });

  it('選択した必須集合の変更をdigestへ反映する', () => {
    const { plan } = verificationFixture();
    const before = digestVerificationPlan(plan);
    plan.requirements = plan.requirements.slice(1);
    expect(digestVerificationPlan(plan)).not.toBe(before);
  });
});
