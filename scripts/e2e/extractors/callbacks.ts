import { isNil } from 'ramda';
import ts from 'typescript';

import { createCallbackAdapters } from './callbackAdapters';
import { finalizeCallbackResults } from './callbackResults';
import {
  branch,
  cloneTrace,
  createCallbackTruth,
  createHashSyntax,
  externalHref,
  inlineFunction,
  nodeEndpoint,
  walkLogical,
} from './callbackTruth';
import { unwrapExpression } from './dependencyProvenance';

import type { FunctionNode } from '../sourceIndex';
import type { SurfaceEndpoint, SurfaceFlowStep } from '../surfaceSchema';
import type { Draft, IssueCode, Trace } from './callbackResults';
import type { Handler } from './callbackTruth';
import type {
  BoundValue,
  CallbackResolution,
  CallbackResolutionInput,
  Candidate,
  Frame,
} from './surfaceTypes';

const MAX_DEPTH = 32;
const MAX_VISITS = 1_024;

/** 実際のmountから供給された値を保ち、操作ごとの可能なcallback経路を観測する。 */
export const resolveSurfaceCallbacks = ({
  context,
  index,
  candidates,
  readProp,
  nodes,
  edges,
}: CallbackResolutionInput): CallbackResolution => {
  const adapters = createCallbackAdapters(context, index);
  const core = new Map(nodes.map((node) => [node.id, node]));
  const actions = new Map<string, string[]>();
  for (const edge of edges) {
    if (edge.kind !== 'exports' || core.get(edge.from)?.kind !== 'action')
      continue;
    actions.set(edge.to, [...(actions.get(edge.to) ?? []), edge.from]);
  }
  const routes = new Map<string, string[]>();
  for (const { kind, navigation, url, id } of nodes) {
    if (kind !== 'page' || navigation === 'intercepted' || isNil(url)) continue;
    routes.set(url, [...(routes.get(url) ?? []), id]);
  }
  const hashSyntax = createHashSyntax();

  const analyze = (candidate: Candidate): Draft => {
    const { site } = candidate;
    const initial: Trace = {
      flow: [...candidate.renderFlow],
      syntax: [],
      targets: new Set(),
      issues: [],
      omitted: false,
      external: false,
      visits: 0,
    };
    const from: SurfaceEndpoint = { kind: 'site', siteId: site.id };
    const anonymous: SurfaceEndpoint = { kind: 'handler', siteId: site.id };
    const syntax = (trace: Trace, node: ts.Node) => {
      trace.syntax.push(hashSyntax(node));
    };
    const issue = (trace: Trace, node: ts.Node, code: IssueCode) => {
      syntax(trace, node);
      if (
        !trace.issues.some((item) => item.node === node && item.code === code)
      )
        trace.issues.push({ code, node });
    };
    const flow = (
      trace: Trace,
      kind: SurfaceFlowStep['kind'],
      from: SurfaceEndpoint,
      to: SurfaceEndpoint,
      node: ts.Node,
    ) => trace.flow.push({ kind, from, to, source: index.location(node) });
    const endpoint = (fn: FunctionNode) => {
      const record = index.getFunction(fn);
      return !isNil(record) && core.has(record.id)
        ? nodeEndpoint(record.id)
        : anonymous;
    };

    const chase = (
      trace: Trace,
      value: BoundValue,
      initialFrom: SurfaceEndpoint,
      absenceIsSafe: boolean,
      occurrence?: ts.Node,
      shouldKeepAssertion = false,
    ): Handler | undefined => {
      let current = value;
      let previous = initialFrom;
      const seen = new Map<Frame, Set<ts.Node>>();
      for (let depth = 0; depth < MAX_DEPTH; depth++) {
        if (current.kind === 'absent') {
          if (absenceIsSafe || isNil(occurrence)) trace.omitted = true;
          else issue(trace, occurrence, 'SURFACE_CALLBACK_CALL_UNKNOWN');
          return undefined;
        }
        if (current.kind === 'unknown') {
          issue(trace, current.node, 'SURFACE_CALLBACK_UNKNOWN');
          return undefined;
        }
        const { frame } = current;
        const expression = shouldKeepAssertion
          ? current.expression
          : unwrapExpression(current.expression);
        const frameNodes = seen.get(frame) ?? new Set<ts.Node>();
        if (frameNodes.has(expression)) {
          issue(trace, expression, 'SURFACE_CALLBACK_TRUNCATED');
          return undefined;
        }
        frameNodes.add(expression);
        seen.set(frame, frameNodes);
        const prop = readProp(frame, expression);
        if (!isNil(prop)) {
          const name = adapters.propName(expression);
          if (isNil(name)) {
            issue(trace, expression, 'SURFACE_CALLBACK_UNKNOWN');
            return undefined;
          }
          syntax(trace, expression);
          const slot: SurfaceEndpoint = {
            kind: 'prop',
            ownerId: frame.ownerId,
            name,
          };
          flow(trace, 'invoke-prop', previous, slot, occurrence ?? expression);
          if (prop.kind === 'bound') {
            const fn = index.resolveFunction(unwrapExpression(prop.expression));
            trace.flow.push({
              kind: 'pass-prop',
              from: isNil(fn) ? anonymous : endpoint(fn.node),
              to: slot,
              source: prop.source,
            });
          }
          previous = slot;
          current = prop;
          continue;
        }
        const alias = adapters.alias(expression);
        if (!isNil(alias)) {
          syntax(trace, expression);
          current = { ...current, expression: alias };
          continue;
        }
        if (ts.isCallExpression(expression)) {
          const receiver = adapters.bindReceiver(expression);
          if (!isNil(receiver)) {
            syntax(trace, expression);
            current = { ...current, expression: receiver };
            continue;
          }
        }
        return { expression, frame, from: previous };
      }
      if (current.kind === 'bound')
        issue(trace, current.expression, 'SURFACE_CALLBACK_TRUNCATED');
      return undefined;
    };

    const navigate = (
      trace: Trace,
      href: ts.Expression,
      caller: SurfaceEndpoint,
    ) => {
      let value = href;
      while (ts.isParenthesizedExpression(value)) value = value.expression;
      syntax(trace, value);
      if (ts.isStringLiteralLike(value)) {
        const path = value.text;
        if (externalHref.test(path)) {
          trace.external = true;
          return;
        }
        if (path.startsWith('/') && !/[?#[\]\\]/u.test(path)) {
          const matched = routes.get(path);
          const id = matched?.length === 1 ? matched[0] : undefined;
          if (!isNil(id)) {
            trace.targets.add(id);
            flow(trace, 'navigate-to', caller, nodeEndpoint(id), value);
            return;
          }
        }
      }
      issue(trace, value, 'SURFACE_CALLBACK_NAVIGATION_UNKNOWN');
    };
    const active = new Set<ts.Node>();
    const interpret = (trace: Trace, handler: Handler, occurrence: ts.Node) => {
      const { expression, frame, from } = handler;
      if (active.size >= MAX_DEPTH || trace.visits >= MAX_VISITS) {
        issue(trace, occurrence, 'SURFACE_CALLBACK_TRUNCATED');
        return;
      }
      if (ts.isConditionalExpression(expression)) {
        if (active.has(expression)) {
          issue(trace, occurrence, 'SURFACE_CALLBACK_TRUNCATED');
          return;
        }
        syntax(trace, expression);
        const choice = truth(trace, expression.condition, frame);
        if (isNil(choice)) walk(trace, expression.condition, frame, from);
        active.add(expression);
        try {
          for (const arm of isNil(choice)
            ? [expression.whenTrue, expression.whenFalse]
            : [choice ? expression.whenTrue : expression.whenFalse]) {
            const resolved = chase(
              trace,
              {
                kind: 'bound',
                expression: arm,
                frame,
                source: index.location(arm),
              },
              from,
              false,
              arm,
            );
            if (!isNil(resolved)) interpret(trace, resolved, arm);
          }
        } finally {
          active.delete(expression);
        }
        return;
      }
      const record = adapters.isTypeOnlyReference(expression)
        ? undefined
        : index.resolveFunction(expression);
      const fn =
        record?.node ?? (inlineFunction(expression) ? expression : undefined);
      if (isNil(fn) || ts.isConstructorDeclaration(fn) || !index.filePath(fn)) {
        issue(trace, occurrence, 'SURFACE_CALLBACK_UNKNOWN');
        return;
      }
      if (ts.isIdentifier(expression) && adapters.isReassigned(expression)) {
        issue(trace, occurrence, 'SURFACE_CALLBACK_UNKNOWN');
        return;
      }
      const ids = isNil(record) ? undefined : actions.get(record.id);
      if (!isNil(ids) && !isNil(record)) {
        const target = adapters.actionTarget(expression, record, ids, core);
        if (isNil(target))
          issue(trace, occurrence, 'SURFACE_CALLBACK_ACTION_AMBIGUOUS');
        else {
          trace.targets.add(target);
          flow(trace, 'invoke-handler', from, nodeEndpoint(target), occurrence);
        }
        return;
      }
      if (active.has(fn)) {
        issue(trace, occurrence, 'SURFACE_CALLBACK_TRUNCATED');
        return;
      }
      const target = endpoint(fn);
      flow(trace, 'invoke-handler', from, target, occurrence);
      syntax(trace, fn);
      active.add(fn);
      try {
        walk(trace, fn.body, frame, target);
      } finally {
        active.delete(fn);
      }
    };

    const truth = createCallbackTruth(index, readProp, syntax);
    const walkCall = (
      trace: Trace,
      call: ts.CallExpression,
      frame: Frame,
      owner: SurfaceEndpoint,
    ) => {
      syntax(trace, call);
      const callee = unwrapExpression(call.expression);
      if (
        (ts.isElementAccessExpression(callee) ||
          ts.isPropertyAccessExpression(callee)) &&
        callee.questionDotToken
      ) {
        const wasOmitted = trace.omitted;
        trace.omitted = false;
        const receiver = chase(
          trace,
          {
            kind: 'bound',
            expression: callee.expression,
            frame,
            source: index.location(callee.expression),
          },
          owner,
          true,
          callee,
        );
        const receiverWasOmitted = trace.omitted;
        trace.omitted ||= wasOmitted;
        if (isNil(receiver) && receiverWasOmitted) return;
      }
      if (ts.isCallExpression(callee)) {
        if (isNil(adapters.bindReceiver(callee)))
          walk(trace, callee, frame, owner);
        else
          for (const argument of callee.arguments)
            walk(trace, argument, frame, owner);
      }
      if (
        ts.isPropertyAccessExpression(callee) ||
        ts.isElementAccessExpression(callee)
      )
        ts.forEachChild(callee, (child) => {
          walk(trace, child, frame, owner);
        });
      if (call.questionDotToken) {
        const wasOmitted = trace.omitted;
        trace.omitted = false;
        const optional = chase(
          trace,
          {
            kind: 'bound',
            expression: call.expression,
            frame,
            source: index.location(call.expression),
          },
          owner,
          true,
          call,
        );
        const callWasOmitted = trace.omitted;
        trace.omitted ||= wasOmitted;
        if (isNil(optional) && callWasOmitted) return;
      }
      for (const argument of call.arguments)
        walk(trace, argument, frame, owner);
      const kind = adapters.callKind(call.expression);
      const argument = call.arguments[0];
      if (kind === 'local-state') return;
      if (
        kind === 'transition' &&
        call.arguments.length === 1 &&
        !isNil(argument) &&
        inlineFunction(argument)
      ) {
        interpret(trace, { expression: argument, frame, from: owner }, call);
        return;
      }
      if (kind === 'navigation' && !isNil(argument)) {
        navigate(trace, argument, owner);
        return;
      }
      if (!isNil(kind)) {
        issue(trace, call, 'SURFACE_CALLBACK_CALL_UNKNOWN');
        return;
      }
      const resolved = chase(
        trace,
        {
          kind: 'bound',
          expression: call.expression,
          frame,
          source: index.location(call.expression),
        },
        owner,
        !isNil(call.questionDotToken),
        call,
      );
      if (!isNil(resolved)) interpret(trace, resolved, call);
    };
    function walk(
      trace: Trace,
      node: ts.Node,
      frame: Frame,
      owner: SurfaceEndpoint,
    ): boolean {
      if (++trace.visits > MAX_VISITS) {
        if (trace.visits === MAX_VISITS + 1)
          issue(trace, node, 'SURFACE_CALLBACK_TRUNCATED');
        return true;
      }
      if (ts.isFunctionLike(node)) return false;
      if (ts.isBlock(node))
        return node.statements.some((item) => walk(trace, item, frame, owner));
      if (ts.isIfStatement(node)) {
        const choice = truth(trace, node.expression, frame);
        if (choice === true)
          return walk(trace, node.thenStatement, frame, owner);
        if (choice === false)
          return (
            !isNil(node.elseStatement) &&
            walk(trace, node.elseStatement, frame, owner)
          );
        walk(trace, node.expression, frame, owner);
        const stops = walk(trace, node.thenStatement, frame, owner);
        return (
          !isNil(node.elseStatement) &&
          walk(trace, node.elseStatement, frame, owner) &&
          stops
        );
      }
      if (ts.isConditionalExpression(node)) {
        const choice = truth(trace, node.condition, frame);
        if (isNil(choice)) walk(trace, node.condition, frame, owner);
        if (isNil(choice)) {
          walk(trace, node.whenTrue, frame, owner);
          walk(trace, node.whenFalse, frame, owner);
        } else
          walk(trace, choice ? node.whenTrue : node.whenFalse, frame, owner);
        return false;
      }
      if (
        ts.isBinaryExpression(node) &&
        walkLogical(trace, node, frame, owner, truth, walk)
      )
        return false;
      if (ts.isCallExpression(node)) walkCall(trace, node, frame, owner);
      else
        ts.forEachChild(node, (child) => {
          walk(trace, child, frame, owner);
        });
      if (ts.isNewExpression(node))
        issue(trace, node, 'SURFACE_CALLBACK_CALL_UNKNOWN');
      return ts.isReturnStatement(node) || ts.isThrowStatement(node);
    }

    const isNavigation =
      site.kind === 'interaction' && site.event === 'navigate';
    const value = chase(
      initial,
      candidate.value,
      from,
      true,
      undefined,
      isNavigation,
    );
    if (isNil(value))
      return { candidate, branches: [branch('handler', initial)] };
    const { expression, frame } = value;
    if (isNavigation) {
      navigate(initial, expression, value.from);
      return { candidate, branches: [branch('handler', initial)] };
    }
    syntax(initial, expression);
    if (
      site.kind === 'interaction' &&
      site.event === 'form-action' &&
      ts.isStringLiteralLike(expression)
    ) {
      initial.external = externalHref.test(expression.text);
      return { candidate, branches: [branch('handler', initial)] };
    }
    if (
      ts.isCallExpression(expression) &&
      adapters.callKind(expression.expression) === 'rhf' &&
      expression.arguments.length >= 1 &&
      expression.arguments.length <= 2 &&
      !expression.arguments.some(ts.isSpreadElement)
    ) {
      syntax(initial, expression);
      const roles = ['valid', 'invalid'] as const;
      return {
        candidate,
        branches: roles.flatMap((role, position) => {
          const argument = expression.arguments[position];
          if (isNil(argument)) return [];
          const trace = cloneTrace(initial);
          const handler = chase(
            trace,
            {
              kind: 'bound',
              expression: argument,
              frame,
              source: index.location(argument),
            },
            value.from,
            false,
            argument,
          );
          if (!isNil(handler)) interpret(trace, handler, argument);
          return [branch(role, trace)];
        }),
      };
    }
    interpret(initial, value, expression);
    return { candidate, branches: [branch('handler', initial)] };
  };

  return finalizeCallbackResults(index, candidates.map(analyze));
};
