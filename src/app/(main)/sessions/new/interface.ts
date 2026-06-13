import type { ScenarioRow, ScenarioSystemRow } from '@/db/helpers';

/**
 * シナリオ検索結果の軽量型
 * 検索モーダルのリスト表示に必要な最小限のフィールド
 */
type ScenarioSummary = Pick<
  ScenarioRow,
  | 'scenarioId'
  | 'name'
  | 'minPlayer'
  | 'maxPlayer'
  | 'minPlaytime'
  | 'maxPlaytime'
> & {
  systemName: ScenarioSystemRow['name'];
};

/**
 * 選択済みシナリオの表示情報
 * フォーム内のシナリオカード表示に使用
 */
type SelectedScenario = ScenarioSummary & {
  scenarioImageUrl: ScenarioRow['scenarioImageUrl'];
  author: ScenarioRow['author'];
};

/** システム一覧の軽量型（ScenarioSystemRow から導出） */
type SystemSummary = Pick<ScenarioSystemRow, 'systemId' | 'name'>;

export type { ScenarioSummary, SelectedScenario, SystemSummary };
