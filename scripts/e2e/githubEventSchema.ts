import { z } from 'zod';

import { gitShaSchema } from './gitObjects';

const repository = z
  .string()
  .regex(/^[a-z0-9_.-]+\/[a-z0-9_.-]+$/i)
  .toLowerCase();
const protectedRef = z.enum(['refs/heads/main', 'refs/heads/develop']);
const pullRef = z.string().regex(/^refs\/pull\/[1-9]\d*\/merge$/);
const gitRef = z
  .string()
  .refine(
    (value) =>
      !/[~^:?*[\]\\\s\p{Cc}]/u.test(value) &&
      !value.includes('..') &&
      !value.includes('@{') &&
      !value.endsWith('.') &&
      value
        .split('/')
        .every(
          (part) => part && !part.startsWith('.') && !part.endsWith('.lock'),
        ),
  );
export const githubBranchRefSchema = gitRef.refine((value) =>
  value.startsWith('refs/heads/'),
);
export const githubDispatchRefSchema = gitRef.refine((value) =>
  /^refs\/(heads|tags)\//.test(value),
);
const repoPayload = z.object({ full_name: repository });
const comparison = z.strictObject({
  kind: z.literal('comparison'),
  sha: gitShaSchema,
});
const self = z.strictObject({ kind: z.literal('self'), sha: gitShaSchema });
const pushBootstrap = z.strictObject({
  kind: z.literal('push-bootstrap'),
  before: gitShaSchema,
  reason: z.enum(['ZERO_BEFORE', 'BEFORE_OBJECT_MISSING']),
});

export const githubEventContextSchema = z.object({
  sha: gitShaSchema,
  ref: z.string(),
  repository,
});

export const githubPullRequestSchema = z.object({
  number: z.number().int().positive().safe(),
  pull_request: z.object({
    base: z.object({
      sha: gitShaSchema,
      ref: z.enum(['main', 'develop']),
      repo: repoPayload,
    }),
    head: z.object({ sha: gitShaSchema }),
  }),
});

export const githubPushSchema = z.object({
  after: gitShaSchema,
  before: gitShaSchema,
  ref: protectedRef,
  created: z.boolean(),
  deleted: z.boolean(),
  repository: repoPayload,
});

const policyCommon = {
  schemaVersion: z.literal(1),
  repository,
  head: gitShaSchema,
};
const selfPolicy = {
  ...policyCommon,
  staticBase: self,
  impactBase: z.null(),
  execution: z.literal('full-required'),
};

export const githubEventPolicySchema = z
  .discriminatedUnion('event', [
    z.strictObject({
      ...policyCommon,
      event: z.literal('pull_request'),
      eventRef: pullRef,
      staticBase: comparison,
      impactBase: gitShaSchema,
      execution: z.literal('changed-plus-smoke'),
    }),
    z.strictObject({
      ...policyCommon,
      event: z.literal('push'),
      eventRef: protectedRef,
      staticBase: z.discriminatedUnion('kind', [comparison, pushBootstrap]),
      impactBase: z.null(),
      execution: z.literal('full-required'),
    }),
    z.strictObject({
      ...selfPolicy,
      event: z.literal('schedule'),
      eventRef: githubBranchRefSchema,
    }),
    z.strictObject({
      ...selfPolicy,
      event: z.literal('workflow_dispatch'),
      eventRef: githubDispatchRefSchema,
    }),
  ])
  .superRefine((policy, context) => {
    const { head, staticBase, impactBase } = policy;
    const base =
      staticBase.kind === 'push-bootstrap' ? staticBase.before : staticBase.sha;
    if (
      /^0+$/.test(head) ||
      head.length !== base.length ||
      (impactBase !== null &&
        (head.length !== impactBase.length || /^0+$/.test(impactBase))) ||
      (staticBase.kind === 'self' && head !== base) ||
      (staticBase.kind === 'comparison' && /^0+$/.test(base)) ||
      (staticBase.kind === 'push-bootstrap' &&
        (staticBase.reason === 'ZERO_BEFORE') !== /^0+$/.test(base))
    )
      context.addIssue({
        code: 'custom',
        message: 'GitHubイベントの比較SHAが不正です',
      });
  });

export const githubPushBootstrapApprovalSchema = z.strictObject({
  event: z.literal('push'),
  repository,
  ref: protectedRef,
  before: gitShaSchema,
  head: gitShaSchema,
  baselineDigest: z.string().regex(/^[a-f0-9]{64}$/),
});

type GithubEventPolicy = z.infer<typeof githubEventPolicySchema>;
export type { GithubEventPolicy };
