import { describe, expect, it } from 'vitest';

import { parseVerificationArguments } from './verificationArguments';

describe('検証commandの選択方針', () => {
  it('既存commandは全件、base指定はshadow付き差分検査になる', () => {
    expect(parseVerificationArguments([])).toEqual({
      changed: false,
      forceFull: false,
      shadow: true,
    });
    expect(parseVerificationArguments(['--all'])).toEqual({
      changed: false,
      forceFull: true,
      shadow: true,
    });
    expect(parseVerificationArguments(['--base', 'origin/main'])).toEqual({
      changed: true,
      forceFull: false,
      shadow: true,
      base: 'origin/main',
    });
    expect(parseVerificationArguments(['--changed'])).toEqual({
      changed: true,
      forceFull: false,
      shadow: true,
    });
  });
  it('ローカルのshadow省略と明示的な全件拡大を区別する', () => {
    expect(
      parseVerificationArguments(['--base', 'HEAD', '--no-shadow']),
    ).toMatchObject({ changed: true, shadow: false });
    expect(
      parseVerificationArguments(['--all', '--base', 'HEAD']),
    ).toMatchObject({ changed: true, forceFull: true });
  });
  it.each([
    ['--no-shadow'],
    ['--base'],
    ['--base', '--all'],
    ['--all', '--all'],
    ['--base', 'HEAD', '--base', 'HEAD~1'],
    ['--unknown'],
    ['HEAD'],
  ])('曖昧な引数は実行前に拒否する: %j', (...args) => {
    expect(() => parseVerificationArguments(args)).toThrow();
  });
});
