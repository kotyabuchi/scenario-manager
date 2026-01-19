import { eq } from 'drizzle-orm';

import { db } from '@/db';
import { scenarios, scenarioTags, tags } from '@/db/schema';

/**
 * テストデータを追加するスクリプト
 * - 一部のシナリオにサムネイル画像を設定
 * - 一部のシナリオにタグを追加
 */
export async function addTestData() {
  console.log('Adding test data...');

  // 既存のタグを取得
  const existingTags = await db.select().from(tags).limit(5);
  console.log(
    'Found tags:',
    existingTags.map((t) => t.name),
  );

  if (existingTags.length === 0) {
    console.log('No tags found. Please seed tags first.');
    return;
  }

  // 最初の10件のシナリオを取得
  const existingScenarios = await db.select().from(scenarios).limit(10);
  console.log('Found scenarios:', existingScenarios.length);

  if (existingScenarios.length === 0) {
    console.log('No scenarios found.');
    return;
  }

  // 奇数インデックスのシナリオにサムネイル画像を設定
  for (let i = 0; i < existingScenarios.length; i++) {
    const scenario = existingScenarios[i];
    if (!scenario) continue;
    if (i % 2 === 0) {
      // 偶数インデックスにサムネイル画像を設定
      await db
        .update(scenarios)
        .set({ scenarioImageUrl: '/scenario-image.jpg' })
        .where(eq(scenarios.scenarioId, scenario.scenarioId));
      console.log(`Updated scenario ${scenario.name} with image`);
    }

    // すべてのシナリオに2-3個のランダムなタグを追加
    const numTags = Math.min(2 + (i % 2), existingTags.length);
    for (let j = 0; j < numTags; j++) {
      const tagIndex = (i + j) % existingTags.length;
      const tag = existingTags[tagIndex];
      if (!tag) continue;

      try {
        await db
          .insert(scenarioTags)
          .values({
            scenarioId: scenario.scenarioId,
            tagId: tag.tagId,
          })
          .onConflictDoNothing();
        console.log(`Added tag ${tag.name} to ${scenario.name}`);
      } catch {
        // すでに存在する場合は無視
      }
    }
  }

  console.log('Test data added successfully!');
}

// CLIから実行可能にする
if (require.main === module) {
  addTestData()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error(err);
      process.exit(1);
    });
}
