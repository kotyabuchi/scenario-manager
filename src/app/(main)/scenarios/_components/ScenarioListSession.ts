'use client';

import { createContext, useContext } from 'react';

import type { SearchResult } from '../interface';

export type ScenarioListSnapshot = {
  queryString: string;
  result: SearchResult;
  offset: number;
};

export type ScenarioListSession = {
  snapshot: ScenarioListSnapshot | null;
  openedScenarioId: string | null;
  scrollTop: number;
  listPaneElement: HTMLElement | null;
};

export const ScenarioListSessionContext =
  createContext<ScenarioListSession | null>(null);

/** 一覧がルート遷移で再マウントされても、詳細を開く前の状態へ戻す。 */
export const useScenarioListSession = (): ScenarioListSession => {
  const session = useContext(ScenarioListSessionContext);
  if (!session) {
    throw new Error('ScenarioListSessionContext が必要です');
  }
  return session;
};
