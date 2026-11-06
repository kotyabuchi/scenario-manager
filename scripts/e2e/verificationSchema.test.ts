import { describe, expect, it } from 'vitest';

import { verificationFixture } from './fixtures/verification';
import {
  verificationContextSchema,
  verificationReportSchema,
  verificationStageResultSchema,
} from './verificationSchema';

describe('verification artifactの共有schema', () => {
  it('contextの4次元を厳密に要求する', () => {
    const { report } = verificationFixture();
    expect(verificationContextSchema.parse(report.context)).toEqual(
      report.context,
    );
    for (const key of [
      'verificationId',
      'stageId',
      'selectionDigest',
      'inputDigest',
    ]) {
      const value = { ...report.context };
      Reflect.deleteProperty(value, key);
      expect(verificationContextSchema.safeParse(value).success).toBe(false);
    }
    expect(
      verificationContextSchema.safeParse({
        ...report.context,
        verificationId: 'old-run',
      }).success,
    ).toBe(false);
    expect(
      verificationContextSchema.safeParse({
        ...report.context,
        stageId: '../outside',
      }).success,
    ).toBe(false);
    expect(
      verificationContextSchema.safeParse({
        ...report.context,
        inputDigest: 'x'.repeat(64),
      }).success,
    ).toBe(false);
  });
  it('標準reportにfixture/token/error本文を混ぜない', () => {
    const { report } = verificationFixture();
    expect(
      verificationReportSchema.safeParse({
        ...report,
        serviceRoleKey: 'private',
      }).success,
    ).toBe(false);
    const result = report.tests[0];
    if (result === undefined) throw new Error('fixture不足');
    Reflect.set(result, 'attachments', []);
    expect(verificationReportSchema.safeParse(report).success).toBe(false);
  });
  it('失敗stageのreport欠損は入力へ残し、checkerが成功にしないため保持する', () => {
    const { stage } = verificationFixture();
    expect(
      verificationStageResultSchema.parse({ ...stage, report: null }).report,
    ).toBeNull();
    expect(verificationReportSchema.safeParse(null).success).toBe(false);
  });
});
