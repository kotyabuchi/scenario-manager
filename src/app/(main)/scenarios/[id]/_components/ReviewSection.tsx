'use client';

import { useEffect, useState } from 'react';
import {
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  Eye,
  EyeOff,
  FileText,
  Pencil,
  Plus,
  Sparkles,
  Star,
} from 'lucide-react';
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
const formatDate = (date: Date): string => {
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
          size={14}
          fill={star <= rating ? 'currentColor' : 'none'}
          style={{ opacity: star <= rating ? 1 : 0.3 }}
        />
      ))}
    </div>
  );
};

/**
 * レビューカード
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
      {/* ヘッダー */}
      <div className={styles.reviewCard_header}>
        <div className={styles.reviewCard_user}>
          {!isNil(review.user.image) ? (
            <div className={styles.reviewCard_avatar}>
              <Image
                src={review.user.image}
                alt={review.user.nickname}
                width={40}
                height={40}
                style={{ objectFit: 'cover' }}
              />
            </div>
          ) : (
            <div className={styles.reviewCard_avatarPlaceholder}>
              {review.user.nickname.charAt(0)}
            </div>
          )}
          <div className={styles.reviewCard_userInfo}>
            <span className={styles.reviewCard_nickname}>
              {review.user.nickname}
            </span>
            <span className={styles.reviewCard_username}>
              @{review.user.userName}
            </span>
          </div>
        </div>
        <div className={styles.reviewCard_actions}>
          {isOwner ? (
            <button
              type="button"
              className={styles.reviewCard_actionButton}
              aria-label="編集"
            >
              <Pencil size={16} />
            </button>
          ) : isHidden ? (
            <button
              type="button"
              className={styles.reviewCard_actionButton}
              onClick={onShow}
              aria-label="再表示"
            >
              <Eye size={16} />
            </button>
          ) : (
            <button
              type="button"
              className={styles.reviewCard_actionButton}
              onClick={onHide}
              aria-label="非表示"
            >
              <EyeOff size={16} />
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
          {/* 評価・日時 */}
          <div className={styles.reviewCard_rating}>
            <StarRating rating={review.rating} />
            {!isNil(review.rating) && (
              <span className={styles.reviewCard_ratingValue}>
                {review.rating.toFixed(1)}
              </span>
            )}
            <span className={styles.reviewCard_date}>
              {formatDate(review.createdAt)}
            </span>
          </div>

          {/* 公開コメント */}
          {!isNil(review.openComment) && (
            <p className={styles.reviewCard_openComment}>
              {review.openComment}
            </p>
          )}

          {/* ネタバレコメント */}
          {!isNil(review.spoilerComment) && (
            <div className={styles.reviewCard_spoiler}>
              <button
                type="button"
                className={styles.reviewCard_spoilerToggle}
                onClick={() => setIsSpoilerExpanded(!isSpoilerExpanded)}
              >
                <AlertTriangle size={14} />
                <span>
                  {isSpoilerExpanded
                    ? 'ネタバレを含む感想'
                    : 'ネタバレを含む感想を表示'}
                </span>
                {isSpoilerExpanded ? (
                  <ChevronUp size={14} />
                ) : (
                  <ChevronDown size={14} />
                )}
              </button>
              {isSpoilerExpanded && (
                <p className={styles.reviewCard_spoilerContent}>
                  {review.spoilerComment}
                </p>
              )}
            </div>
          )}
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
    <section className={styles.section}>
      <div className={styles.section_header}>
        <h2 className={styles.section_title}>
          レビュー
          <span className={styles.section_count}>({totalCount}件)</span>
        </h2>
        {isPlayed && sortedReviews.length > 0 && (
          <div className={styles.section_headerActions}>
            <button type="button" className={styles.section_actionButton}>
              <Plus size={14} />
              レビューを書く
            </button>
          </div>
        )}
      </div>

      {/* フィルタパネル */}
      <div className={styles.reviewFilter}>
        <label className={styles.reviewFilter_label}>
          ソート:
          <select
            className={styles.reviewFilter_select}
            value={sortOption}
            onChange={(e) => setSortOption(e.target.value as ReviewSortOption)}
          >
            <option value="newest">新着順</option>
            <option value="rating_high">高評価順</option>
            <option value="rating_low">低評価順</option>
          </select>
        </label>
        <label className={styles.reviewFilter_toggle}>
          <input
            type="checkbox"
            checked={showHidden}
            onChange={(e) => setShowHidden(e.target.checked)}
          />
          <span>非表示コメントを表示</span>
        </label>
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
          <Button variant="outline">もっと見る</Button>
        </div>
      )}
    </section>
  );
};
