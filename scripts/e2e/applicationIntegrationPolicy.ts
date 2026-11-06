import { isNil } from 'ramda';

import type { FixtureActor } from '../../e2e/fixtures/fixtureSchema';
import type { IntegrationClaim } from './integrationSchema';

// 台帳と実登録を同時に減らしても、受入済みの主体別条件を削減しない。
export const APPLICATION_VARIANT_ACTORS = {
  'session-application-apply': {
    applicant: 'applicant',
    'outsider-self': 'outsider',
  },
  'session-application-apply-deny': {
    anonymous: 'anonymous',
    'confirmed-player': 'confirmed-player',
  },
  'session-application-apply-invalid': { 'message-too-long': 'applicant' },
  'session-application-cancel': { applicant: 'applicant' },
  'session-application-cancel-deny': {
    anonymous: 'anonymous',
    outsider: 'outsider',
    'confirmed-player': 'confirmed-player',
  },
  'session-application-cancel-invalid': { 'non-object': 'applicant' },
} as const;

/** 申請fixtureの固定case・variantに対応する実行主体を返す。 */
export const applicationIntegrationActor = (
  claim: Pick<IntegrationClaim, 'caseId' | 'variant'>,
) => {
  const definition = Object.entries(APPLICATION_VARIANT_ACTORS).find(
    ([caseId]) => caseId === claim.caseId,
  )?.[1];
  if (isNil(definition)) return undefined;
  return Object.entries(definition).find(
    ([variant]) => variant === claim.variant,
  )?.[1];
};

/** 作成済み・予約済みの参加行を、成功と拒否の各条件に対応させる。 */
export const applicationIntegrationParticipants = (
  claim: Pick<IntegrationClaim, 'caseId' | 'variant'>,
): FixtureActor['kind'][] | undefined => {
  const actor = applicationIntegrationActor(claim);
  if (isNil(actor)) return undefined;
  const kinds: FixtureActor['kind'][] = ['creator-only', 'confirmed-player'];
  if (claim.caseId === 'session-application-apply') kinds.push(actor);
  else if (
    claim.caseId === 'session-application-apply-invalid' ||
    claim.caseId.startsWith('session-application-cancel')
  )
    kinds.push('applicant');
  return kinds;
};
