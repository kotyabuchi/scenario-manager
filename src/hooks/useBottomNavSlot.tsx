'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from 'react';
import { createPortal } from 'react-dom';

import type { ReactNode } from 'react';

type BottomNavSlotContextValue = {
  registerTarget: (el: HTMLDivElement) => void;
  unregisterTarget: () => void;
  target: HTMLDivElement | null;
};

const BottomNavSlotContext = createContext<BottomNavSlotContextValue | null>(
  null,
);

export const BottomNavSlotProvider = ({
  children,
}: {
  children: ReactNode;
}) => {
  const [target, setTarget] = useState<HTMLDivElement | null>(null);

  const registerTarget = useCallback((el: HTMLDivElement) => {
    setTarget(el);
  }, []);

  const unregisterTarget = useCallback(() => {
    setTarget(null);
  }, []);

  return (
    <BottomNavSlotContext.Provider
      value={{ registerTarget, unregisterTarget, target }}
    >
      {children}
    </BottomNavSlotContext.Provider>
  );
};

/**
 * BottomNav 内でスロットのポータルターゲットを登録するフック。
 * BottomNav コンポーネント内部で使用する。
 */
export const useBottomNavSlotTarget = () => {
  const ctx = useContext(BottomNavSlotContext);
  if (!ctx) {
    throw new Error(
      'useBottomNavSlotTarget must be used within a BottomNavSlotProvider',
    );
  }

  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (ref.current) {
      ctx.registerTarget(ref.current);
    }
    return () => {
      ctx.unregisterTarget();
    };
  }, [ctx.registerTarget, ctx.unregisterTarget]);

  return ref;
};

/**
 * BottomNav の上部スロットにコンテンツをポータルするフック。
 * children を返すので、コンポーネント内で直接レンダリングする。
 */
export const BottomNavSlotPortal = ({ children }: { children: ReactNode }) => {
  const ctx = useContext(BottomNavSlotContext);

  if (!ctx?.target) {
    return null;
  }

  return createPortal(children, ctx.target);
};
