import { isNil } from 'ramda';

import { readCiSmokeReference } from './ciBootstrap';
import { ciWorkflowSchema } from './ciPartitionSchema';
import { ciSnapshotOptions } from './ciSnapshotOptions';
import { assertCiStaticReport, type CiStaticBinding } from './ciStaticReport';
import { captureInputs, compareInputs } from './fingerprint';
import { captureGitSnapshot } from './gitSnapshot';
import { loadLedger } from './ledger';
import { parseArtifact, readArtifact, writeArtifact } from './ledgerArtifacts';
import { legacyManifestSchema } from './legacy';
import { ARTIFACTS } from './staticGate';
import { resolveRevisions } from './trustedRevision';

import { isDeepStrictEqual } from 'node:util';

import type { GithubEventPolicy } from './githubEventSchema';

/** GitHubの実イベント・checkout・run attemptを各jobで再取得する。 */
export const readCiContext = async (root: string, env: NodeJS.ProcessEnv) => {
  const revisions = await resolveRevisions({ root, env });
  if (revisions.mode !== 'ci') throw new Error('CIイベントが必要です。');
  const workflow = ciWorkflowSchema.parse({
    runId: env.GITHUB_RUN_ID,
    attempt: Number(env.GITHUB_RUN_ATTEMPT),
  });
  return { eventPolicy: revisions.eventPolicy, workflow };
};

export const readCiLedgers = async (
  root: string,
  policy: GithubEventPolicy,
  rawStaticReport: unknown,
  binding: CiStaticBinding,
) => {
  const staticReport = assertCiStaticReport(
    root,
    rawStaticReport,
    policy,
    binding,
  );
  return {
    ledger: await loadLedger(root),
    legacy: legacyManifestSchema.parse(
      parseArtifact(readArtifact(root, ARTIFACTS.legacy), ARTIFACTS.legacy),
    ),
    ...(policy.event === 'pull_request'
      ? { smokeReference: readCiSmokeReference(root, policy, staticReport) }
      : {}),
  };
};

export const readCiArtifact = (root: string, path: string) =>
  parseArtifact(readArtifact(root, `test-results/ci/${path}`), path);

/** 出力名はCLIが決めたallowlistだけに限定し、前回の成功artifactを上書きしない。 */
export const writeCiArtifact = (root: string, path: string, value: unknown) => {
  const file = `test-results/ci/${path}`;
  if (!isNil(readArtifact(root, file)))
    throw new Error('CI artifactの出力先が既に存在します。');
  writeArtifact(root, file, `${JSON.stringify(value, null, 2)}\n`);
};

/** checksumはrun間で共通、絶対rootは同じjobの前後比較だけに使用する。 */
export const captureCiInputs = async (
  root: string,
  policy: GithubEventPolicy,
) => {
  const inputs = await captureInputs(root);
  const { snapshot } = captureGitSnapshot({
    root,
    ...ciSnapshotOptions(policy),
    runtimeInputPaths: inputs.files.map(({ path }) => path),
  });
  if (snapshot.changedPaths.some(({ origin }) => origin !== 'committed'))
    throw new Error('CIには未コミット変更のないcheckoutが必要です。');
  return { inputs, snapshot };
};

export const assertCiUnchanged = async (
  root: string,
  env: NodeJS.ProcessEnv,
  context: Awaited<ReturnType<typeof readCiContext>>,
  initial: Awaited<ReturnType<typeof captureCiInputs>>,
) => {
  const current = await captureCiInputs(root, context.eventPolicy);
  if (
    !isDeepStrictEqual(await readCiContext(root, env), context) ||
    current.snapshot.digest !== initial.snapshot.digest ||
    Object.values(compareInputs(initial.inputs, current.inputs)).some(
      (paths) => paths.length > 0,
    )
  )
    throw new Error('CI実行中にイベント・Git snapshot・入力が変化しました。');
  return current;
};
