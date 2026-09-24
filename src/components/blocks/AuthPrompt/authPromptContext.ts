'use client';

import { createContext, useContext } from 'react';

type AuthPromptRequest = {
  message: string;
  returnTo?: string;
};

type OpenAuthPrompt = (request: AuthPromptRequest) => void;

export const AuthPromptContext = createContext<OpenAuthPrompt>(() => {});

export const useAuthPrompt = () => useContext(AuthPromptContext);

export type { AuthPromptRequest };
