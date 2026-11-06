import { isNil } from 'ramda';
import { z } from 'zod';

import { legacyEntrySchema, legacyManifestSchema } from './legacy';
import { legacyExecutionSchema } from './legacyExecutionSchema';
import { validateLegacyDiscovery } from './legacySelection';

const compatibilitySchema = z.strictObject({
  schemaVersion: z.literal(1),
  entries: z
    .array(
      z.strictObject({
        key: legacyEntrySchema.shape.key,
        from: legacyEntrySchema.shape.fingerprint,
        to: legacyEntrySchema.shape.fingerprint,
        reason: z.string().trim().min(1),
      }),
    )
    .length(10),
});

type LegacyUiCompatibility = z.infer<typeof compatibilitySchema>;

/** 旧台帳の実行義務を保持し、許可済みの本文fingerprintだけを実行用のコピーへ反映する。 */
export const applyLegacyUiCompatibility = (input: {
  legacy: unknown;
  execution: unknown;
  currentLegacy: unknown;
  compatibility: unknown;
}) => {
  const legacy = legacyManifestSchema.parse(input.legacy);
  const execution = legacyExecutionSchema.parse(input.execution);
  const currentLegacy = legacyManifestSchema.parse(input.currentLegacy);
  const compatibility = compatibilitySchema.parse(input.compatibility);
  const originalTests = new Map(legacy.tests.map((test) => [test.key, test]));
  const currentTests = new Map(
    currentLegacy.tests.map((test) => [test.key, test]),
  );
  const originalExecution = new Map(
    execution.entries.map((entry) => [entry.key, entry]),
  );
  const replacements = new Map<string, string>();
  for (const { key, from, to } of compatibility.entries) {
    if (replacements.has(key))
      throw new Error(`旧suiteのUI互換対応が重複しています: ${key}`);
    const original = originalTests.get(key);
    const planned = originalExecution.get(key);
    if (
      isNil(original) ||
      original.profile !== 'app' ||
      original.expectedStatus !== 'passed' ||
      original.annotations.length !== 0 ||
      planned?.disposition !== 'local'
    )
      throw new Error(`旧suiteのUI互換対応に対象外の登録があります: ${key}`);
    if (
      from === to ||
      original.fingerprint !== from ||
      planned.fingerprint !== from
    )
      throw new Error(`旧suiteのUI互換対応の変更元が一致しません: ${key}`);
    if (currentTests.get(key)?.fingerprint !== to)
      throw new Error(`旧suiteのUI互換対応の変更先が一致しません: ${key}`);
    replacements.set(key, to);
  }

  const replaceFingerprint = <T extends { key: string; fingerprint: string }>(
    entry: T,
  ): T => ({
    ...entry,
    fingerprint: replacements.get(entry.key) ?? entry.fingerprint,
  });
  const effective = {
    legacy: { ...legacy, tests: legacy.tests.map(replaceFingerprint) },
    execution: {
      ...execution,
      entries: execution.entries.map(replaceFingerprint),
    },
    currentLegacy,
  };
  validateLegacyDiscovery(effective);
  return { ...effective, compatibility };
};

export type { LegacyUiCompatibility };
