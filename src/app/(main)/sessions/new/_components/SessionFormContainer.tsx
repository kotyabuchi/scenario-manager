'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { isNil } from 'ramda';

import { createSessionAction } from '../actions';
import { SessionForm } from './SessionForm';

import { css } from '@/styled-system/css';

import type { SessionFormValues } from '../schema';

const errorStyle = css({
  p: '4',
  mb: '4',
  bg: 'danger.subtle',
  color: 'danger.text',
  rounded: 'md',
  fontSize: 'sm',
});

export const SessionFormContainer = () => {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [serverError, setServerError] = useState<string | null>(null);

  const handleSubmit = (data: SessionFormValues) => {
    setServerError(null);

    startTransition(async () => {
      const result = await createSessionAction(data);

      if (!result.success) {
        setServerError(result.error?.message ?? '作成に失敗しました');
      } else {
        router.push(`/sessions/${result.data.gameSessionId}`);
      }
    });
  };

  return (
    <>
      {!isNil(serverError) && <div className={errorStyle}>{serverError}</div>}
      <SessionForm onSubmit={handleSubmit} isSubmitting={isPending} />
    </>
  );
};
