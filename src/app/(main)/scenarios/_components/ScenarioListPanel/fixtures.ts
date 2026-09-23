import type { ScenarioWithRelations } from '../../interface';

const timestamp = '2026-07-01T00:00:00.000Z';

export const systems = [
  {
    systemId: 'coc7',
    name: 'クトゥルフ神話TRPG',
    createdAt: timestamp,
    updatedAt: timestamp,
  },
  {
    systemId: 'coc6',
    name: 'CoC 6版',
    createdAt: timestamp,
    updatedAt: timestamp,
  },
  {
    systemId: 'sw25',
    name: 'ソード・ワールド2.5',
    createdAt: timestamp,
    updatedAt: timestamp,
  },
  {
    systemId: 'emo',
    name: 'エモクロアTRPG',
    createdAt: timestamp,
    updatedAt: timestamp,
  },
  {
    systemId: 'ins',
    name: 'インセイン',
    createdAt: timestamp,
    updatedAt: timestamp,
  },
  {
    systemId: 'dx',
    name: 'ダブルクロス The 3rd',
    createdAt: timestamp,
    updatedAt: timestamp,
  },
];

export const tags = [
  { tagId: 'closed', name: 'クローズド' },
  { tagId: 'modern', name: '現代日本' },
  { tagId: 'youth', name: '青春' },
  { tagId: 'horror', name: 'ホラー' },
  { tagId: 'exploration', name: '探索' },
  { tagId: 'japanese', name: '和風' },
].map((tag) => ({
  ...tag,
  color: null,
  createdAt: timestamp,
  updatedAt: timestamp,
}));

export const createScenario = (
  overrides: Partial<ScenarioWithRelations> = {},
): ScenarioWithRelations => ({
  scenarioId: 'scenario-seaside',
  name: '海辺のあいまいな約束',
  description: '夏の海辺の町を舞台にした、探索とRPを中心としたシナリオです。',
  author: '海の作者',
  minPlayer: 3,
  maxPlayer: 4,
  minPlaytime: 180,
  maxPlaytime: 300,
  scenarioImageUrl: null,
  scenarioSystemId: 'coc6',
  system: {
    systemId: 'coc6',
    name: 'CoC 6版',
    createdAt: timestamp,
    updatedAt: timestamp,
  },
  tags: tags.slice(0, 2),
  createdAt: timestamp,
  updatedAt: timestamp,
  createdById: null,
  distributeUrl: null,
  handoutType: 'NONE',
  sortPlaytimeAsc: 180,
  sortPlaytimeDesc: 300,
  sourceFetchedAt: null,
  sourceType: 'manual',
  sourceUrl: null,
  ...overrides,
});

export const scenarios = [
  createScenario(),
  createScenario({
    scenarioId: 'scenario-twilight',
    name: '黄昏の街で、きみに問う',
    scenarioSystemId: 'coc7',
    system: {
      systemId: 'coc7',
      name: 'クトゥルフ神話TRPG',
      createdAt: timestamp,
      updatedAt: timestamp,
    },
    minPlayer: 2,
    maxPlayer: 3,
    minPlaytime: 60,
    maxPlaytime: 120,
    sortPlaytimeAsc: 60,
    sortPlaytimeDesc: 120,
    createdAt: '2026-07-02T00:00:00.000Z',
    tags: tags.slice(3, 5),
  }),
  createScenario({
    scenarioId: 'scenario-flowers',
    name: '夢のつづきは、花のあとで',
    scenarioSystemId: 'emo',
    system: {
      systemId: 'emo',
      name: 'エモクロアTRPG',
      createdAt: timestamp,
      updatedAt: timestamp,
    },
    minPlaytime: 360,
    maxPlaytime: 480,
    sortPlaytimeAsc: 360,
    sortPlaytimeDesc: 480,
    createdAt: '2026-07-03T00:00:00.000Z',
    tags: tags.slice(5),
  }),
  createScenario({
    scenarioId: 'scenario-rain',
    name: '雨上がりに君と',
    createdAt: '2026-07-04T00:00:00.000Z',
  }),
  createScenario({
    scenarioId: 'scenario-garden',
    name: '箱庭の観測者',
    createdAt: '2026-07-05T00:00:00.000Z',
  }),
  createScenario({
    scenarioId: 'scenario-end',
    name: '終末にさよなら',
    createdAt: '2026-07-06T00:00:00.000Z',
  }),
];
