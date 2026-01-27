import { err, ok, type Result } from '@/types/result';

/**
 * レートリミットのチェック結果
 */
type RateLimitResult = {
  allowed: boolean;
  exempt?: boolean;
  reason?: string;
  message?: string;
};

/**
 * レートリミットのチェックパラメータ
 */
type RateLimitParams = {
  userId: string;
  action: string;
  userRole?: string;
};

/**
 * レートリミット設定
 */
const RATE_LIMITS: Record<string, { maxActions: number; windowMs: number }> = {
  create_scenario: { maxActions: 5, windowMs: 60 * 60 * 1000 }, // 1時間に5件
  create_session: { maxActions: 10, windowMs: 60 * 60 * 1000 }, // 1時間に10件
};

/**
 * アクションの履歴を保持するメモリストア
 * 本番環境ではRedisなどの永続化ストアに置き換えることを推奨
 */
const actionHistory = new Map<
  string,
  { timestamp: number; action: string }[]
>();

/**
 * ユーザーのアクション実行回数をチェック
 */
export const checkRateLimit = async (
  params: RateLimitParams,
): Promise<Result<RateLimitResult>> => {
  try {
    const { userId, action, userRole } = params;

    // MODERATORはレートリミット対象外
    if (userRole === 'MODERATOR') {
      return ok({
        allowed: true,
        exempt: true,
        reason: 'MODERATOR_EXEMPT',
      });
    }

    // レートリミット設定を取得
    const limit = RATE_LIMITS[action];
    if (!limit) {
      // 設定がない場合は制限なし
      return ok({ allowed: true });
    }

    const now = Date.now();
    const key = `${userId}:${action}`;

    // 履歴を取得
    const history = actionHistory.get(key) ?? [];

    // 期限切れのエントリを削除
    const validHistory = history.filter(
      (entry) => now - entry.timestamp < limit.windowMs,
    );

    // レートリミットチェック
    if (validHistory.length >= limit.maxActions) {
      return ok({
        allowed: false,
        reason: 'RATE_LIMIT_EXCEEDED',
        message: 'しばらく時間をおいてから再度お試しください',
      });
    }

    // 履歴に追加
    validHistory.push({ timestamp: now, action });
    actionHistory.set(key, validHistory);

    return ok({ allowed: true });
  } catch (e) {
    return err(
      e instanceof Error
        ? e
        : new Error('レートリミットのチェックに失敗しました'),
    );
  }
};
