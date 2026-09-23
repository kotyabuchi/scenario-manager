import { describe, expect, it } from 'vitest';

import {
  agentationPreviewPath,
  rewriteAgentationPreviewUrl,
} from '../../.storybook/storybookAgentationPaths';

describe('StorybookのAgentationプレビューURL', () => {
  it('Storyごとに異なるpathnameを作り、元の検索条件を保持して配信する', () => {
    const first = agentationPreviewPath('scenarios-card--default');
    const second = agentationPreviewPath('scenarios-card--empty');

    expect(first).not.toBe(second);
    expect(
      rewriteAgentationPreviewUrl(`${first}?id=scenarios-card--default`),
    ).toBe('/iframe.html?id=scenarios-card--default');
    expect(
      rewriteAgentationPreviewUrl(`${second}?id=scenarios-card--empty`),
    ).toBe('/iframe.html?id=scenarios-card--empty');
  });

  it('通常のURLや名前が一致しないURLは書き換えない', () => {
    expect(rewriteAgentationPreviewUrl('/iframe.html?id=example')).toBeNull();
    expect(
      rewriteAgentationPreviewUrl('/__agentation__/story/example/other.html'),
    ).toBeNull();
  });
});
