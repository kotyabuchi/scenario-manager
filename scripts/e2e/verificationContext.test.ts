import { afterEach, describe, expect, it } from 'vitest';

import {
  prepareVerificationDirectory,
  prepareVerificationStage,
  readVerificationContext,
  verificationEnvironment,
  verificationStagePath,
} from './verificationContext';

import { mkdtempSync, realpathSync, rmSync, symlinkSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const roots: string[] = [];
const context = {
  verificationId: 'a'.repeat(12),
  stageId: 'isolated',
  selectionDigest: 'b'.repeat(64),
  inputDigest: 'c'.repeat(64),
};
const fixture = () => {
  const root = realpathSync(
    mkdtempSync(join(tmpdir(), 'verification-context-')),
  );
  roots.push(root);
  return root;
};
afterEach(() => {
  for (const root of roots.splice(0)) {
    if (!root.startsWith(join(realpathSync(tmpdir()), 'verification-context-')))
      throw new Error('一時directoryの範囲が不正です');
    rmSync(root, { recursive: true, force: true });
  }
});

describe('統合run contextの境界', () => {
  it('未設定だけをstandaloneとし、一部設定や不正値を拒否する', () => {
    expect(readVerificationContext({})).toBeNull();
    expect(readVerificationContext(verificationEnvironment(context))).toEqual(
      context,
    );
    expect(() =>
      readVerificationContext({
        SCENARIO_E2E_VERIFICATION_ID: context.verificationId,
      }),
    ).toThrow();
    expect(() =>
      readVerificationContext({
        ...verificationEnvironment(context),
        SCENARIO_E2E_STAGE_ID: '../old',
      }),
    ).toThrow();
  });

  it('run/stageを一度だけ作成し、未準備のpathを使わない', () => {
    const root = fixture();
    expect(() =>
      verificationStagePath(root, context, 'playwright.json'),
    ).toThrow();
    prepareVerificationDirectory(root, context.verificationId);
    expect(() =>
      prepareVerificationDirectory(root, context.verificationId),
    ).toThrow();
    expect(() =>
      verificationStagePath(root, context, 'playwright.json'),
    ).toThrow();
    const stage = prepareVerificationStage(root, context);
    expect(verificationStagePath(root, context, 'playwright.json')).toBe(
      join(stage, 'playwright.json'),
    );
    expect(() => prepareVerificationStage(root, context)).toThrow();
    expect(() => verificationStagePath(root, context, '../old.json')).toThrow();
  });

  it('既存出力のjunctionから外部へ辿らない', () => {
    const root = fixture();
    const external = fixture();
    symlinkSync(external, join(root, 'test-results'), 'junction');
    expect(() =>
      prepareVerificationDirectory(root, context.verificationId),
    ).toThrow();
  });
});
