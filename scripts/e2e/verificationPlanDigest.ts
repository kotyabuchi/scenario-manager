import { verificationPlanSchema } from './verificationSchema';

import { createHash } from 'node:crypto';

import type { VerificationPlan } from './verificationSchema';

/** 保存本文とcontextの対応を固定する。schemaのfield順と末尾LFも同じ規則で使う。 */
export const serializeVerificationPlan = (plan: VerificationPlan): string =>
  `${JSON.stringify(verificationPlanSchema.parse(plan), null, 2)}\n`;

/** receiptは認証ではないが、別planと古いreportの取り違えはこの対応検査で拒否する。 */
export const digestVerificationPlan = (plan: VerificationPlan): string =>
  createHash('sha256').update(serializeVerificationPlan(plan)).digest('hex');
