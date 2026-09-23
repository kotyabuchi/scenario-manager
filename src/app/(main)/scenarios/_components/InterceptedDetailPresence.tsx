'use client';

import { createContext, useContext, useLayoutEffect } from 'react';

import type { ReactNode } from 'react';

export const InterceptedDetailPresenceContext = createContext<
  ((isPresent: boolean) => void) | null
>(null);

/** インターセプトルートが実際に描画されたときだけ2ペインを有効にする。 */
export const InterceptedDetailPresence = ({
  children,
}: {
  children: ReactNode;
}) => {
  const setIsPresent = useContext(InterceptedDetailPresenceContext);

  useLayoutEffect(() => {
    setIsPresent?.(true);
    return () => setIsPresent?.(false);
  }, [setIsPresent]);

  return children;
};
