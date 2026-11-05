import { isNil } from 'ramda';
import { z } from 'zod';

import { getTestProjects } from './testClassification';

const selectedFilesSchema = z.array(z.string().min(1)).min(1);
export const VERIFIED_INTEGRATION_FILES_ENV = 'SCENARIO_E2E_INTEGRATION_FILES';

/** 既存verified一覧から選択する。相対パスの部分一致やglob入力は受け付けない。 */
export const integrationVerifiedFiles = (root: string, selection?: unknown) => {
  const files = getTestProjects(root)['integration-verified'];
  if (isNil(selection)) return files;
  const selected = selectedFilesSchema.parse(selection);
  const unique = new Set(selected);
  if (
    unique.size !== selected.length ||
    selected.some((file) => !files.includes(file))
  )
    throw new Error('integrationの絞り込み対象がverified一覧と一致しません。');
  return files.filter((file) => unique.has(file));
};

export const integrationRuntimeFiles = (
  root: string,
  env: NodeJS.ProcessEnv,
) => {
  const raw = env[VERIFIED_INTEGRATION_FILES_ENV];
  return integrationVerifiedFiles(
    root,
    isNil(raw) ? undefined : selectedFilesSchema.parse(JSON.parse(raw)),
  );
};
