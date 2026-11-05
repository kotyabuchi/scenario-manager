import { z } from 'zod';

import { assertInputPath } from './fingerprintPaths';
import {
  gitFileModeSchema,
  gitObjectFormatSchema,
  gitShaSchema,
} from './gitObjects';

export const assertGitPath = (value: string) => {
  assertInputPath(value);
  if (
    /[<>"|?*]/.test(value) ||
    value
      .split('/')
      .some(
        (part) =>
          /[. ]$/.test(part) ||
          /^(?:\.git|(?:con|prn|aux|nul|com[1-9¹²³]|lpt[1-9¹²³])(?:\..*)?)$/i.test(
            part,
          ),
      )
  )
    throw new Error('Gitの相対ファイルpathが不正です');
};

export const gitPathSchema = z.string().refine((value) => {
  try {
    assertGitPath(value);
    return true;
  } catch {
    return false;
  }
});

const digestSchema = z.string().regex(/^[a-f0-9]{64}$/);
export const gitIndexEntrySchema = z.strictObject({
  path: gitPathSchema,
  mode: gitFileModeSchema,
  oid: gitShaSchema,
});
const changeOrigin = z.enum(['committed', 'staged', 'unstaged', 'untracked']);
const changedPathSchema = z.discriminatedUnion('status', [
  z.strictObject({
    origin: changeOrigin,
    status: z.literal('D'),
    oldPath: gitPathSchema,
    newPath: z.never().optional(),
  }),
  z.strictObject({
    origin: changeOrigin,
    status: z.enum(['A', 'M', 'T']),
    oldPath: z.never().optional(),
    newPath: gitPathSchema,
  }),
  z.strictObject({
    origin: changeOrigin,
    status: z.enum(['R', 'C']),
    oldPath: gitPathSchema,
    newPath: gitPathSchema,
  }),
]);

export const gitSnapshotSchema = z.strictObject({
  schemaVersion: z.literal(1),
  mode: z.enum(['local', 'ci']),
  base: gitShaSchema,
  head: gitShaSchema,
  eventBase: gitShaSchema.optional(),
  objectFormat: gitObjectFormatSchema,
  indexEntries: z.array(gitIndexEntrySchema),
  changedPaths: z.array(changedPathSchema),
  workingFiles: z.array(
    z.strictObject({
      path: gitPathSchema,
      sha256: digestSchema.nullable(),
      mode: z.enum(['100644', '100755']).nullable().optional(),
    }),
  ),
  reasons: z.array(
    z.strictObject({
      code: z.enum(['UNVERSIONED_RUNTIME_INPUT', 'DEPENDENCY_INPUT_CHANGED']),
      paths: z.array(gitPathSchema),
    }),
  ),
  digest: digestSchema,
});

export type GitSnapshot = z.infer<typeof gitSnapshotSchema>;
export type GitIndexEntry = z.infer<typeof gitIndexEntrySchema>;
export type GitChangedPath = z.infer<typeof changedPathSchema>;
