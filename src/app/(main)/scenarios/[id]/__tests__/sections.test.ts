import { describe, expect, it } from 'vitest';

import { scenarioFixture } from '../_components/ScenarioDetailPanel/fixtures';
import { getScenarioDetailSections } from '../sections';

describe('getScenarioDetailSections', () => {
  it('表示される本文のアンカーを順番どおりに返す', () => {
    expect(
      getScenarioDetailSections(scenarioFixture).map((section) => section.id),
    ).toEqual(['info', 'overview', 'sessions', 'videos', 'comments']);
  });

  it('概要がない場合は存在しないアンカーを目次に出さない', () => {
    expect(
      getScenarioDetailSections({ ...scenarioFixture, description: null }).map(
        (section) => section.id,
      ),
    ).toEqual(['info', 'sessions', 'videos', 'comments']);
  });
});
