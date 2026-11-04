import type { Deficiency, Execution } from '../../e2e/ledger/schema';

/** 役割名とactor名のコードポイント順でbindingを複製・整列する。 */
export const orderedBindings = (bindings: Execution['actorBindings']) =>
  [...bindings].sort((left, right) =>
    left.role < right.role
      ? -1
      : left.role > right.role
        ? 1
        : left.actor < right.actor
          ? -1
          : left.actor > right.actor
            ? 1
            : 0,
  );

/** 役割の記述順に依存しない実行条件のidentityを返す。 */
export const executionKey = (execution: Execution): string =>
  JSON.stringify({
    profile: execution.profile,
    project: execution.project,
    runtime: execution.runtime,
    variant: execution.variant,
    actorBindings: orderedBindings(execution.actorBindings),
  });

/** 理由やstatusを含めず、不足の全次元を固定順序で比較する。 */
export const deficiencyKey = (deficiency: Deficiency): string =>
  JSON.stringify({
    target: deficiency.target,
    aspect: deficiency.aspect,
    layer: deficiency.layer,
    caseId: deficiency.caseId,
    variant: deficiency.variant,
    // nullは未知の次元を示し、既知の「actorなし」を表す空配列と区別する。
    actorBindings:
      deficiency.actorBindings === null
        ? null
        : orderedBindings(deficiency.actorBindings),
    profile: deficiency.profile,
    project: deficiency.project,
    runtime: deficiency.runtime,
  });
