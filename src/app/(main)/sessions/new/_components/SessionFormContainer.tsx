'use client';

import { useTransition } from 'react';
import { useRouter } from 'next/navigation';

import { createSessionAction } from '../actions';
import { SessionForm } from './SessionForm';

import { useSystemMessageActions } from '@/hooks/useSystemMessage';

import type { SessionFormValues } from '../schema';

export const SessionFormContainer = () => {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const { addMessage } = useSystemMessageActions();

  const handleSubmit = (data: SessionFormValues) => {
    startTransition(async () => {
      const result = await createSessionAction(data);

      if (!result.success) {
        addMessage('danger', result.error?.message ?? '作成に失敗しました');
      } else {
        addMessage('success', 'セッションを作成しました');
        router.push(`/sessions/${result.data.gameSessionId}`);
      }
    });
  };

  return <SessionForm onSubmit={handleSubmit} isSubmitting={isPending} />;
};
