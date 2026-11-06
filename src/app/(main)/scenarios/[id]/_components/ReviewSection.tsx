'use client';

import { Fragment, useEffect, useState } from 'react';
import {
  ArrowsDownUp,
  CaretDown,
  FileText,
  Sparkle,
  Star,
} from '@phosphor-icons/react/ssr';
import Image from 'next/image';
import Link from 'next/link';
import { isNil } from 'ramda';

import * as styles from './styles';

import { Button } from '@/components/elements/button/button';
import { Select } from '@/components/elements/select';
import { Switch } from '@/components/elements/switch';

import type { ReviewSortOption, ReviewWithUser } from '../interface';

type ReviewSectionProps = {
  reviews: ReviewWithUser[];
  totalCount: number;
  currentUserId?: string;
  scenarioId: string;
  isPlayed: boolean;
};

const STORAGE_KEY_PREFIX = 'hiddenReviews_';

// 並び順の選択肢（Select用）
const REVIEW_SORT_ITEMS: { label: string; value: ReviewSortOption }[] = [
  { label: '新着順', value: 'newest' },
  { label: '高評価順', value: 'rating_high' },
  { label: '低評価順', value: 'rating_low' },
];

const isReviewSortOption = (value: string): value is ReviewSortOption =>
  REVIEW_SORT_ITEMS.some((item) => item.value === value);

/**
 * 日付をフォーマットする
 */
const formatDate = (date: string): string => {
  return new Intl.DateTimeFormat('ja-JP', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date(date));
};

/**
 * 星評価を表示する
 */
const StarRating = ({ rating }: { rating: number | null }) => {
  if (isNil(rating)) return null;

  return (
    <div className={styles.reviewCard_stars}>
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          size={16}
          weight={star <= rating ? 'fill' : 'regular'}
          className={star <= rating ? '' : styles.reviewCard_starEmpty}
        />
      ))}
    </div>
  );
};

/**
 * レビューカード（Pencil準拠）
 */
const ReviewCard = ({
  review,
  isOwner,
  isHidden,
  showHidden,
  isSpoilerExpanded,
  onToggleSpoiler,
  onHide,
  onShow,
}: {
  review: ReviewWithUser;
  isOwner: boolean;
  isHidden: boolean;
  showHidden: boolean;
  isSpoilerExpanded: boolean;
  onToggleSpoiler: () => void;
  onHide: () => void;
  onShow: () => void;
}) => {
  // 非表示状態で、非表示コメント表示がOFFの場合は表示しない
  if (isHidden && !showHidden) {
    return null;
  }

  return (
    <div
      className={`${styles.reviewCard} ${isHidden ? styles.reviewCard_hidden : ''}`}
    >
      {/* ヘッダー: 星評価 + アクション */}
      <div className={styles.reviewCard_header}>
        <div className={styles.reviewCard_left}>
          <StarRating rating={review.rating} />
          {!isNil(review.rating) && (
            <span className={styles.reviewCard_ratingValue}>
              {review.rating.toFixed(1)}
            </span>
          )}
        </div>
        <div className={styles.reviewCard_actions}>
          {isOwner ? (
            <button type="button" className={styles.reviewCard_actionText}>
              編集
            </button>
          ) : isHidden ? (
            <button
              type="button"
              className={styles.reviewCard_actionText}
              onClick={onShow}
            >
              再表示
            </button>
          ) : (
            <button
              type="button"
              className={styles.reviewCard_actionText}
              onClick={onHide}
            >
              非表示
            </button>
          )}
        </div>
      </div>

      {/* 非表示状態の場合 */}
      {isHidden ? (
        <p className={styles.reviewCard_hiddenMessage}>
          このコメントは非表示中です
        </p>
      ) : (
        <>
          {/* ユーザー情報 */}
          <div className={styles.reviewCard_userInfo}>
            {!isNil(review.user.image) ? (
              <div className={styles.reviewCard_avatar}>
                <Image
                  src={review.user.image}
                  alt={review.user.nickname}
                  width={32}
                  height={32}
                  className={styles.review_avatarImage}
                />
              </div>
            ) : (
              <div className={styles.reviewCard_avatarPlaceholder}>
                {review.user.nickname.charAt(0)}
              </div>
            )}
            <Link
              href={`/users/${review.user.userId}`}
              className={styles.reviewCard_nameGroup}
            >
              <span>
                <span className={styles.reviewCard_userName}>
                  {review.user.nickname}
                </span>
                <span className={styles.reviewCard_handle}>
                  @{review.user.userName}
                </span>
              </span>
            </Link>
            <span className={styles.reviewCard_date}>
              {formatDate(review.createdAt)}
            </span>
          </div>

          {/* コメント本文 */}
          <div className={styles.reviewCard_content}>
            {/* 公開コメント */}
            {!isNil(review.openComment) && (
              <p className={styles.reviewCard_commentText}>
                {review.openComment}
              </p>
            )}

            {/* ネタバレコメント */}
            {!isNil(review.spoilerComment) && (
              <>
                <button
                  type="button"
                  className={styles.reviewCard_spoilerToggle}
                  data-expanded={isSpoilerExpanded ? '' : undefined}
                  onClick={onToggleSpoiler}
                >
                  <CaretDown size={14} />
                  <span>
                    {isSpoilerExpanded
                      ? 'ネタバレを非表示'
                      : 'ネタバレを表示する'}
                  </span>
                </button>
                {isSpoilerExpanded && (
                  <p className={styles.reviewCard_spoilerContent}>
                    {review.spoilerComment}
                  </p>
                )}
              </>
            )}
          </div>
        </>
      )}
    </div>
  );
};

export const ReviewSection = ({
  reviews,
  totalCount,
  currentUserId,
  scenarioId,
  isPlayed,
}: ReviewSectionProps) => {
  const [sortOption, setSortOption] = useState<ReviewSortOption>('newest');
  const [showHidden, setShowHidden] = useState(false);
  const [hiddenReviewIds, setHiddenReviewIds] = useState<Set<string>>(
    new Set(),
  );
  const [expandedSpoilerIds, setExpandedSpoilerIds] = useState<Set<string>>(
    new Set(),
  );

  const handleToggleSpoiler = (reviewId: string) => {
    setExpandedSpoilerIds((prev) => {
      const next = new Set(prev);
      if (next.has(reviewId)) {
        next.delete(reviewId);
      } else {
        next.add(reviewId);
      }
      return next;
    });
  };

  // localStorageから非表示レビューを読み込む
  useEffect(() => {
    const storageKey = `${STORAGE_KEY_PREFIX}${scenarioId}`;
    const stored = localStorage.getItem(storageKey);
    if (stored) {
      try {
        const parsed = JSON.parse(stored) as string[];
        setHiddenReviewIds(new Set(parsed));
      } catch {
        // パースエラーは無視
      }
    }
  }, [scenarioId]);

  // 非表示レビューをlocalStorageに保存
  const saveHiddenReviews = (ids: Set<string>) => {
    const storageKey = `${STORAGE_KEY_PREFIX}${scenarioId}`;
    localStorage.setItem(storageKey, JSON.stringify([...ids]));
  };

  const handleHideReview = (reviewId: string) => {
    const newIds = new Set([...hiddenReviewIds, reviewId]);
    setHiddenReviewIds(newIds);
    saveHiddenReviews(newIds);
  };

  const handleShowReview = (reviewId: string) => {
    const newIds = new Set(
      [...hiddenReviewIds].filter((id) => id !== reviewId),
    );
    setHiddenReviewIds(newIds);
    saveHiddenReviews(newIds);
  };

  // ソート済み・表示対象のレビュー（非表示中を先に除外し、区切り線の重複を防ぐ）
  const sortedReviews = [...reviews].sort((a, b) => {
    switch (sortOption) {
      case 'newest':
        return (
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
      case 'rating_high':
        return (b.rating ?? 0) - (a.rating ?? 0);
      case 'rating_low':
        return (a.rating ?? 0) - (b.rating ?? 0);
      default:
        return 0;
    }
  });

  return (
    <section id="reviews" className={styles.section}>
      {/* ヘッダー: タイトルと同じ行に非表示コメントSwitch */}
      <div className={styles.reviewsHeader}>
        <h2 className={styles.section_title}>
          コメント
          <span className={styles.section_count}>（{totalCount}件）</span>
        </h2>
        <Switch
          checked={showHidden}
          onCheckedChange={(details) => setShowHidden(details.checked)}
        >
          非表示コメントを表示
        </Switch>
      </div>

      {/* ソート行 */}
      <div className={styles.reviewsControls}>
        <div className={styles.reviewsSort}>
          <Select
            items={REVIEW_SORT_ITEMS}
            value={[sortOption]}
            onValueChange={(details) => {
              const next = details.value[0];
              if (next && isReviewSortOption(next)) {
                setSortOption(next);
              }
            }}
            variant="ghost"
            prefix={<ArrowsDownUp size={16} />}
            aria-label="コメントの並び順"
          />
        </div>
      </div>

      {/* レビュー一覧 */}
      {sortedReviews.length === 0 ? (
        <div className={styles.section_empty}>
          {isPlayed ? (
            <>
              <p className={styles.section_emptyText}>
                <Sparkle size={16} />
                最初のレビュアーになりませんか？あなたの感想を共有してください！
              </p>
              <button type="button" className={styles.section_ctaButton}>
                レビューを書く
              </button>
            </>
          ) : (
            <p className={styles.section_emptyText}>
              <FileText size={16} />
              まだレビューがありません。プレイしたら感想を書いてみましょう！
            </p>
          )}
        </div>
      ) : (
        <div className={styles.reviewList}>
          {sortedReviews
            .filter(
              (review) =>
                showHidden || !hiddenReviewIds.has(review.userReviewId),
            )
            .map((review, index) => (
              <Fragment key={review.userReviewId}>
                {index > 0 && <hr className={styles.listDivider} />}
                <ReviewCard
                  review={review}
                  isOwner={currentUserId === review.userId}
                  isHidden={hiddenReviewIds.has(review.userReviewId)}
                  showHidden={showHidden}
                  isSpoilerExpanded={expandedSpoilerIds.has(
                    review.userReviewId,
                  )}
                  onToggleSpoiler={() =>
                    handleToggleSpoiler(review.userReviewId)
                  }
                  onHide={() => handleHideReview(review.userReviewId)}
                  onShow={() => handleShowReview(review.userReviewId)}
                />
              </Fragment>
            ))}
        </div>
      )}

      {/* もっと見るボタン（今後のページネーション用） */}
      {totalCount > reviews.length && (
        <div className={styles.loadMore}>
          <Button variant="subtle">
            もっと見る <CaretDown size={16} />
          </Button>
        </div>
      )}
    </section>
  );
};
