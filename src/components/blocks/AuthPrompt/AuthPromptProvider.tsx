'use client';

import { useCallback, useEffect, useState } from 'react';

import { AuthPromptDialog } from './AuthPromptDialog';
import { AuthPromptContext } from './authPromptContext';

import { useAuth } from '@/context';
import { useDiscordAuth } from '@/hooks/useDiscordAuth';

import type { PropsWithChildren } from 'react';
import type { AuthPromptRequest } from './authPromptContext';

export const AuthPromptProvider = ({ children }: PropsWithChildren) => {
  const [request, setRequest] = useState<AuthPromptRequest | null>(null);
  const { isAuthenticated, isNewUser } = useAuth();
  const { login } = useDiscordAuth();

  useEffect(() => {
    if (isAuthenticated || isNewUser) setRequest(null);
  }, [isAuthenticated, isNewUser]);

  const openAuthPrompt = useCallback((nextRequest: AuthPromptRequest) => {
    setRequest(nextRequest);
  }, []);

  const handleContinue = () => {
    const returnTo =
      request?.returnTo ??
      `${window.location.pathname}${window.location.search}${window.location.hash}`;
    login(returnTo);
  };

  return (
    <AuthPromptContext value={openAuthPrompt}>
      {children}
      <AuthPromptDialog
        open={request !== null && !isAuthenticated && !isNewUser}
        request={request}
        onClose={() => setRequest(null)}
        onContinue={handleContinue}
      />
    </AuthPromptContext>
  );
};
