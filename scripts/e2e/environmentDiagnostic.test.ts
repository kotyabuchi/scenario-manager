import { describe, expect, it } from 'vitest';

import {
  EnvironmentLockError,
  summarizeEnvironmentFailure,
} from './environmentDiagnostic';

describe('環境予約の公開診断', () => {
  it('locking中は未分類の書込み失敗も許可したerrnoを残す', () => {
    const cause = Object.assign(new Error('非公開'), { code: 'ENOSPC' });
    expect(summarizeEnvironmentFailure(cause, true)).toEqual({
      kind: 'environment-lock',
      operations: [],
      systemCodes: ['ENOSPC'],
    });
  });

  it('操作と許可したerrnoだけを残し秘密のmessageやpathを出さない', () => {
    const cause = Object.assign(new Error('password=private-value'), {
      code: 'EADDRINUSE',
      path: '/private/credentials',
    });
    expect(
      summarizeEnvironmentFailure(new EnvironmentLockError('port-bind', cause)),
    ).toEqual({
      kind: 'environment-lock',
      operations: ['port-bind'],
      systemCodes: ['EADDRINUSE'],
    });
  });

  it('元の失敗とcleanupのAggregateErrorを重複なく照合する', () => {
    const failure = new EnvironmentLockError(
      'lock-file',
      Object.assign(new Error('非公開'), { code: 'EEXIST' }),
    );
    expect(
      summarizeEnvironmentFailure(
        new AggregateError([
          failure,
          new Error('非公開', { cause: failure }),
          Object.assign(new Error('非公開'), { code: 'EPERM' }),
        ]),
      ),
    ).toEqual({
      kind: 'environment-lock',
      operations: ['lock-file'],
      systemCodes: ['EEXIST', 'EPERM'],
    });
  });

  it('未知のcodeと予約以外の例外を公開しない', () => {
    const cause = Object.assign(new Error('非公開'), { code: 'secret-token' });
    expect(summarizeEnvironmentFailure(cause)).toBeNull();
    expect(
      summarizeEnvironmentFailure(
        new EnvironmentLockError('registry-directory', cause),
      ),
    ).toEqual({
      kind: 'environment-lock',
      operations: ['registry-directory'],
      systemCodes: [],
    });
    expect(summarizeEnvironmentFailure('secret-token')).toBeNull();
  });

  it('causeの循環があっても停止する', () => {
    const cause = new Error('非公開');
    cause.cause = cause;
    expect(
      summarizeEnvironmentFailure(
        new EnvironmentLockError('worktree-directory', cause),
      ),
    ).toEqual({
      kind: 'environment-lock',
      operations: ['worktree-directory'],
      systemCodes: [],
    });
  });
});
