import type { InferSelectModel } from 'drizzle-orm';
import type { scenarioSystems, scenarios, tags } from '@/db/schema';

// Drizzleスキーマから型を導出
type Scenario = InferSelectModel<typeof scenarios>;
type ScenarioSystem = InferSelectModel<typeof scenarioSystems>;
type Tag = InferSelectModel<typeof tags>;

// ページ固有の型（リレーション込み）
type ScenarioWithRelations = Scenario & {
  system: ScenarioSystem;
  scenarioTags?: { tag: Tag }[];
  tags?: Tag[];
  averageRating?: number | null;
  reviewCount?: number;
};

// 検索パラメータ
type SearchParams = {
  systemIds?: string[];
  playerCount?: { min: number; max: number };
  playtime?: { min: number; max: number };
  tagIds?: string[];
  scenarioName?: string;
};

// ソートオプション
type SortOption = 'newest' | 'rating' | 'playtime_asc' | 'playtime_desc';

// 検索結果
type SearchResult = {
  scenarios: ScenarioWithRelations[];
  totalCount: number;
};

// シナリオ作成入力
type CreateScenarioInput = {
  name: string;
  scenarioSystemId: string;
  handoutType: 'NONE' | 'PUBLIC' | 'SECRET';
  author?: string | undefined;
  description?: string | undefined;
  minPlayer?: number | undefined;
  maxPlayer?: number | undefined;
  minPlaytime?: number | undefined;
  maxPlaytime?: number | undefined;
  scenarioImageUrl?: string | undefined;
  distributeUrl?: string | undefined;
  tagIds?: string[];
};

// Props型
type ScenarioCardProps = {
  scenario: ScenarioWithRelations;
};

type ScenarioListProps = {
  scenarios: ScenarioWithRelations[];
  isLoading?: boolean;
};

type SearchPanelProps = {
  systems: ScenarioSystem[];
  tags: Tag[];
  defaultParams?: SearchParams;
  onSearch: (params: SearchParams) => void;
};

export type {
  Scenario,
  ScenarioSystem,
  Tag,
  ScenarioWithRelations,
  SearchParams,
  SortOption,
  SearchResult,
  CreateScenarioInput,
  ScenarioCardProps,
  ScenarioListProps,
  SearchPanelProps,
};
