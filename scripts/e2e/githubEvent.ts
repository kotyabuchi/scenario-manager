import { isNil } from 'ramda';
import { z } from 'zod';

import {
  githubBranchRefSchema,
  githubDispatchRefSchema,
  githubEventContextSchema,
  githubEventPolicySchema,
  githubPullRequestSchema,
  githubPushBootstrapApprovalSchema,
  githubPushSchema,
} from './githubEventSchema';
import {
  assertGitCommit,
  gitObjectFormat,
  gitOid,
  gitRead,
  resolveGitCommit,
} from './gitObjects';
import { assertWorkingRoot } from './gitWorkingFiles';

import { resolve } from 'node:path';

const isZero = (sha: string) => /^0+$/.test(sha);
const schedulePayload = z.object({ schedule: z.string().optional() });
const dispatchPayload = z.object({ ref: z.string().optional() });

/** 比較元を失ったpushだけを、外部承認の完全一致で受理する。 */
export const verifyGithubPushBootstrapApproval = (
  input: z.input<typeof githubPushBootstrapApprovalSchema>,
  raw: string | undefined,
) => {
  if (!raw?.trim()) throw new Error('比較元がないpushには外部承認が必要です');
  const expected = githubPushBootstrapApprovalSchema.parse(input);
  let approval: z.infer<typeof githubPushBootstrapApprovalSchema>;
  try {
    approval = githubPushBootstrapApprovalSchema.parse(JSON.parse(raw));
  } catch {
    throw new Error('push bootstrapの外部承認の形式が不正です');
  }
  if (JSON.stringify(approval) !== JSON.stringify(expected))
    throw new Error(
      'push bootstrapの外部承認とイベント・baselineが一致しません',
    );
};

/** GitHubイベントの必須値を読み、refとrepoの取り違えを先に拒否する。 */
export const parseGithubEvent = (input: {
  name: unknown;
  payload: unknown;
  context: { sha: unknown; ref: unknown; repository: unknown };
}) => {
  const {
    sha,
    ref: eventRef,
    repository,
  } = githubEventContextSchema.parse(input.context);
  if (isZero(sha)) throw new Error('GitHubイベントのSHAが空です');
  const common = { repository, eventRef };
  if (input.name === 'pull_request') {
    const {
      number,
      pull_request: { base, head },
    } = githubPullRequestSchema.parse(input.payload);
    if (
      base.repo.full_name !== repository ||
      eventRef !== `refs/pull/${number}/merge`
    )
      throw new Error(
        'pull_requestイベントのrefまたはrepositoryが一致しません',
      );
    if (
      isZero(base.sha) ||
      isZero(head.sha) ||
      base.sha.length !== sha.length ||
      head.sha.length !== sha.length
    )
      throw new Error('pull_requestのbase/head SHAが不正です');
    return {
      ...common,
      event: 'pull_request' as const,
      head: head.sha,
      base: base.sha,
    };
  }
  if (input.name === 'push') {
    const push = githubPushSchema.parse(input.payload);
    if (
      push.deleted ||
      push.ref !== eventRef ||
      push.repository.full_name !== repository ||
      push.after !== sha ||
      push.before.length !== sha.length ||
      (isZero(push.before) && !push.created)
    )
      throw new Error('pushイベントのref、repositoryまたはSHAが一致しません');
    return {
      ...common,
      event: 'push' as const,
      head: push.after,
      before: push.before,
    };
  }
  if (input.name === 'schedule') {
    schedulePayload.parse(input.payload);
    if (!githubBranchRefSchema.safeParse(eventRef).success)
      throw new Error('scheduleにはdefault branchのrefが必要です');
    return { ...common, event: 'schedule' as const, head: sha };
  }
  if (input.name === 'workflow_dispatch') {
    const { ref } = dispatchPayload.parse(input.payload);
    if (
      !githubDispatchRefSchema.safeParse(eventRef).success ||
      (!isNil(ref) &&
        ref !== eventRef &&
        ref !== eventRef.replace(/^refs\/(heads|tags)\//, ''))
    )
      throw new Error('workflow_dispatchのrefが一致しません');
    return { ...common, event: 'workflow_dispatch' as const, head: sha };
  }
  throw new Error('対応するGitHub Actionsイベントが必要です');
};

type GithubEvent = ReturnType<typeof parseGithubEvent>;

/** checkoutと比較元をGit objectに固定し、イベントごとの実行方針を返す。 */
export const resolveGithubEventPolicy = ({
  root,
  event,
}: {
  root: string;
  event: GithubEvent;
}) => {
  assertWorkingRoot(resolve(root));
  if (
    gitRead(root, ['rev-parse', '--is-shallow-repository'])
      .toString('utf8')
      .trim() !== 'false'
  )
    throw new Error('GitHubイベントの比較にはshallowでないGit履歴が必要です');
  const format = gitObjectFormat(root);
  const head = assertGitCommit(root, gitOid(format, event.head));
  if (resolveGitCommit(root, 'HEAD') !== head)
    throw new Error('checkout HEADがGitHubイベントのhead SHAと一致しません');
  const common = {
    schemaVersion: 1,
    event: event.event,
    repository: event.repository,
    eventRef: event.eventRef,
    head,
  };
  if (event.event === 'pull_request') {
    const base = assertGitCommit(root, gitOid(format, event.base));
    const merge = gitRead(root, ['merge-base', '--all', base, head])
      .toString('utf8')
      .trim();
    if (merge.split(/\s+/).length !== 1 || !merge)
      throw new Error('PRのmerge-baseを一意に確定できません');
    return githubEventPolicySchema.parse({
      ...common,
      staticBase: { kind: 'comparison', sha: base },
      impactBase: assertGitCommit(root, gitOid(format, merge)),
      execution: 'changed-plus-smoke',
    });
  }
  const full = { ...common, impactBase: null, execution: 'full-required' };
  if (event.event !== 'push')
    return githubEventPolicySchema.parse({
      ...full,
      staticBase: { kind: 'self', sha: head },
    });
  const before = gitOid(format, event.before);
  const objectType = isZero(before)
    ? null
    : gitRead(
        root,
        ['cat-file', '--batch-check=%(objecttype)'],
        `${before}\n`,
        undefined,
        { rejectStderr: true },
      ).toString('utf8');
  if (isNil(objectType) || objectType === `${before} missing\n`)
    return githubEventPolicySchema.parse({
      ...full,
      staticBase: {
        kind: 'push-bootstrap',
        before,
        reason: isNil(objectType) ? 'ZERO_BEFORE' : 'BEFORE_OBJECT_MISSING',
      },
    });
  if (objectType !== 'commit\n')
    throw new Error('pushのbeforeはcommitで指定してください');
  return githubEventPolicySchema.parse({
    ...full,
    staticBase: { kind: 'comparison', sha: assertGitCommit(root, before) },
  });
};
