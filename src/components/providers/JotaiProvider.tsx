'use client';

import { Provider } from 'jotai';

import type { ReactNode } from 'react';

type JotaiProviderProps = {
  children: ReactNode;
};

export const JotaiProvider = ({ children }: JotaiProviderProps) => {
  return <Provider>{children}</Provider>;
};
