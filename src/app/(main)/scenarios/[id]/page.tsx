import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { isNil } from 'ramda';

import { getScenarioById } from '../adapter';
import * as styles from './styles';

import { Button } from '@/components/elements/button/button';
import { formatPlayerCount, formatPlaytime } from '@/lib/formatters';

export const metadata = {
  title: 'シナリオ詳細',
  description: 'シナリオの詳細情報',
};

type PageProps = {
  params: Promise<{ id: string }>;
};

export default async function ScenarioDetailPage({ params }: PageProps) {
  const { id } = await params;
  const result = await getScenarioById(id);

  if (!result.success || isNil(result.data)) {
    notFound();
  }

  const scenario = result.data;
  const tags = scenario.scenarioTags.map((st) => st.tag);

  return (
    <main className={styles.pageContainer}>
      <div className={styles.header}>
        <Link href="/scenarios">
          <Button variant="ghost">← シナリオ一覧に戻る</Button>
        </Link>
      </div>

      <article className={styles.article}>
        {/* サムネイル */}
        <div className={styles.thumbnailSection}>
          {!isNil(scenario.scenarioImageUrl) ? (
            <div className={styles.thumbnail}>
              <Image
                src={scenario.scenarioImageUrl}
                alt={scenario.name}
                fill
                sizes="(max-width: 768px) 100vw, 400px"
                style={{ objectFit: 'cover' }}
              />
            </div>
          ) : (
            <div className={styles.thumbnailPlaceholder}>No Image</div>
          )}
        </div>

        {/* 情報セクション */}
        <div className={styles.infoSection}>
          {/* システム名 */}
          <span className={styles.system}>{scenario.system.name}</span>

          {/* シナリオ名 */}
          <h1 className={styles.title}>{scenario.name}</h1>

          {/* 作者 */}
          {!isNil(scenario.author) && (
            <p className={styles.author}>作者: {scenario.author}</p>
          )}

          {/* メタ情報 */}
          <div className={styles.metaGrid}>
            <div className={styles.metaItem}>
              <span className={styles.metaLabel}>プレイ人数</span>
              <span className={styles.metaValue}>
                {formatPlayerCount(scenario.minPlayer, scenario.maxPlayer)}
              </span>
            </div>
            <div className={styles.metaItem}>
              <span className={styles.metaLabel}>プレイ時間</span>
              <span className={styles.metaValue}>
                {formatPlaytime(scenario.minPlaytime, scenario.maxPlaytime)}
              </span>
            </div>
            <div className={styles.metaItem}>
              <span className={styles.metaLabel}>ハンドアウト</span>
              <span className={styles.metaValue}>
                {scenario.handoutType === 'NONE' && 'なし'}
                {scenario.handoutType === 'PUBLIC' && '公開'}
                {scenario.handoutType === 'SECRET' && '秘匿'}
              </span>
            </div>
          </div>

          {/* タグ */}
          {tags.length > 0 && (
            <div className={styles.tags}>
              {tags.map((tag) => (
                <span key={tag.tagId} className={styles.tag}>
                  {tag.name}
                </span>
              ))}
            </div>
          )}

          {/* 概要 */}
          {!isNil(scenario.description) && (
            <div className={styles.descriptionSection}>
              <h2 className={styles.sectionTitle}>概要</h2>
              <p className={styles.description}>{scenario.description}</p>
            </div>
          )}

          {/* 配布URL */}
          {!isNil(scenario.distributeUrl) && (
            <div className={styles.linkSection}>
              <h2 className={styles.sectionTitle}>配布ページ</h2>
              <a
                href={scenario.distributeUrl}
                target="_blank"
                rel="noopener noreferrer"
                className={styles.externalLink}
              >
                {scenario.distributeUrl}
              </a>
            </div>
          )}

          {/* アクションボタン */}
          <div className={styles.actions}>
            <Link
              href={
                `/sessions/new?scenarioId=${scenario.scenarioId}` as '/sessions/new'
              }
            >
              <Button status="primary">このシナリオでセッションを作成</Button>
            </Link>
          </div>
        </div>
      </article>
    </main>
  );
}
