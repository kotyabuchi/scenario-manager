import { err, ok, type Result } from '@/types/result';

/**
 * 許可するドメインのホワイトリスト
 */
const ALLOWED_DOMAINS = ['booth.pm', 'talto.cc'] as const;

type AllowedDomain = (typeof ALLOWED_DOMAINS)[number];

/**
 * プライベートIP・ローカルホストのパターン
 */
const BLOCKED_HOSTNAMES = ['localhost', '127.0.0.1', '0.0.0.0', '[::1]'];

/**
 * URLを検証し、許可されたドメインかどうかを判定する（SSRF対策）
 */
export const validateScenarioUrl = (
  input: string,
): Result<{ url: URL; domain: AllowedDomain }> => {
  let url: URL;
  try {
    url = new URL(input);
  } catch {
    return err(new Error('有効なURLを入力してください'));
  }

  // HTTPS のみ許可
  if (url.protocol !== 'https:') {
    return err(new Error('HTTPS URLのみ対応しています'));
  }

  // ローカルホスト・プライベートIPをブロック
  if (BLOCKED_HOSTNAMES.includes(url.hostname)) {
    return err(new Error('このURLには対応していません'));
  }

  // プライベートIPレンジをブロック（10.x, 172.16-31.x, 192.168.x）
  const ipMatch = url.hostname.match(/^(\d+)\.(\d+)\.(\d+)\.(\d+)$/);
  if (ipMatch) {
    const parts = ipMatch.map(Number);
    const a = parts[1];
    const b = parts[2];
    if (
      a === 10 ||
      (a === 172 && b !== undefined && b >= 16 && b <= 31) ||
      (a === 192 && b === 168)
    ) {
      return err(new Error('このURLには対応していません'));
    }
  }

  // ホワイトリスト検証
  const matchedDomain = ALLOWED_DOMAINS.find(
    (domain) => url.hostname === domain || url.hostname.endsWith(`.${domain}`),
  );

  if (!matchedDomain) {
    return err(new Error(`対応サイト: ${ALLOWED_DOMAINS.join(', ')}`));
  }

  return ok({ url, domain: matchedDomain });
};
