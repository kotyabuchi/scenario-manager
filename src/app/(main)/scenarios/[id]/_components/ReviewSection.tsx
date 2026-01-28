'use client';

import { useEffect, useState } from 'react';
import { ChevronDown, FileText, Sparkles, Star } from 'lucide-react';
import Image from 'next/image';
import { isNil } from 'ramda';

import * as styles from './styles';

import { Button } from '@/components/elements/button/button';

import type { ReviewSortOption, ReviewWithUser } from '../interface';

type ReviewSectionProps = {
  reviews: ReviewWithUser[];
  totalCount: number;
  currentUserId?: string;
  scenarioId: string;
  isPlayed: boolean;
};

const STORAGE_KEY_PREFIX = 'hiddenReviews_';

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
          fill={star <= rating ? 'currentColor' : 'none'}
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
  onHide,
  onShow,
}: {
  review: ReviewWithUser;
  isOwner: boolean;
  isHidden: boolean;
  showHidden: boolean;
  onHide: () => void;
  onShow: () => void;
}) => {
  const [isSpoilerExpanded, setIsSpoilerExpanded] = useState(false);

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
                  style={{ objectFit: 'cover' }}
                />
              </div>
            ) : (
              <div className={styles.reviewCard_avatarPlaceholder}>
                {review.user.nickname.charAt(0)}
              </div>
            )}
            <span className={styles.reviewCard_userName}>
              {review.user.nickname}
            </span>
            <span className={styles.reviewCard_handle}>
              @{review.user.userName}
            </span>
            <span className={styles.reviewCard_date}>
              {formatDate(review.createdAt)}
            </span>
          </div>

          {/* コメント本文 */}
          <div className={styles.reviewCard_content}>
            {/* 公開コメント */}
            {!isNil(review.openComment) && (
              <>
                <span className={styles.reviewCard_commentLabel}>
                  【公開コメント】
                </span>
                <p className={styles.reviewCard_commentText}>
                  {review.openComment}
                </p>
              </>
            )}

            {/* ネタバレコメント */}
            {!isNil(review.spoilerComment) && (
              <>
                <span className={styles.reviewCard_commentLabel}>
                  【ネタバレコメント】
                </span>
                <button
                  type="button"
                  className={styles.reviewCard_spoilerToggle}
                  onClick={() => setIsSpoilerExpanded(!isSpoilerExpanded)}
                >
                  <ChevronDown size={14} />
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

  // ソート済みレビュー
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
      {/* ヘッダー */}
      <div className={styles.reviewsHeader}>
        <h2 className={styles.section_title}>レビュー（{totalCount}件）</h2>
        <div className={styles.reviewsControls}>
          <button
            type="button"
            className={styles.reviewsSort}
            onClick={() => {
              // 簡易トグル（本来はドロップダウン）
              const options: ReviewSortOption[] = [
                'newest',
                'rating_high',
                'rating_low',
              ];
              const currentIndex = options.indexOf(sortOption);
              const nextIndex = (currentIndex + 1) % options.length;
              const nextOption = options[nextIndex];
              if (nextOption) {
                setSortOption(nextOption);
              }
            }}
          >
            <span>
              {sortOption === 'newest' && '新着順'}
              {sortOption === 'rating_high' && '高評価順'}
              {sortOption === 'rating_low' && '低評価順'}
            </span>
            <ChevronDown size={16} />
          </button>

          <label className={styles.reviewsHiddenToggle}>
            <input
              type="checkbox"
              checked={showHidden}
              onChange={(e) => setShowHidden(e.target.checked)}
            />
            <span>非表示コメントを表示</span>
          </label>
        </div>
      </div>

      {/* レビュー一覧 */}
      {sortedReviews.length === 0 ? (
        <div className={styles.section_empty}>
          {isPlayed ? (
            <>
              <p className={styles.section_emptyText}>
                <Sparkles size={16} />
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
          {sortedReviews.map((review) => (
            <ReviewCard
              key={review.userReviewId}
              review={review}
              isOwner={currentUserId === review.userId}
              isHidden={hiddenReviewIds.has(review.userReviewId)}
              showHidden={showHidden}
              onHide={() => handleHideReview(review.userReviewId)}
              onShow={() => handleShowReview(review.userReviewId)}
            />
          ))}
        </div>
      )}

      {/* もっと見るボタン（今後のページネーション用） */}
      {totalCount > reviews.length && (
        <div className={styles.loadMore}>
          <Button variant="subtle">
            もっと見る <ChevronDown size={16} />
          </Button>
        </div>
      )}
    </section>
  );
};
