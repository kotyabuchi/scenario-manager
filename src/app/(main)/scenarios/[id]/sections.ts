import { isNil } from 'ramda';

import type { TocSection } from '@/components/blocks/SectionToc';
import type { ScenarioDetail } from './interface';

export const SCENARIO_DETAIL_SECTION_IDS = {
  info: 'info',
  overview: 'overview',
  sessions: 'sessions',
  videos: 'videos',
  comments: 'comments',
} as const;

/** 本文に存在するセクションだけを目次に出す。 */
export const getScenarioDetailSections = (
  scenario: ScenarioDetail,
): TocSection[] => [
  { id: SCENARIO_DETAIL_SECTION_IDS.info, label: '基本情報' },
  ...(!isNil(scenario.description)
    ? [{ id: SCENARIO_DETAIL_SECTION_IDS.overview, label: 'シナリオ概要' }]
    : []),
  { id: SCENARIO_DETAIL_SECTION_IDS.sessions, label: '関連セッション' },
  { id: SCENARIO_DETAIL_SECTION_IDS.videos, label: 'プレイ動画' },
  { id: SCENARIO_DETAIL_SECTION_IDS.comments, label: 'コメント' },
];
