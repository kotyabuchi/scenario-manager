import { configure, getConsoleSink, getLogger } from '@logtape/logtape';

let configured = false;

/**
 * LogTapeを初期化する（アプリ起動時に1回だけ呼ぶ）
 * Edge Runtime互換（Node.js API不使用）
 */
export const setupLogger = async () => {
  if (configured) return;
  configured = true;

  const isProduction = process.env.NODE_ENV === 'production';

  await configure({
    sinks: {
      console: getConsoleSink(),
    },
    loggers: [
      {
        category: ['app'],
        lowestLevel: isProduction ? 'warning' : 'debug',
        sinks: ['console'],
      },
    ],
  });
};

/**
 * ロガーを取得する
 * @param category - カテゴリ配列（例: ['app', 'auth']）
 */
export const getAppLogger = (category: string[]) => getLogger(category);
