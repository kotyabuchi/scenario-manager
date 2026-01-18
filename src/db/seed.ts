import { config } from 'dotenv';
import { ulid } from 'ulid';

import { HandoutTypes } from './enum';
import { db } from './index';
import { scenarioSystems, scenarios, tags } from './schema';

import { readFileSync } from 'node:fs';
import { join } from 'node:path';

config({ path: '.env.local' });

/**
 * JSONファイルのシナリオデータ型
 */
interface ScenarioJsonData {
  name: string;
  author: string | null;
  scenarioTag: string[];
  minPlayer: number | null;
  maxPlayer: number | null;
  minPlaytime: number | null;
  maxPlaytime: number | null;
  handoutType: 'PUBLIC' | 'SECRET' | 'NONE';
  description: string | null;
  distribute_url: string | null;
  shortDescription: string | null;
  thumbnailPath: string | null;
  uploadedUserId: string;
}

/**
 * JSONのシステム名 → DBのシステム名マッピング
 */
const SYSTEM_NAME_MAP: Record<string, string> = {
  'クトゥルフ神話(6版)': 'クトゥルフ神話TRPG（CoC6版）',
  '新クトゥルフ神話(7版)': '新クトゥルフ神話TRPG（CoC7版）',
  エモクロア: 'エモクロアTRPG',
  パラノイア: 'パラノイア',
  // 以下は既存システムとそのまま一致するもの
  インセイン: 'インセイン',
  シノビガミ: 'シノビガミ',
  'ソード・ワールド2.5': 'ソード・ワールド2.5',
  'ダブルクロス The 3rd Edition': 'ダブルクロス The 3rd Edition',
  'アリアンロッドRPG 2E': 'アリアンロッドRPG 2E',
};

/**
 * システム・タグの基本データを投入する
 */
async function seedMasterData() {
  console.log('📦 Seeding master data...');

  // システムデータ（パラノイアを追加）
  const systems = [
    { systemId: ulid(), name: 'クトゥルフ神話TRPG（CoC6版）' },
    { systemId: ulid(), name: '新クトゥルフ神話TRPG（CoC7版）' },
    { systemId: ulid(), name: 'ソード・ワールド2.5' },
    { systemId: ulid(), name: 'インセイン' },
    { systemId: ulid(), name: 'エモクロアTRPG' },
    { systemId: ulid(), name: 'シノビガミ' },
    { systemId: ulid(), name: 'ダブルクロス The 3rd Edition' },
    { systemId: ulid(), name: 'アリアンロッドRPG 2E' },
    { systemId: ulid(), name: 'パラノイア' },
  ];

  await db.insert(scenarioSystems).values(systems).onConflictDoNothing();
  console.log(`✅ Inserted ${systems.length} systems`);

  // タグデータ
  const tagData = [
    { tagId: ulid(), name: 'ホラー', color: '#dc2626' },
    { tagId: ulid(), name: 'ほのぼの', color: '#16a34a' },
    { tagId: ulid(), name: '推理', color: '#2563eb' },
    { tagId: ulid(), name: 'バトル', color: '#dc2626' },
    { tagId: ulid(), name: '探索', color: '#ca8a04' },
    { tagId: ulid(), name: '短時間', color: '#7c3aed' },
    { tagId: ulid(), name: '初心者向け', color: '#059669' },
    { tagId: ulid(), name: 'ロールプレイ重視', color: '#ec4899' },
    { tagId: ulid(), name: 'シティ', color: '#0891b2' },
    { tagId: ulid(), name: 'ファンタジー', color: '#9333ea' },
    { tagId: ulid(), name: 'SF', color: '#0284c7' },
    { tagId: ulid(), name: '現代', color: '#6b7280' },
  ];

  await db.insert(tags).values(tagData).onConflictDoNothing();
  console.log(`✅ Inserted ${tagData.length} tags`);
}

/**
 * シナリオデータを投入する
 */
async function seedScenarios() {
  console.log('📖 Seeding scenarios...');

  // JSONファイルを読み込む
  const jsonPath = join(process.cwd(), 'src/lib/seeds-data/scenarios.json');
  const jsonData = JSON.parse(
    readFileSync(jsonPath, 'utf-8'),
  ) as ScenarioJsonData[];

  console.log(`📄 Loaded ${jsonData.length} scenarios from JSON`);

  // 既存のシステムをすべて取得してマップを作成
  const existingSystems = await db.select().from(scenarioSystems);
  const systemMap = new Map<string, string>();
  for (const sys of existingSystems) {
    systemMap.set(sys.name, sys.systemId);
  }

  // シナリオデータを変換
  const scenarioDataList: Array<{
    scenarioId: string;
    name: string;
    author: string | null;
    description: string | null;
    minPlayer: number | null;
    maxPlayer: number | null;
    minPlaytime: number | null;
    maxPlaytime: number | null;
    scenarioSystemId: string;
    handoutType: 'PUBLIC' | 'SECRET' | 'NONE';
    distributeUrl: string | null;
  }> = [];

  let skippedCount = 0;

  for (const item of jsonData) {
    // scenarioTagからシステム名を特定（"TRPG"以外のもの）
    const systemTagFromJson = item.scenarioTag.find((tag) => tag !== 'TRPG');

    if (!systemTagFromJson) {
      console.warn(`⚠️ No system tag found for scenario: ${item.name}`);
      skippedCount++;
      continue;
    }

    // JSONのシステム名をDBのシステム名にマッピング
    const dbSystemName = SYSTEM_NAME_MAP[systemTagFromJson];

    if (!dbSystemName) {
      console.warn(
        `⚠️ Unknown system tag: ${systemTagFromJson} for scenario: ${item.name}`,
      );
      skippedCount++;
      continue;
    }

    // システムIDを取得
    const systemId = systemMap.get(dbSystemName);

    if (!systemId) {
      console.warn(
        `⚠️ System not found in DB: ${dbSystemName} for scenario: ${item.name}`,
      );
      skippedCount++;
      continue;
    }

    // handoutTypeの変換
    let handoutType: 'PUBLIC' | 'SECRET' | 'NONE';
    switch (item.handoutType) {
      case 'PUBLIC':
        handoutType = HandoutTypes.PUBLIC.value;
        break;
      case 'SECRET':
        handoutType = HandoutTypes.SECRET.value;
        break;
      default:
        handoutType = HandoutTypes.NONE.value;
    }

    scenarioDataList.push({
      scenarioId: ulid(),
      name: item.name,
      author: item.author,
      description: item.description,
      minPlayer: item.minPlayer,
      maxPlayer: item.maxPlayer,
      minPlaytime: item.minPlaytime,
      maxPlaytime: item.maxPlaytime,
      scenarioSystemId: systemId,
      handoutType,
      distributeUrl: item.distribute_url,
    });
  }

  if (scenarioDataList.length === 0) {
    console.log('⚠️ No scenarios to insert');
    return;
  }

  // バッチ挿入（大量データの場合はチャンクに分割）
  const BATCH_SIZE = 100;
  for (let i = 0; i < scenarioDataList.length; i += BATCH_SIZE) {
    const batch = scenarioDataList.slice(i, i + BATCH_SIZE);
    await db.insert(scenarios).values(batch).onConflictDoNothing();
    console.log(
      `  ✅ Inserted batch ${Math.floor(i / BATCH_SIZE) + 1}/${Math.ceil(scenarioDataList.length / BATCH_SIZE)}`,
    );
  }

  console.log(`✅ Inserted ${scenarioDataList.length} scenarios`);
  if (skippedCount > 0) {
    console.log(`⚠️ Skipped ${skippedCount} scenarios due to missing data`);
  }
}

/**
 * シードデータを投入する
 */
async function seed() {
  console.log('🌱 Seeding database...');

  try {
    // マスターデータ（システム・タグ）を投入
    await seedMasterData();

    // シナリオデータを投入
    await seedScenarios();

    console.log('✨ Seeding completed!');
  } catch (error) {
    console.error('❌ Seeding failed:', error);
    process.exit(1);
  }

  process.exit(0);
}

seed();
