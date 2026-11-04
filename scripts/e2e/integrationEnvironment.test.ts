import { describe, expect, it } from 'vitest';

import { assertIntegrationEnvironment } from './integrationEnvironment';

const LOCAL_ENVIRONMENT = {
  E2E_SUPABASE_URL: 'http://127.0.0.1:54321',
  E2E_SUPABASE_ANON_KEY: 'local-anon-test-key',
  E2E_SUPABASE_SERVICE_ROLE_KEY: 'local-service-test-key',
};

describe('assertIntegrationEnvironment', () => {
  it('専用設定がなければ通信前に失敗する', () => {
    expect(() => assertIntegrationEnvironment({})).toThrow(
      'DB統合テストの専用環境変数が不足しています',
    );
  });

  it('アプリの接続設定へフォールバックしない', () => {
    expect(() =>
      assertIntegrationEnvironment({
        NEXT_PUBLIC_SUPABASE_URL: 'https://shared.example.invalid',
        NEXT_PUBLIC_SUPABASE_ANON_KEY: 'application-anon-key',
        SUPABASE_SERVICE_ROLE_KEY: 'application-service-key',
      }),
    ).toThrow('E2E_SUPABASE_URL');
  });

  it.each([
    'E2E_SUPABASE_URL',
    'E2E_SUPABASE_ANON_KEY',
    'E2E_SUPABASE_SERVICE_ROLE_KEY',
  ])('%sが空なら他の値で代用しない', (name) => {
    expect(() =>
      assertIntegrationEnvironment({ ...LOCAL_ENVIRONMENT, [name]: ' \n ' }),
    ).toThrow(name);
  });

  it.each([
    'http://localhost:54321',
    'http://127.0.0.1:54321/',
    'http://[::1]:54321',
    'https://localhost:54321/',
  ])('専用設定のローカルURL %s を受け付ける', (url) => {
    expect(
      assertIntegrationEnvironment({
        ...LOCAL_ENVIRONMENT,
        E2E_SUPABASE_URL: url,
      }),
    ).toEqual({
      url,
      anonKey: LOCAL_ENVIRONMENT.E2E_SUPABASE_ANON_KEY,
      serviceRoleKey: LOCAL_ENVIRONMENT.E2E_SUPABASE_SERVICE_ROLE_KEY,
    });
  });

  it.each([
    'https://project.supabase.co',
    'http://localhost.example.invalid:54321',
    'http://192.168.1.2:54321',
    'http://0.0.0.0:54321',
    'http://127.1:54321',
    'http://2130706433:54321',
    'http://[::ffff:127.0.0.1]:54321',
    'postgresql://localhost:54322',
    'http://username:password@localhost:54321',
    'http://localhost:54321/rest/v1',
    'http://localhost:54321/../',
    'http://localhost:54321?apiKey=secret',
    'http://localhost:54321#secret',
    'http://localhost:54321?',
    'http://localhost:54321#',
    ' http://localhost:54321',
    'http://localhost:54321\n',
    'http://localhost:65536',
    'not-a-url',
  ])('許可形式以外のURL %s を拒否する', (url) => {
    expect(() =>
      assertIntegrationEnvironment({
        ...LOCAL_ENVIRONMENT,
        E2E_SUPABASE_URL: url,
      }),
    ).toThrow('E2E_SUPABASE_URL');
  });

  it('拒否理由にURL・資格情報の値を含めない', () => {
    const privateUrl = 'https://private-user:private-password@remote.invalid';
    const environment = {
      E2E_SUPABASE_URL: privateUrl,
      E2E_SUPABASE_ANON_KEY: 'private-anon-key',
      E2E_SUPABASE_SERVICE_ROLE_KEY: 'private-service-key',
    };

    let receivedError: unknown;
    try {
      assertIntegrationEnvironment(environment);
    } catch (error) {
      receivedError = error;
    }

    expect(receivedError).toBeInstanceOf(Error);
    const message = receivedError instanceof Error ? receivedError.message : '';
    for (const secret of [
      ...Object.values(environment),
      'private-user',
      'private-password',
      'remote.invalid',
    ]) {
      expect(message).not.toContain(secret);
    }
  });

  it('入力された環境変数を書き換えない', () => {
    const environment = Object.freeze({ ...LOCAL_ENVIRONMENT });
    expect(() => assertIntegrationEnvironment(environment)).not.toThrow();
  });
});
