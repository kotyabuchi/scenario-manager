import { beforeAll, describe, expect, it } from 'vitest';

beforeAll(async () => {
  // 実際のunit/component setupを適用し、分類器の外側の境界を検証する。
  await import('../../vitest.setup');
});

describe('unitのDB境界', () => {
  it('任意helper内からのSDK client生成も通信前に拒否する', async () => {
    const { createClient, SupabaseClient } = await import(
      '@supabase/supabase-js'
    );
    const createHelperClient = () =>
      createClient('https://unit.invalid', 'test');
    expect(createHelperClient).toThrow(
      'unit/componentでは実DBを使用できません',
    );
    expect(() => new SupabaseClient('https://unit.invalid', 'test')).toThrow(
      'unit/componentでは実DBを使用できません',
    );
  });

  it('SSRとbrowserのclient生成も拒否する', async () => {
    const { createServerClient, createBrowserClient } = await import(
      '@supabase/ssr'
    );
    expect(() =>
      createServerClient('https://unit.invalid', 'test', {
        cookies: { getAll: () => [], setAll: () => undefined },
      }),
    ).toThrow('unit/componentでは実DBを使用できません');
    expect(() => createBrowserClient('https://unit.invalid', 'test')).toThrow(
      'unit/componentでは実DBを使用できません',
    );
  });
});
