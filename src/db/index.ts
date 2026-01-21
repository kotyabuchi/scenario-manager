import { getCloudflareContext } from '@opennextjs/cloudflare';
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';

import * as schema from './schema';

/**
 * Cloudflare Hyperdrive を使用したDB接続
 *
 * Hyperdriveは接続プーリングとクエリキャッシングを提供し、
 * 毎回コネクションを作成するオーバーヘッドを削減する
 *
 * @see https://developers.cloudflare.com/hyperdrive/
 */
export const getDb = () => {
  let connectionString: string;
  let isCloudflare = false;

  try {
    // Cloudflare Workers環境: Hyperdriveバインディングから接続文字列を取得
    const { env } = getCloudflareContext();
    connectionString = (env as { HYPERDRIVE?: { connectionString: string } })
      .HYPERDRIVE?.connectionString as string;

    if (!connectionString) {
      throw new Error('HYPERDRIVE binding not found');
    }
    isCloudflare = true;
  } catch {
    // ローカル開発環境: 環境変数から接続文字列を取得
    connectionString = process.env.DATABASE_URL ?? '';
    isCloudflare = false;
  }

  const client = postgres(connectionString, {
    // 環境別の接続プール設定
    max: isCloudflare ? 5 : 10,
    // 配列型を使用しない場合、追加のラウンドトリップを回避
    fetch_types: false,
    // Cloudflare(Hyperdrive)ではprepare有効、開発環境(pgbouncer)では無効
    prepare: isCloudflare,
    // 開発環境のみ: アイドル接続のタイムアウトと最大生存時間を設定
    ...(isCloudflare
      ? {}
      : {
          idle_timeout: 20,
          max_lifetime: 60 * 30,
        }),
  });

  return drizzle({ client, schema });
};

// 後方互換性のため残すが、Cloudflare Workers環境では getDb() を使用すること
// ローカル開発やビルド時にはこちらが使われる
export const db = getDb();
