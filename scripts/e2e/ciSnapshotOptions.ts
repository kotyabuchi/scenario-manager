import type { GithubEventPolicy } from './githubEventSchema';

/** CIの影響比較と静的比較を混ぜず、同じ方針を各jobのGit採取に渡す。 */
export const ciSnapshotOptions = (policy: GithubEventPolicy) => ({
  base: policy.impactBase ?? policy.head,
  expectedHead: policy.head,
  mode: 'ci' as const,
  ...(policy.event === 'pull_request'
    ? { eventBase: policy.staticBase.sha }
    : {}),
});
