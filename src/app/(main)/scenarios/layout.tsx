'use client';

import { useEffect, useRef, useState } from 'react';
import { usePathname } from 'next/navigation';

import { InterceptedDetailPresenceContext } from './_components/InterceptedDetailPresence';
import {
  type ScenarioListSession,
  ScenarioListSessionContext,
} from './_components/ScenarioListSession';
import { observeScrollFade } from './scrollFade';
import * as styles from './styles';

import type { ReactNode } from 'react';

type ScenariosLayoutProps = {
  children: ReactNode;
  detail: ReactNode;
};

const SCENARIO_DETAIL_PATH = /^\/scenarios\/[0-9A-HJKMNP-TV-Z]{26}$/i;

export default function ScenariosLayout({
  children,
  detail,
}: ScenariosLayoutProps) {
  const pathname = usePathname();
  const [hasInterceptedDetail, setHasInterceptedDetail] = useState(false);
  const detailPaneRef = useRef<HTMLElement>(null);
  const listSessionRef = useRef<ScenarioListSession>({
    snapshot: null,
    openedScenarioId: null,
    scrollTop: 0,
    listPaneElement: null,
  });
  const listSession = listSessionRef.current;
  const isScenarioDetail = SCENARIO_DETAIL_PATH.test(pathname);
  const isPaneOpen = isScenarioDetail && hasInterceptedDetail;
  const isStandalone = pathname !== '/scenarios' && !isPaneOpen;

  useEffect(() => {
    const stopListFade = observeScrollFade(listSession.listPaneElement);
    const stopDetailFade = observeScrollFade(detailPaneRef.current);
    return () => {
      stopListFade();
      stopDetailFade();
    };
  }, [listSession]);

  return (
    <ScenarioListSessionContext.Provider value={listSession}>
      <InterceptedDetailPresenceContext.Provider
        value={setHasInterceptedDetail}
      >
        <div className={styles.shell}>
          <div
            className={`${styles.grid} ${isPaneOpen ? styles.twoPaneGrid : ''}`}
            data-pane-open={isPaneOpen}
          >
            <section
              ref={(element) => {
                listSession.listPaneElement = element;
              }}
              aria-label={
                isStandalone
                  ? isScenarioDetail
                    ? 'シナリオ詳細'
                    : 'シナリオページ'
                  : 'シナリオ一覧'
              }
              className={`${styles.listPane} ${styles.scrollFade} ${
                isStandalone ? '' : styles.scrollingListPane
              } ${
                isStandalone || isPaneOpen ? '' : styles.singleListPane
              } ${isPaneOpen ? styles.listPaneWithDetail : ''}`}
            >
              {children}
            </section>
            <section
              ref={detailPaneRef}
              aria-label="シナリオ詳細"
              className={`${styles.detailPane} ${styles.scrollFade} ${
                isPaneOpen ? styles.detailPaneVisible : styles.detailPaneHidden
              }`}
            >
              {detail}
            </section>
          </div>
        </div>
      </InterceptedDetailPresenceContext.Provider>
    </ScenarioListSessionContext.Provider>
  );
}
