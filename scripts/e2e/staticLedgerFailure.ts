import { isNil } from 'ramda';

import { writeArtifact } from './ledgerArtifacts';
import { writeProgressStderr } from './progressStderr';
import {
  buildSurfacePendingDiagnostic,
  SurfacePendingSubsetError,
} from './surfacePendingDiagnostic';
import {
  createSurfaceReplayDiagnosticError,
  readSurfaceReplayDiagnostic,
} from './surfaceReplayFailure';

import type { SurfaceAnalysis } from './surfaceSchema';
import type { resolveRevisions } from './trustedRevision';

const LEDGER_CHECK_USAGE =
  '使用法: e2e:ledger:check --base <比較ref>（CIでは引数なし）';

/** 単独CLIの引数検査に限り、固定の使用法を案内する。 */
export class InvalidLedgerCheckArgumentsError extends Error {}

/** 静的検査の失敗を安全な証跡に残し、表示だけの失敗で上書きしない。 */
export const recordStaticLedgerFailure = ({
  root,
  artifactPath,
  error,
  bindings,
  stage,
  revisions,
}: {
  root: string;
  artifactPath: string;
  error: unknown;
  bindings?: SurfaceAnalysis['bindings'] | undefined;
  stage?: 'M1-static';
  revisions?: Awaited<ReturnType<typeof resolveRevisions>>;
}) => {
  const diagnostic =
    error instanceof SurfacePendingSubsetError
      ? buildSurfacePendingDiagnostic(error, bindings)
      : undefined;
  const isInvalidArguments = error instanceof InvalidLedgerCheckArgumentsError;
  const failure = !isNil(diagnostic)
    ? 'UI_SURFACE_PENDING_ADDED'
    : isInvalidArguments
      ? 'INVALID_ARGUMENTS'
      : 'STATIC_LEDGER_CHECK_FAILED';
  const report = {
    stage,
    status: 'failed',
    ...revisions,
    failure,
    ...(isNil(diagnostic) ? {} : { details: diagnostic.details }),
  };
  writeArtifact(root, artifactPath, `${JSON.stringify(report, null, 2)}\n`);
  writeProgressStderr(
    `[e2e-static] ${JSON.stringify({
      failure,
      artifactPath,
      ...diagnostic?.summary,
      ...(isInvalidArguments ? { usage: LEDGER_CHECK_USAGE } : {}),
    })}\n`,
  );
  const surfaceReplay = readSurfaceReplayDiagnostic(error);
  return isNil(surfaceReplay)
    ? new Error(failure)
    : createSurfaceReplayDiagnosticError(surfaceReplay);
};
