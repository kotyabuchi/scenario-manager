import { createDiagnosticAnchors } from '../diagnosticAnchors';

import { createHash } from 'node:crypto';

import type ts from 'typescript';
import type { SourceIndex } from '../sourceIndex';
import type {
  SurfaceBinding,
  SurfaceBranch,
  SurfaceDiagnostic,
  SurfaceFlowStep,
  SurfaceResolution,
} from '../surfaceSchema';
import type { CallbackResolution, Candidate } from './surfaceTypes';

const issueMessages = {
  SURFACE_CALLBACK_UNKNOWN:
    '操作のcallbackの供給元または関数実体を確定できません。',
  SURFACE_CALLBACK_CALL_UNKNOWN: 'callback内の呼出先を確定できません。',
  SURFACE_CALLBACK_ACTION_AMBIGUOUS:
    'callbackが参照するActionの公開入口を一意に確定できません。',
  SURFACE_CALLBACK_NAVIGATION_UNKNOWN:
    '遷移先のpathnameと直接routeを一意に確定できません。',
  SURFACE_CALLBACK_TRUNCATED:
    '循環または探索上限によりcallbackの追跡を打ち切りました。',
} as const;
type IssueCode = keyof typeof issueMessages;
type Issue = { code: IssueCode; node: ts.Node };
type Trace = {
  flow: SurfaceFlowStep[];
  syntax: string[];
  targets: Set<string>;
  issues: Issue[];
  omitted: boolean;
  external: boolean;
  visits: number;
};
type Draft = {
  candidate: Candidate;
  branches: { role: SurfaceBranch['role']; trace: Trace }[];
};

const digest = (value: unknown) =>
  createHash('sha256').update(JSON.stringify(value)).digest('hex');
const compare = (left: string, right: string) =>
  left < right ? -1 : left > right ? 1 : 0;

/** 行列を表示だけに使い、意味のdigestとsource順の診断anchorを確定する。 */
export const finalizeCallbackResults = (
  index: SourceIndex,
  drafts: Draft[],
): CallbackResolution => {
  const anchors = createDiagnosticAnchors(index);
  const issues = drafts
    .flatMap(({ branches }) => branches.flatMap(({ trace }) => trace.issues))
    .sort(
      (left, right) =>
        compare(
          index.filePath(left.node) ?? '',
          index.filePath(right.node) ?? '',
        ) ||
        left.node.getStart() - right.node.getStart() ||
        compare(left.code, right.code),
    );
  for (const { node, code } of issues) anchors(node, code);
  const diagnostics = new Map<string, SurfaceDiagnostic>();
  const bindings: SurfaceBinding[] = drafts.map(
    ({ candidate, branches: input }) => {
      const { entry, site, frame } = candidate;
      const mountSiteIds = [...frame.mountSiteIds];
      const identity = [entry.kind, entry.id, mountSiteIds, site.id];
      const branches = input.map(({ role, trace }): SurfaceBranch => {
        const targetIds = [...trace.targets].sort(compare);
        const references = trace.issues.map(({ node, code }) => {
          const anchor = anchors(node, code);
          const item = {
            code,
            anchor,
            entry,
            siteId: site.id,
            mountSiteIds,
            source: index.location(node),
            message: issueMessages[code],
          };
          diagnostics.set(
            JSON.stringify([entry, mountSiteIds, site.id, code, anchor]),
            item,
          );
          return { code, anchor };
        });
        const resolution: SurfaceResolution =
          references.length > 0
            ? { kind: 'unresolved', targetIds, diagnostics: references }
            : targetIds.length > 0
              ? { kind: 'resolved', targetIds }
              : {
                  kind: trace.external
                    ? 'external-navigation'
                    : trace.omitted
                      ? 'optional-absent'
                      : 'local',
                };
        return { role, flow: trace.flow, resolution };
      });
      return {
        id: `surface:${digest(identity)}`,
        siteId: site.id,
        entry,
        mountSiteIds,
        branches,
        bindingDigest: digest([
          identity,
          branches.map(({ role, flow, resolution }, position) => [
            role,
            flow.map(({ kind, from, to }) => [kind, from, to]),
            resolution.kind,
            'targetIds' in resolution ? resolution.targetIds : [],
            input[position]?.trace.syntax,
          ]),
        ]),
      };
    },
  );
  return { bindings, diagnostics: [...diagnostics.values()] };
};

export type { Draft, IssueCode, Trace };
