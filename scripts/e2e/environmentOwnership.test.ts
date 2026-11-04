import { describe, expect, it } from 'vitest';

import {
  assertOwnedConnection,
  planOwnedCleanup,
  transitionEnvironment,
} from './environmentOwnership';
import { at, fixture } from './fixtures/environment/ownership';

describe('所有環境への接続照合', () => {
  it('preflightとjournalが揃った同一lease/endpointだけを許可する', () => {
    const { plan, preflight, manifest, observed } = fixture();
    expect(() => assertOwnedConnection(plan, observed)).toThrow();
    expect(() => assertOwnedConnection(preflight, observed)).toThrow();
    expect(() => assertOwnedConnection(manifest, observed)).not.toThrow();
    const running = transitionEnvironment(manifest, {
      type: 'running',
      at: at(4),
    });
    expect(() => assertOwnedConnection(running, observed)).not.toThrow();
    const stopping = transitionEnvironment(running, {
      type: 'stopping',
      at: at(5),
    });
    expect(() => assertOwnedConnection(stopping, observed)).toThrow();
  });

  it.each([
    'http://localhost:55321',
    'http://localhost.example.invalid:55321',
    'https://remote.supabase.co',
    'http://127.1:55321',
    'http://2130706433:55321',
    'http://0x7f000001:55321',
    'http://0177.0.0.1:55321',
    'http://[::1]:55321',
    'http://[::ffff:127.0.0.1]:55321',
    'http://0.0.0.0:55321',
    'http://private:password@127.0.0.1:55321',
    'http://127.0.0.1:54321',
    'http://127.0.0.1:55321/',
    'http://127.0.0.1:55321?key=private',
    'http://127.0.0.1:55321#private',
    'http://127.0.0.1:55321/rest/v1',
    ' http://127.0.0.1:55321',
    'http://127.0.0.1:55321\n',
  ])('別表記のlocal URLやremoteへ接続しない: %s', (apiUrl) => {
    const { manifest, observed } = fixture();
    expect(() =>
      assertOwnedConnection(manifest, { ...observed, apiUrl }),
    ).toThrow('接続先');
  });

  it.each([
    { runId: 'abcdef012345' },
    { ownerNonce: '178c50a6-b0ca-46ad-a9d8-136a2a43d58a' },
    { projectId: 'sm-e2e-abcdef012345' },
    { worktreeRoot: '/worktrees/another' },
  ])('leaseの各所有次元が異なれば接続もcleanupも拒否する: %j', (change) => {
    const { manifest, observed, resources, lease } = fixture();
    const other = { ...lease, ...change };
    expect(() =>
      assertOwnedConnection(manifest, { ...observed, lease: other }),
    ).toThrow('lease');
    expect(() => planOwnedCleanup(manifest, resources, other)).toThrow('lease');
  });

  it('別project・DB接続先を拒否し、エラーへ接続情報を漏らさない', () => {
    const { manifest, observed } = fixture();
    for (const change of [
      { projectId: 'scenario-manager' },
      { database: { ...observed.database, host: 'remote.private' } },
      { database: { ...observed.database, port: 55323 } },
      { database: { ...observed.database, name: 'private' } },
    ]) {
      try {
        assertOwnedConnection(manifest, { ...observed, ...change });
        expect.fail('拒否される必要があります');
      } catch (error) {
        expect(error).toBeInstanceOf(Error);
        expect(error instanceof Error && error.message).not.toMatch(
          /private|scenario-manager|55323/,
        );
      }
    }
  });
});
