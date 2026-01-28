'use client';

import { useCallback, useState } from 'react';

import { SignupModal } from '@/components/blocks/SignupModal';
import { registerUser } from '@/components/blocks/SignupModal/actions';
import { useAuth } from '@/context';
import { useSystemMessage } from '@/hooks/useSystemMessage';

import type { SignupFormData } from '@/components/blocks/SignupModal';

export const SignupModalWrapper = () => {
  const { isNewUser, discordMeta, setUser } = useAuth();
  const { showSuccess, showError } = useSystemMessage();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = useCallback(
    async (data: SignupFormData): Promise<boolean> => {
      setIsSubmitting(true);
      try {
        const result = await registerUser({
          userName: data.userName,
          nickname: data.nickname,
          bio: data.bio,
          favoriteScenarios: data.favoriteScenarios,
        });
        if (!result.success) {
          showError(result.error);
          setIsSubmitting(false);
          return false;
        }
        return true;
      } catch {
        showError('ユーザー登録に失敗しました');
        setIsSubmitting(false);
        return false;
      }
    },
    [showError],
  );

  const handleComplete = useCallback(() => {
    if (discordMeta) {
      setUser({
        userId: '',
        discordId: discordMeta.discordId,
        nickname: discordMeta.userName ?? '',
        avatar: discordMeta.avatarUrl,
        role: 'MEMBER',
      });
    }
    showSuccess('登録が完了しました！');
  }, [discordMeta, setUser, showSuccess]);

  if (!isNewUser || !discordMeta) return null;

  return (
    <SignupModal
      isOpen={true}
      defaultUserName={discordMeta.userName ?? ''}
      defaultNickname={discordMeta.displayName ?? ''}
      isSubmitting={isSubmitting}
      onSubmit={handleSubmit}
      onComplete={handleComplete}
      {...(discordMeta.avatarUrl && { avatarUrl: discordMeta.avatarUrl })}
    />
  );
};
