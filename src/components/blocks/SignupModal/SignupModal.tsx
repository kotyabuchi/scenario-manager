'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Dialog } from '@ark-ui/react/dialog';
import { Portal } from '@ark-ui/react/portal';
import { zodResolver } from '@hookform/resolvers/zod';

import { signupFormSchema, signupStep2Schema } from './schema';
import * as styles from './styles';

import { Avatar } from '@/components/elements/avatar';
import { Button } from '@/components/elements/button/button';
import { FormField } from '@/components/elements/form-field';
import { Input } from '@/components/elements/input';
import { Textarea } from '@/components/elements/textarea';

import type { z } from 'zod';
import type { SignupFormValues } from './schema';

export type SignupModalProps = {
  isOpen: boolean;
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
  onComplete?: () => void;
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

  const handleStep2Submit = step2Form.handleSubmit(() => {
    onComplete?.();
  });

  const handleSkip = () => {
    onComplete?.();
  };

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
            <Dialog.Title className={styles.title} style={{ display: 'none' }}>
              プロフィール設定
            </Dialog.Title>

            <div className={styles.header}>
              <p className={styles.stepIndicator}>ステップ {step}/2</p>
            </div>

            {step === 1 ? (
              <form onSubmit={handleStep1Submit}>
                <div className={styles.body}>
                  {avatarUrl && (
                    <Avatar src={avatarUrl} alt="アバター" size="xl" />
                  )}

                  <FormField
                    id="signup-username"
                    label="ユーザー名"
                    required
                    error={step1Form.formState.errors.userName}
                  >
                    <Input
                      id="signup-username"
                      type="text"
                      {...step1Form.register('userName')}
                    />
                    {isCheckingUserName && (
                      <p
                        className={styles.usernameStatus}
                        data-testid="username-checking"
                      >
                        確認中...
                      </p>
                    )}
                    {!isCheckingUserName && userNameAvailable === true && (
                      <p
                        className={styles.usernameStatus}
                        data-testid="username-available"
                      >
                        使用可能
                      </p>
                    )}
                    {!isCheckingUserName && userNameAvailable === false && (
                      <p className={styles.errorText}>
                        このユーザー名は既に使用されています
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
                      {...step1Form.register('nickname')}
                    />
                  </FormField>
                </div>

                <div className={styles.footer}>
                  <Button type="submit" status="primary">
                    次へ
                  </Button>
                </div>
              </form>
            ) : (
              <form onSubmit={handleStep2Submit}>
                <div className={styles.body}>
                  <FormField id="signup-bio" label="自己紹介">
                    <Textarea id="signup-bio" {...step2Form.register('bio')} />
                  </FormField>

                  <FormField label="好きなシステム">
                    <div className={styles.chipGroup}>
                      {/* TODO: チップ選択UI */}
                    </div>
                  </FormField>

                  <FormField
                    id="signup-favorite-scenarios"
                    label="好きなシナリオ"
                  >
                    <Textarea
                      id="signup-favorite-scenarios"
                      {...step2Form.register('favoriteScenarios')}
                    />
                  </FormField>
                </div>

                <div className={styles.footer}>
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => setStep(1)}
                  >
                    戻る
                  </Button>
                  <Button type="button" variant="ghost" onClick={handleSkip}>
                    スキップ
                  </Button>
                  <Button
                    type="submit"
                    status="primary"
                    disabled={isSubmitting}
                    loading={isSubmitting}
                    loadingText="登録中..."
                  >
                    登録する
                  </Button>
                </div>
              </form>
            )}
          </Dialog.Content>
        </Dialog.Positioner>
      </Portal>
    </Dialog.Root>
  );
};
