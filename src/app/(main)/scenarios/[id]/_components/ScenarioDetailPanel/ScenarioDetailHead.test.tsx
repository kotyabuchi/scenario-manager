import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { scenarioFixture } from './fixtures';
import { ScenarioDetailHead } from './ScenarioDetailHead';

describe('ScenarioDetailHead', () => {
  it('タイトル、システム、タグ、人数、時間、評価を表示する', () => {
    render(
      <ScenarioDetailHead
        scenario={scenarioFixture}
        badges={[{ label: '募集中', variant: 'recruiting' }]}
      />,
    );
    expect(
      screen.getByRole('heading', { level: 1, name: scenarioFixture.name }),
    ).toBeInTheDocument();
    for (const text of [
      'クトゥルフ神話TRPG',
      'クローズド',
      '3〜4人',
      '4〜6時間',
      '名無しのGM',
      '秘匿HO',
      '募集中',
    ]) {
      expect(screen.getByText(text)).toBeInTheDocument();
    }
    expect(
      screen.getByRole('img', { name: '評価 4.3（12件）' }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('img', { name: scenarioFixture.name }),
    ).toBeInTheDocument();
  });

  it('外部の配布ページを安全な別タブで開く', () => {
    render(<ScenarioDetailHead scenario={scenarioFixture} />);
    const link = screen.getByRole('link', { name: '配布ページを開く' });
    expect(link).toHaveAttribute('href', scenarioFixture.distributeUrl);
    expect(link).toHaveAttribute('target', '_blank');
    expect(link).toHaveAttribute('rel', 'noopener noreferrer');
  });

  it('配布元がBoothのときは配布リンクとともに出典を示す', () => {
    render(
      <ScenarioDetailHead
        scenario={{ ...scenarioFixture, sourceType: 'booth' }}
      />,
    );
    expect(screen.getByText('Booth')).toBeInTheDocument();
    expect(
      screen.getByRole('link', { name: '配布ページを開く' }),
    ).toBeInTheDocument();
  });

  it('画像・作者・評価・タグ・配布URLがなくても最低限の情報を表示する', () => {
    render(
      <ScenarioDetailHead
        scenario={{
          ...scenarioFixture,
          scenarioImageUrl: null,
          author: null,
          avgRating: null,
          reviewCount: 0,
          tags: [],
          distributeUrl: null,
          minPlayer: null,
          maxPlayer: null,
          minPlaytime: null,
          maxPlaytime: null,
        }}
      />,
    );
    expect(
      screen.getByRole('heading', { name: scenarioFixture.name }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole('img', { name: scenarioFixture.name }),
    ).not.toBeInTheDocument();
    expect(screen.queryByRole('img', { name: /評価/ })).not.toBeInTheDocument();
    expect(screen.queryByText('作者')).not.toBeInTheDocument();
    expect(
      screen.queryByRole('link', { name: '配布ページを開く' }),
    ).not.toBeInTheDocument();
    expect(screen.getAllByText('-')).toHaveLength(2);
  });

  it.each([
    ['NONE', 'HOなし'],
    ['PUBLIC', '公開HO'],
    ['SECRET', '秘匿HO'],
  ] as const)('ハンドアウト種別%sを%sと表示する', (handoutType, label) => {
    render(
      <ScenarioDetailHead scenario={{ ...scenarioFixture, handoutType }} />,
    );
    expect(screen.getByText(label)).toBeInTheDocument();
  });

  it('長いタイトル・作者名を省略せず保持する', () => {
    const name = '長いシナリオのタイトル'.repeat(10);
    const author = '長い作者名'.repeat(10);
    render(
      <ScenarioDetailHead scenario={{ ...scenarioFixture, name, author }} />,
    );
    expect(screen.getByRole('heading', { name })).toHaveTextContent(name);
    expect(screen.getByText(author)).toBeInTheDocument();
  });
});
