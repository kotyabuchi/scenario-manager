'use client';

import { useMemo, useOptimistic, useState, useTransition } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Chat, PaperPlaneTilt, Seal } from '@phosphor-icons/react/ssr';

import { createCommentAction } from '../../actions';
import { type CommentFormValues, commentFormSchema } from '../schema';
import * as styles from './styles';

import { Avatar } from '@/components/elements/avatar';
import { Button } from '@/components/elements/button/button';
import { FieldError } from '@/components/elements/field-error/field-error';
import { Textarea } from '@/components/elements/textarea';
import { useAuth } from '@/context';
import { formatRelativeTime } from '@/lib/formatters';

import type { CommentWithUser } from '../../interface';

type CommentSectionProps = {
  feedbackId: string;
  comments: CommentWithUser[];
  isLoggedIn: boolean;
};

type SortOrder = 'oldest' | 'newest';

export const CommentSection = ({
  feedbackId,
  comments,
  isLoggedIn,
}: CommentSectionProps) => {
  const { user } = useAuth();
  const [isPending, startTransition] = useTransition();
  const [sortOrder, setSortOrder] = useState<SortOrder>('newest');
  const [submitError, setSubmitError] = useState<string | null>(null);

  const [optimisticComments, addOptimisticComment] = useOptimistic(
    comments,
    (current: CommentWithUser[], newComment: CommentWithUser) => [
      ...current,
      newComment,
    ],
  );

  const sortedComments = useMemo(() => {
    if (sortOrder === 'oldest') return optimisticComments;
    return [...optimisticComments].reverse();
  }, [optimisticComments, sortOrder]);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CommentFormValues>({
    resolver: zodResolver(commentFormSchema),
    defaultValues: {
      content: '',
    },
  });

  const onSubmit = (data: CommentFormValues) => {
    setSubmitError(null);

    // 楽観的更新: 即座にUIにコメントを表示
    addOptimisticComment({
      commentId: `temp-${Date.now()}`,
      feedbackId,
      userId: user?.userId ?? '',
      content: data.content,
      isOfficial: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      user: {
        userId: user?.userId ?? '',
        nickname: user?.nickname ?? '',
        image: user?.avatar ?? null,
      },
    });

    startTransition(async () => {
      const result = await createCommentAction(feedbackId, data.content);
      if (result.success) {
        reset();
      } else {
        setSubmitError(result.error.message);
      }
    });
  };

  return (
    <section
      className={styles.commentSection}
      aria-labelledby="comment-heading"
    >
      <div className={styles.commentSection_header}>
        <h2 id="comment-heading" className={styles.commentSection_title}>
          <Chat size={20} />
          コメント{' '}
          <span className={styles.commentSection_titleCount}>
            ({optimisticComments.length}件)
          </span>
        </h2>
        {optimisticComments.length >= 2 && (
          <div className={styles.commentSection_sortTabs}>
            <button
              type="button"
              className={styles.commentSection_sortTab({
                isActive: sortOrder === 'newest',
              })}
              onClick={() => setSortOrder('newest')}
            >
              新しい順
            </button>
            <button
              type="button"
              className={styles.commentSection_sortTab({
                isActive: sortOrder === 'oldest',
              })}
              onClick={() => setSortOrder('oldest')}
            >
              古い順
            </button>
          </div>
        )}
      </div>

      {/* コメント投稿フォーム */}
      {isLoggedIn && (
        <div className={styles.commentFormCard}>
          <form
            onSubmit={handleSubmit(onSubmit)}
            className={styles.commentForm}
          >
            <div className={styles.commentForm_avatarWrapper}>
              <Avatar
                {...(user?.avatar ? { src: user.avatar } : {})}
                {...(user?.nickname ? { alt: user.nickname } : {})}
                size="md"
              />
            </div>
            <div className={styles.commentForm_body}>
              <Textarea
                {...register('content')}
                placeholder="議論に参加したり、応援コメントを書きましょう..."
                maxLength={1000}
              />
              <FieldError error={errors.content} />
              {submitError && (
                <p className={styles.commentForm_error} role="alert">
                  {submitError}
                </p>
              )}
              <div className={styles.commentForm_actions}>
                <Button
                  type="submit"
                  status="primary"
                  size="sm"
                  disabled={isPending}
                  loading={isPending}
                  loadingText="送信中..."
                >
                  コメントする
                  <PaperPlaneTilt size={16} weight="fill" />
                </Button>
              </div>
            </div>
          </form>
        </div>
      )}

      {/* コメント一覧 */}
      {optimisticComments.length === 0 ? (
        <p className={styles.emptyComments}>まだコメントはありません</p>
      ) : (
        <div className={styles.commentList}>
          {sortedComments.map((comment) => (
            <div
              key={comment.commentId}
              className={
                comment.isOfficial
                  ? styles.commentCard_official
                  : styles.commentCard
              }
            >
              <div className={styles.commentCard_inner}>
                <Avatar
                  {...(comment.user.image ? { src: comment.user.image } : {})}
                  alt={comment.user.nickname}
                  size="md"
                />
                <div className={styles.commentCard_body}>
                  <div className={styles.commentCard_header}>
                    <span className={styles.commentCard_nickname}>
                      {comment.isOfficial
                        ? '運営チーム'
                        : comment.user.nickname}
                    </span>
                    {comment.isOfficial && (
                      <span className={styles.commentCard_officialBadge}>
                        <Seal size={10} weight="fill" />
                        Official
                      </span>
                    )}
                    <span className={styles.commentCard_date}>
                      {formatRelativeTime(comment.createdAt)}
                    </span>
                  </div>
                  <p className={styles.commentCard_content}>
                    {comment.content}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
};
