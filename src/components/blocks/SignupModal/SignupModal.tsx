'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Dialog } from '@ark-ui/react/dialog';
import { Portal } from '@ark-ui/react/portal';
import { zodResolver } from '@hookform/resolvers/zod';
import { ArrowRight, Check, User } from '@phosphor-icons/react/ssr';

import { signupFormSchema, signupStep2Schema } from './schema';
import * as styles from './styles';

import { Avatar } from '@/components/elements/avatar';
import { Button } from '@/components/elements/button/button';
import { FormField } from '@/components/elements/form-field/form-field';
import { Input } from '@/components/elements/input';
import { Textarea } from '@/components/elements/textarea';

import type { z } from 'zod';
import type { SignupFormValues } from './schema';

export type SignupFormData = {
  userName: string;
  nickname: string;
  bio?: string | undefined;
  favoriteScenarios?: string | undefined;
};

export type SignupModalProps = {
  isOpen: boolean;
  onSubmit: (data: SignupFormData) => Promise<boolean>;
  onComplete: () => void;
  defaultUserName?: string;
  defaultNickname?: string;
  avatarUrl?: string;
  isCheckingUserName?: boolean;
  userNameAvailable?: boolean;
  initialStep?: number;
  defaultBio?: string;
  defaultFavoriteSystems?: string[];
  defaultFavoriteScenarios?: string;
  isSubmitting?: boolean;
};

export const SignupModal = ({
  isOpen,
  defaultUserName = '',
  defaultNickname = '',
  avatarUrl,
  isCheckingUserName = false,
  userNameAvailable,
  initialStep = 1,
  defaultBio = '',
  defaultFavoriteSystems: _defaultFavoriteSystems = [],
  defaultFavoriteScenarios = '',
  isSubmitting = false,
  onSubmit,
  onComplete,
}: SignupModalProps) => {
  const [step, setStep] = useState(initialStep);

  const step1Form = useForm<SignupFormValues>({
    resolver: zodResolver(signupFormSchema),
    defaultValues: {
      userName: defaultUserName,
      nickname: defaultNickname,
    },
  });

  const step2Form = useForm<z.input<typeof signupStep2Schema>>({
    resolver: zodResolver(signupStep2Schema),
    defaultValues: {
      bio: defaultBio,
      favoriteScenarios: defaultFavoriteScenarios,
    },
  });

  const handleStep1Submit = step1Form.handleSubmit(() => {
    setStep(2);
  });

  const submitAllData = async (step2Data?: {
    bio?: string | undefined;
    favoriteScenarios?: string | undefined;
  }) => {
    const step1Data = step1Form.getValues();
    const formData: SignupFormData = {
      userName: step1Data.userName,
      nickname: step1Data.nickname,
      bio: step2Data?.bio,
      favoriteScenarios: step2Data?.favoriteScenarios,
    };
    const success = await onSubmit(formData);
    if (success) {
      setStep(3);
    }
  };

  const handleStep2Submit = step2Form.handleSubmit(async (data) => {
    await submitAllData({
      bio: data.bio,
      favoriteScenarios: data.favoriteScenarios,
    });
  });

  const handleSkip = async () => {
    await submitAllData();
  };

  const handleStart = () => {
    onComplete();
  };

  const hasStep1Errors =
    step1Form.formState.isSubmitted &&
    Object.keys(step1Form.formState.errors).length > 0;

  const bioValue = step2Form.watch('bio') ?? '';
  const favScenariosValue = step2Form.watch('favoriteScenarios') ?? '';

  if (!isOpen) return null;

  return (
    <Dialog.Root
      open={true}
      onOpenChange={() => {
        /* 閉じさせない */
      }}
      closeOnInteractOutside={false}
      onEscapeKeyDown={(e) => e.preventDefault()}
    >
      <Portal>
        <Dialog.Backdrop className={styles.backdrop} />
        <Dialog.Positioner className={styles.positioner}>
          <Dialog.Content className={styles.content}>
            <Dialog.Title className={styles.visuallyHidden}>
              プロフィール設定
            </Dialog.Title>

            {step === 3 ? (
              /* ── 完了画面 ── */
              <div className={styles.completionCard}>
                <div className={styles.checkCircle}>
                  <Check size={32} />
                </div>
                <div className={styles.titleGroup}>
                  <h2 className={styles.title}>登録が完了しました！</h2>
                  <p className={styles.subtitle}>
                    プロフィールはいつでも編集できます
                  </p>
                </div>
                <Button type="button" w="full" onClick={handleStart}>
                  はじめる
                  <ArrowRight size={16} />
                </Button>
              </div>
            ) : (
              <div className={styles.cardBody}>
                {/* ステップインジケーター */}
                <div className={styles.stepIndicator}>
                  <div className={styles.stepIndicator_labelRow}>
                    <span className={styles.stepIndicator_stepText}>
                      ステップ {step}/2
                    </span>
                    <span className={styles.stepIndicator_descText}>
                      {step === 1 ? '基本情報' : '追加情報'}
                    </span>
                  </div>
                  <div className={styles.stepIndicator_barBg}>
                    <div
                      className={
                        step === 1 && hasStep1Errors
                          ? styles.stepIndicator_barFillError
                          : step === 1
                            ? styles.stepIndicator_barFillStep1
                            : styles.stepIndicator_barFillStep2
                      }
                    />
                  </div>
                </div>

                {step === 1 ? (
                  <form
                    onSubmit={handleStep1Submit}
                    className={styles.stepForm}
                  >
                    {/* アバター */}
                    {avatarUrl ? (
                      <Avatar src={avatarUrl} alt="アバター" size="xl" />
                    ) : (
                      <div className={styles.avatarCircle}>
                        <User size={32} />
                      </div>
                    )}

                    {/* タイトルグループ */}
                    <div className={styles.titleGroup}>
                      <h2 className={styles.title}>プロフィール設定</h2>
                      <p className={styles.subtitle}>
                        はじめに、あなたのプロフィールを設定しましょう
                      </p>
                    </div>

                    {/* フォーム */}
                    <div className={styles.formGroup}>
                      <FormField
                        id="signup-username"
                        label="ユーザーID"
                        required
                        error={step1Form.formState.errors.userName}
                      >
                        <Input
                          id="signup-username"
                          type="text"
                          placeholder="例: taro_trpg"
                          hasError={!!step1Form.formState.errors.userName}
                          {...step1Form.register('userName')}
                        />
                        <span className={styles.fieldHint}>
                          英数字とアンダースコア（3〜20文字）
                        </span>
                        {isCheckingUserName && (
                          <p
                            className={styles.usernameStatusChecking}
                            data-testid="username-checking"
                          >
                            確認中...
                          </p>
                        )}
                        {!isCheckingUserName && userNameAvailable === true && (
                          <p
                            className={styles.usernameStatusAvailable}
                            data-testid="username-available"
                          >
                            使用可能
                          </p>
                        )}
                        {!isCheckingUserName && userNameAvailable === false && (
                          <p className={styles.errorText}>
                            このユーザーIDは既に使用されています
                          </p>
                        )}
                      </FormField>

                      <FormField
                        id="signup-nickname"
                        label="表示名"
                        required
                        error={step1Form.formState.errors.nickname}
                      >
                        <Input
                          id="signup-nickname"
                          type="text"
                          placeholder="例: 太郎"
                          hasError={!!step1Form.formState.errors.nickname}
                          {...step1Form.register('nickname')}
                        />
                      </FormField>
                    </div>

                    {/* 次へボタン */}
                    <Button type="submit" w="full">
                      次へ
                    </Button>
                  </form>
                ) : (
                  <form
                    onSubmit={handleStep2Submit}
                    className={styles.stepForm}
                  >
                    {/* タイトルグループ */}
                    <div className={styles.titleGroup}>
                      <h2 className={styles.title}>追加情報（任意）</h2>
                      <p className={styles.subtitle}>
                        スキップして後から設定することもできます
                      </p>
                    </div>

                    {/* フォーム */}
                    <div className={styles.formGroup}>
                      <FormField
                        id="signup-bio"
                        label="自己紹介（500文字以内）"
                      >
                        <Textarea
                          id="signup-bio"
                          placeholder="例: TRPGが大好きです。CoC7版をメインに遊んでいます。"
                          {...step2Form.register('bio')}
                        />
                        <span className={styles.charCounter}>
                          {bioValue.length}/500
                        </span>
                      </FormField>

                      <FormField label="好きなシステム">
                        <div className={styles.chipGroup}>
                          {/* TODO: チップ選択UI */}
                        </div>
                      </FormField>

                      <FormField
                        id="signup-favorite-scenarios"
                        label="好きなシナリオ（500文字以内）"
                      >
                        <Textarea
                          id="signup-favorite-scenarios"
                          placeholder="例: 狂気山脈、悪霊の家"
                          {...step2Form.register('favoriteScenarios')}
                        />
                        <span className={styles.charCounter}>
                          {favScenariosValue.length}/500
                        </span>
                      </FormField>
                    </div>

                    {/* フッターボタン */}
                    <div className={styles.footerButtons}>
                      <Button
                        type="button"
                        variant="ghost"
                        onClick={() => setStep(1)}
                      >
                        戻る
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        flex="1"
                        onClick={handleSkip}
                        disabled={isSubmitting}
                      >
                        スキップ
                      </Button>
                      <Button
                        type="submit"
                        flex="1"
                        loading={isSubmitting}
                        loadingText="登録中..."
                      >
                        登録する
                      </Button>
                    </div>
                  </form>
                )}
              </div>
            )}
          </Dialog.Content>
        </Dialog.Positioner>
      </Portal>
    </Dialog.Root>
  );
};
