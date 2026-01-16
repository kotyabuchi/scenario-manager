import { config } from 'dotenv';
import { ulid } from 'ulid';

import { db } from './index';
import { scenarioSystems, tags } from './schema';

config({ path: '.env.local' });

/**
 * シードデータを投入する
 */
async function seed() {
  console.log('🌱 Seeding database...');

  try {
    // システムデータ
    const systems = [
      { systemId: ulid(), name: 'クトゥルフ神話TRPG（CoC6版）' },
      { systemId: ulid(), name: '新クトゥルフ神話TRPG（CoC7版）' },
      { systemId: ulid(), name: 'ソード・ワールド2.5' },
      { systemId: ulid(), name: 'インセイン' },
      { systemId: ulid(), name: 'エモクロアTRPG' },
      { systemId: ulid(), name: 'シノビガミ' },
      { systemId: ulid(), name: 'ダブルクロス The 3rd Edition' },
      { systemId: ulid(), name: 'アリアンロッドRPG 2E' },
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

    console.log('✨ Seeding completed!');
  } catch (error) {
    console.error('❌ Seeding failed:', error);
    process.exit(1);
  }

  process.exit(0);
}

seed();
