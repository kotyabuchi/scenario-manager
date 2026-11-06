import { describe, expect, it } from 'vitest';

import { normalizeAuthReturnTo } from '../authReturnTo';

describe('normalizeAuthReturnTo', () => {
  it('アプリ内のページと検索条件を維持する', () => {
    expect(normalizeAuthReturnTo('/sessions?tab=upcoming')).toBe(
      '/sessions?tab=upcoming',
    );
    expect(normalizeAuthReturnTo('/scenarios/scn_01#reviews')).toBe(
      '/scenarios/scn_01#reviews',
    );
  });

  it.each([
    'https://example.com',
    '//example.com',
    '/\\example.com',
    '/auth/callback',
    'javascript:alert(1)',
    null,
  ])('外部または認証ルート %s には戻さない', (value) => {
    expect(normalizeAuthReturnTo(value)).toBe('/home');
  });
});
