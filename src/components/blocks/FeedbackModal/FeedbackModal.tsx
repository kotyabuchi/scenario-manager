'use client';

import { useEffect, useRef, useState, useTransition } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  ArrowRight,
  Camera,
  Info,
  Lightbulb,
  PaperPlaneTilt,
} from '@phosphor-icons/react/ssr';
import Link from 'next/link';
import { isNil } from 'ramda';

import {
  checkRateLimitAction,
  createFeedbackAction,
  updateFeedbackAction,
} from './actions';
import { type FeedbackFormValues, feedbackFormSchema } from './schema';
import * as styles from './styles';

import { Button } from '@/components/elements/button/button';
import { FieldError } from '@/components/elements/field-error/field-error';
import { Input } from '@/components/elements/input';
import { Modal } from '@/components/elements/modal';
import { Radio } from '@/components/elements/radio';
import { Textarea } from '@/components/elements/textarea';
import { FeedbackCategories } from '@/db/enum';

import type { Route } from 'next';

const TITLE_PLACEHOLDERS: Record<string, string> = {
  [FeedbackCategories.BUG.value]: 'どんなことが起きましたか？',
  [FeedbackCategories.FEATURE.value]: 'どんな機能があると嬉しいですか？',
  [FeedbackCategories.UI_UX.value]: 'どこが使いづらいと感じましたか？',
  [FeedbackCategories.OTHER.value]: 'どんなことでもお気軽にどうぞ',
};

const DESCRIPTION_PLACEHOLDERS: Record<string, string> = {
  [FeedbackCategories.BUG.value]: '詳しく教えていただけると助かります',
  [FeedbackCategories.FEATURE.value]: 'どんな場面で使いたいか教えてください',
  [FeedbackCategories.UI_UX.value]: '改善のアイデアがあれば教えてください',
  [FeedbackCategories.OTHER.value]: '自由にお書きください',
};

const SHOW_SCREENSHOT: Record<string, boolean> = {
  [FeedbackCategories.BUG.value]: true,
  [FeedbackCategories.FEATURE.value]: false,
  [FeedbackCategories.UI_UX.value]: true,
  [FeedbackCategories.OTHER.value]: false,
};

type EditTarget = {
  feedbackId: string;
  category: FeedbackFormValues['category'];
  title: string;
  description: string;
};

type FeedbackModalProps = {
  open: boolean;
  onOpenChange: (details: { open: boolean }) => void;
  editTarget?: EditTarget;
};

export const FeedbackModal = ({
  open,
  onOpenChange,
  editTarget,
}: FeedbackModalProps) => {
  const isEditMode = !isNil(editTarget);
  const [isPending, startTransition] = useTransition();
  const [serverError, setServerError] = useState<string | null>(null);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isRateLimited, setIsRateLimited] = useState(false);
  const successTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // モーダル表示時にレート制限チェック（新規作成時のみ）
  useEffect(() => {
    if (!open || isEditMode) return;
    const check = async () => {
      try {
        const result = await checkRateLimitAction();
        if (result.success && result.data.isLimited) {
          setIsRateLimited(true);
        } else {
          setIsRateLimited(false);
        }
      } catch {
        // レート制限チェック失敗時はレート制限なしとして動作継続
        setIsRateLimited(false);
      }
    };
    check();
  }, [open, isEditMode]);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors },
  } = useForm<FeedbackFormValues>({
    resolver: zodResolver(feedbackFormSchema),
    defaultValues: {
      category: FeedbackCategories.BUG.value,
      title: '',
      description: '',
    },
  });

  // reset を ref で安定化し、依存配列から除外して無限ループリスクを回避
  const resetRef = useRef(reset);
  resetRef.current = reset;

  // 編集モード: editTarget 変更時にフォームを初期値にリセット
  useEffect(() => {
    if (editTarget) {
      resetRef.current({
        category: editTarget.category,
        title: editTarget.title,
        description: editTarget.description,
      });
    }
  }, [editTarget]);

  const selectedCategory = watch('category');

  const handleCategoryChange = (details: { value: string | null }) => {
    if (!isNil(details.value)) {
      setValue('category', details.value as FeedbackFormValues['category']);
    }
  };

  const handleSuccess = () => {
    setIsSubmitted(true);
    reset();
    if (successTimerRef.current) clearTimeout(successTimerRef.current);
    successTimerRef.current = setTimeout(() => {
      setIsSubmitted(false);
      onOpenChange({ open: false });
    }, 2000);
  };

  const onSubmit = (data: FeedbackFormValues) => {
    setServerError(null);

    startTransition(async () => {
      if (isEditMode) {
        const result = await updateFeedbackAction(editTarget.feedbackId, data);

        if (!result.success) {
          setServerError(result.error?.message ?? '更新に失敗しました');
        } else {
          handleSuccess();
        }
      } else {
        const browserInfo =
          typeof window !== 'undefined'
            ? `${navigator.userAgent} | ${window.innerWidth}x${window.innerHeight}`
            : undefined;
        const pageUrl =
          typeof window !== 'undefined' ? window.location.href : undefined;

        const result = await createFeedbackAction({
          ...data,
          pageUrl,
          browserInfo,
        });

        if (!result.success) {
          setServerError(result.error?.message ?? '送信に失敗しました');
        } else {
          handleSuccess();
        }
      }
    });
  };

  const handleClose = () => {
    if (successTimerRef.current) clearTimeout(successTimerRef.current);
    reset();
    setServerError(null);
    setIsSubmitted(false);
    onOpenChange({ open: false });
  };

  const footer =
    isSubmitted || isRateLimited ? null : (
      <>
        <Button
          type="button"
          variant="outline"
          status="primary"
          onClick={handleClose}
        >
          キャンセル
        </Button>
        <Button
          type="submit"
          status="primary"
          disabled={isPending}
          loading={isPending}
          loadingText={isEditMode ? '更新中...' : '送信中...'}
          form="feedback-form"
        >
          <PaperPlaneTilt size={16} weight="fill" />
          {isEditMode ? '更新する' : '送信する'}
        </Button>
      </>
    );

  return (
    <Modal
      open={open}
      onOpenChange={onOpenChange}
      title={isEditMode ? 'フィードバックを編集' : 'フィードバックを送る'}
      footer={footer}
    >
      {isRateLimited ? (
        <output className={styles.successMessage}>
          <p>1日のフィードバック投稿上限（10件）に達しました。</p>
          <p>明日またお試しください。</p>
          <Link
            href={'/feedback' as Route}
            className={styles.hintLink}
            onClick={handleClose}
          >
            みんなのフィードバックを見る <ArrowRight size={14} aria-hidden />
          </Link>
        </output>
      ) : isSubmitted ? (
        <output className={styles.successMessage}>
          {isEditMode ? (
            <p>フィードバックを更新しました。</p>
          ) : (
            <>
              <p>ご意見・ご要望をお送りいただきありがとうございます。</p>
              <p>より良いサービス作りに役立てさせていただきます。</p>
            </>
          )}
        </output>
      ) : (
        <form
          id="feedback-form"
          onSubmit={handleSubmit(onSubmit)}
          className={styles.form}
        >
          {!isNil(serverError) && (
            <div className={styles.serverError}>{serverError}</div>
          )}

          {/* 種類 */}
          <div className={styles.field}>
            <span className={styles.label}>種類</span>
            <Radio
              value={selectedCategory}
              onValueChange={handleCategoryChange}
              name="category"
              className={styles.radioGroup}
            >
              {Object.values(FeedbackCategories).map((category) => (
                <Radio.Item key={category.value} value={category.value}>
                  {category.label}
                </Radio.Item>
              ))}
            </Radio>
            <FieldError error={errors.category} />
          </div>

          {/* タイトル */}
          <div className={styles.field}>
            <label htmlFor="feedback-title" className={styles.label}>
              タイトル
              <span className={styles.required}>*</span>
            </label>
            <Input
              type="text"
              id="feedback-title"
              {...register('title')}
              placeholder={TITLE_PLACEHOLDERS[selectedCategory]}
              maxLength={100}
            />
            <FieldError error={errors.title} />
          </div>

          {/* 詳細 */}
          <div className={styles.field}>
            <label htmlFor="feedback-description" className={styles.label}>
              詳細
              <span className={styles.required}>*</span>
            </label>
            <Textarea
              id="feedback-description"
              {...register('description')}
              placeholder={DESCRIPTION_PLACEHOLDERS[selectedCategory]}
              maxLength={2000}
            />
            <FieldError error={errors.description} />
          </div>

          {/* 新規作成時のみ表示する要素 */}
          {!isEditMode && (
            <>
              {/* スクリーンショット添付 */}
              {SHOW_SCREENSHOT[selectedCategory] && (
                <div>
                  <Button
                    type="button"
                    variant="subtle"
                    status="primary"
                    size="sm"
                  >
                    <Camera size={16} />
                    スクリーンショットを添付
                  </Button>
                </div>
              )}

              {/* ヒントボックス */}
              <div className={styles.hintBox}>
                <div className={styles.hintRow}>
                  <Lightbulb
                    size={16}
                    weight="fill"
                    className={styles.hintIcon}
                  />
                  <span className={styles.hintText}>
                    似た声がないか覗いてみませんか？
                  </span>
                </div>
                <div className={styles.hintRow}>
                  <span className={styles.hintSpacer} />
                  <Link
                    href={'/feedback' as Route}
                    className={styles.hintLink}
                    onClick={handleClose}
                  >
                    みんなのフィードバックを見る{' '}
                    <ArrowRight size={14} aria-hidden />
                  </Link>
                </div>
              </div>

              {/* メタ情報 */}
              <div className={styles.noticeRow}>
                <Info size={14} className={styles.noticeIcon} />
                <span className={styles.noticeText}>
                  現在のページURLやブラウザの情報が自動で送信されます
                </span>
              </div>
            </>
          )}
        </form>
      )}
    </Modal>
  );
};
