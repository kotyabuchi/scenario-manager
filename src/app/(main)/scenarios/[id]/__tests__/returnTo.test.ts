import { describe, expect, it } from 'vitest';

import { resolveScenarioListReturnTo } from '../returnTo';

describe('resolveScenarioListReturnTo', () => {
  it('検索条件と並び順を含む一覧URLを保持する', () => {
    expect(
      resolveScenarioListReturnTo('/scenarios?q=%E6%B5%B7&sort=oldest'),
    ).toBe('/scenarios?q=%E6%B5%B7&sort=oldest');
  });

  it.each([
    undefined,
    ['scenarios'],
    'https://example.com/scenarios',
    '//example.com/scenarios',
    '/scenarios/another',
    '/scenarios?foo=bar#fragment',
  ])('不正な戻り先は一覧の既定URLに戻す: %s', (value) => {
    expect(resolveScenarioListReturnTo(value)).toBe('/scenarios');
  });
});
