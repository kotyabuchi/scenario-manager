'use client';

import { useState, useTransition } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Camera, Info, Lightbulb, Send } from 'lucide-react';
import { isNil } from 'ramda';

import { createFeedbackAction } from './actions';
import { type FeedbackFormValues, feedbackFormSchema } from './schema';
import * as styles from './styles';

import { Button } from '@/components/elements/button/button';
import { FieldError } from '@/components/elements/field-error/field-error';
import { Input } from '@/components/elements/input';
import { Modal } from '@/components/elements/modal';
import { Radio } from '@/components/elements/radio';
import { Textarea } from '@/components/elements/textarea';
import { FeedbackCategories } from '@/db/enum';

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

  const handleCategoryChange = (details: { value: string | null }) => {
    if (!isNil(details.value)) {
      setValue('category', details.value as FeedbackFormValues['category']);
    }
  };

  const onSubmit = (data: FeedbackFormValues) => {
    setServerError(null);

    startTransition(async () => {
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
        loadingText="送信中..."
        form="feedback-form"
      >
        <Send size={16} />
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
        <div className={styles.successMessage}>
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

          {/* スクリーンショット添付 */}
          {SHOW_SCREENSHOT[selectedCategory] && (
            <div>
              <Button type="button" variant="subtle" status="primary" size="sm">
                <Camera size={16} />
                スクリーンショットを添付
              </Button>
            </div>
          )}

          {/* ヒントボックス */}
          <div className={styles.hintBox}>
            <div className={styles.hintRow}>
              <Lightbulb size={16} className={styles.hintIcon} />
              <span className={styles.hintText}>
                似た声がないか覗いてみませんか？
              </span>
            </div>
            <div className={styles.hintRow}>
              <span className={styles.hintSpacer} />
              <span className={styles.hintLink}>
                みんなのフィードバックを見る →
              </span>
            </div>
          </div>

          {/* メタ情報 */}
          <div className={styles.noticeRow}>
            <Info size={14} className={styles.noticeIcon} />
            <span className={styles.noticeText}>
              現在のページURLやブラウザの情報が自動で送信されます
            </span>
          </div>
        </form>
      )}
    </Modal>
  );
};
