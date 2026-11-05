import { describe, expect, it } from 'vitest';

import { verificationFixture } from './fixtures/verification';
import { hasReleasedStageResources } from './verificationRelease';

import type { VerificationStageResult } from './verificationSchema';

const stageFixture = (kind: 'storybook' | 'integration') => {
  const { stage } = verificationFixture();
  stage.evidence.kind = kind;
  if (kind === 'storybook') {
    stage.exitCode = 1;
    stage.cleanup = null;
  }
  return stage;
};

describe('Shadowの所有資源解放判定', () => {
  it('実終了と停止を確認したStorybookの失敗とDBの正常終了を許可する', () => {
    expect(hasReleasedStageResources(stageFixture('storybook'))).toBe(true);
    expect(hasReleasedStageResources(stageFixture('integration'))).toBe(true);
  });

  it.each<[string, (stage: VerificationStageResult) => void]>([
    [
      '終了通知なし',
      (stage) => {
        stage.exitCode = null;
      },
    ],
    [
      '未終了',
      (stage) => {
        stage.processCleanup.exited = false;
      },
    ],
    [
      'signal終了',
      (stage) => {
        stage.signal = 'SIGTERM';
      },
    ],
    [
      '停止確認の障害',
      (stage) => {
        stage.processCleanup.errorCount = 1;
      },
    ],
    [
      '予期しないDB証跡',
      (stage) => {
        stage.cleanup = stageFixture('integration').cleanup;
      },
    ],
  ])('Storybookの%sは解放済みにしない', (_label, mutate) => {
    const stage = stageFixture('storybook');
    mutate(stage);
    expect(hasReleasedStageResources(stage)).toBe(false);
  });

  it.each([
    'missing',
    'incomplete',
    'remaining',
    'issues',
  ] as const)('DBの後始末証跡が%sなら解放済みにしない', (fault) => {
    const stage = stageFixture('integration');
    const { cleanup } = stage;
    if (!cleanup) throw new Error('fixture不足');
    if (fault === 'missing') stage.cleanup = null;
    if (fault === 'incomplete') cleanup.status = 'incomplete';
    if (fault === 'remaining')
      cleanup.remaining.volumes.push({
        name: 'owned',
        projectLabel: 'sm-e2e-012345abcdef',
        createdAt: cleanup.at,
      });
    if (fault === 'issues')
      cleanup.issues.push({
        code: 'REMOVE_FAILED',
        subject: 'volume:owned',
        message: '削除未確認',
      });
    expect(hasReleasedStageResources(stage)).toBe(false);
  });

  it('DBの残留がなくてもownerの失敗が記録されていれば解放済みにしない', () => {
    const stage = stageFixture('integration');
    expect(stage.cleanup?.status).toBe('complete');
    stage.processCleanup.errorCount = 1;
    expect(hasReleasedStageResources(stage)).toBe(false);
  });
});
