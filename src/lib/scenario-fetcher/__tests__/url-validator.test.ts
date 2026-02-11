import { describe, expect, it } from 'vitest';

import { validateScenarioUrl } from '../url-validator';

describe('validateScenarioUrl', () => {
  describe('有効なURL', () => {
    it('booth.pm のURLを受け入れる', () => {
      const result = validateScenarioUrl('https://booth.pm/ja/items/2274429');
      expect(result.success).toBe(true);
      if (!result.success) return;
      expect(result.data.domain).toBe('booth.pm');
    });

    it('talto.cc のURLを受け入れる', () => {
      const result = validateScenarioUrl(
        'https://talto.cc/projects/oMjPyDsyzMEvAdQ2CpkZe',
      );
      expect(result.success).toBe(true);
      if (!result.success) return;
      expect(result.data.domain).toBe('talto.cc');
    });

    it('サブドメイン付きの booth.pm を受け入れる', () => {
      const result = validateScenarioUrl('https://dizm.booth.pm/items/2274429');
      expect(result.success).toBe(true);
      if (!result.success) return;
      expect(result.data.domain).toBe('booth.pm');
    });
  });

  describe('拒否されるURL', () => {
    it('ホワイトリスト外のドメインを拒否する', () => {
      const result = validateScenarioUrl('https://example.com/page');
      expect(result.success).toBe(false);
    });

    it('HTTP URLを拒否する', () => {
      const result = validateScenarioUrl('http://booth.pm/ja/items/1');
      expect(result.success).toBe(false);
    });

    it('localhost を拒否する', () => {
      const result = validateScenarioUrl('https://localhost/page');
      expect(result.success).toBe(false);
    });

    it('127.0.0.1 を拒否する', () => {
      const result = validateScenarioUrl('https://127.0.0.1/page');
      expect(result.success).toBe(false);
    });

    it('プライベートIPを拒否する（10.x.x.x）', () => {
      const result = validateScenarioUrl('https://10.0.0.1/page');
      expect(result.success).toBe(false);
    });

    it('プライベートIPを拒否する（192.168.x.x）', () => {
      const result = validateScenarioUrl('https://192.168.1.1/page');
      expect(result.success).toBe(false);
    });

    it('不正なURLでエラーを返す', () => {
      const result = validateScenarioUrl('not-a-url');
      expect(result.success).toBe(false);
    });

    it('file:// プロトコルを拒否する', () => {
      const result = validateScenarioUrl('file:///etc/passwd');
      expect(result.success).toBe(false);
    });
  });
});
