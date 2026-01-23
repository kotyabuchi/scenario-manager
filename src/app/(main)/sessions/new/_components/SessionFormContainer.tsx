'use client';

import { useTransition } from 'react';
import { useRouter } from 'next/navigation';

import { createSessionAction } from '../actions';
import { SessionForm } from './SessionForm';

import { useSystemMessage } from '@/hooks/useSystemMessage';

import type { SessionFormValues } from '../schema';

export const SessionFormContainer = () => {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const { showSuccess, showError } = useSystemMessage();

  const handleSubmit = (data: SessionFormValues) => {
    startTransition(async () => {
      const result = await createSessionAction(data);

      if (!result.success) {
        showError(result.error?.message ?? '作成に失敗しました');
      } else {
        showSuccess('セッションを作成しました');
        router.push(`/sessions/${result.data.gameSessionId}`);
      }
    });
  };

  return <SessionForm onSubmit={handleSubmit} isSubmitting={isPending} />;
};
