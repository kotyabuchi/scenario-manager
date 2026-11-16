import { afterEach, describe, expect, it, vi } from 'vitest';

import { writeProgressStderr } from './progressStderr';
import { createSupabasePullDiagnostics } from './supabasePullDiagnostics';

vi.mock('./progressStderr', () => ({ writeProgressStderr: vi.fn() }));
afterEach(() => vi.clearAllMocks());
describe('追加pull進捗の限定分類', () => {
  it('Interruptedと匿名layer retryのみ記録し秘密とlayer IDを除く', () => {
    const x = createSupabasePullDiagnostics();
    x.observeLine('postgres  Interrupted', 10);
    x.observeLine('abcdef123456 Retrying in 5 seconds', 20);
    x.observeLine('abcdef123456: Retrying in 1 second', 30);
    x.observeLine('postgres Interrupted secret', 40);
    x.observeLine('abcdef123456 Retrying in 5 seconds secret', 50);
    x.close();
    x.close();
    const text = vi.mocked(writeProgressStderr).mock.calls[0]?.[0] ?? '';
    expect(text).toContain('interrupted');
    expect(text).toContain('layer-retry');
    expect(text).not.toMatch(/abcdef|secret/);
    expect(
      JSON.parse(text.replace('[supabase-pull-diagnostics] ', '')).events,
    ).toHaveLength(3);
  });
});
