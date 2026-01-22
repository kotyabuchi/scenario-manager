'use client';

import { useState, useTransition } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { isNil } from 'ramda';

import { createFeedbackAction } from './actions';
import { type FeedbackFormValues, feedbackFormSchema } from './schema';
import * as styles from './styles';

import { Button } from '@/components/elements/button/button';
import { FieldError } from '@/components/elements/field-error/field-error';
import { Modal } from '@/components/elements/modal';
import { FeedbackCategories } from '@/db/enum';

type FeedbackModalProps = {
  open: boolean;
  onOpenChange: (details: { open: boolean }) => void;
};

export const FeedbackModal = ({ open, onOpenChange }: FeedbackModalProps) => {
  const [isPending, startTransition] = useTransition();
  const [serverError, setServerError] = useState<string | null>(null);
  const [isSubmitted, setIsSubmitted] = useState(false);

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

  const selectedCategory = watch('category');

  const handleCategorySelect = (category: string) => {
    setValue('category', category as FeedbackFormValues['category']);
  };

  const onSubmit = (data: FeedbackFormValues) => {
    setServerError(null);

    startTransition(async () => {
      // ブラウザ情報とページURLを取得
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
        setIsSubmitted(true);
        reset();
        // 2秒後にモーダルを閉じる
        setTimeout(() => {
          setIsSubmitted(false);
          onOpenChange({ open: false });
        }, 2000);
      }
    });
  };

  const handleClose = () => {
    reset();
    setServerError(null);
    setIsSubmitted(false);
    onOpenChange({ open: false });
  };

  const footer = isSubmitted ? null : (
    <>
      <Button type="button" variant="ghost" onClick={handleClose}>
        キャンセル
      </Button>
      <Button
        type="submit"
        status="primary"
        disabled={isPending}
        loading={isPending}
        loadingText="送信中..."
        form="feedback-form"
      >
        送信する
      </Button>
    </>
  );

  return (
    <Modal
      open={open}
      onOpenChange={onOpenChange}
      title="フィードバックを送る"
      footer={footer}
    >
      {isSubmitted ? (
        <div className={styles.metaInfo}>
          <p>ご意見・ご要望をお送りいただきありがとうございます。</p>
          <p>より良いサービス作りに役立てさせていただきます。</p>
        </div>
      ) : (
        <form
          id="feedback-form"
          onSubmit={handleSubmit(onSubmit)}
          className={styles.form}
        >
          {!isNil(serverError) && (
            <div className={styles.serverError}>{serverError}</div>
          )}

          {/* カテゴリ選択 */}
          <div className={styles.field}>
            <span className={styles.label}>
              カテゴリ
              <span className={styles.required}>*</span>
            </span>
            <div className={styles.radioGroup}>
              {Object.values(FeedbackCategories).map((category) => (
                <label
                  key={category.value}
                  className={
                    selectedCategory === category.value
                      ? styles.radioLabelSelected
                      : styles.radioLabel
                  }
                >
                  <input
                    type="radio"
                    {...register('category')}
                    value={category.value}
                    className={styles.radioInput}
                    onChange={() => handleCategorySelect(category.value)}
                  />
                  {category.label}
                </label>
              ))}
            </div>
            <FieldError error={errors.category} />
          </div>

          {/* タイトル */}
          <div className={styles.field}>
            <label htmlFor="feedback-title" className={styles.label}>
              タイトル
              <span className={styles.required}>*</span>
            </label>
            <input
              type="text"
              id="feedback-title"
              {...register('title')}
              className={styles.input}
              placeholder="問題や要望を簡潔に"
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
            <textarea
              id="feedback-description"
              {...register('description')}
              className={styles.textarea}
              placeholder="具体的な内容をお書きください。バグの場合は再現手順があると助かります。"
              maxLength={2000}
            />
            <p className={styles.hint}>2000文字以内</p>
            <FieldError error={errors.description} />
          </div>

          {/* メタ情報 */}
          <div className={styles.metaInfo}>
            <span className={styles.metaLabel}>自動収集される情報:</span>
            <span>現在のページURL、ブラウザ情報</span>
          </div>
        </form>
      )}
    </Modal>
  );
};
