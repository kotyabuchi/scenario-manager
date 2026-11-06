import { composeStories } from '@storybook/react';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { NuqsTestingAdapter } from 'nuqs/adapters/testing';
import { describe, expect, it, vi } from 'vitest';

import { createScenario, scenarios, systems, tags } from './fixtures';
import {
  ScenarioListPanel,
  type ScenarioListPanelProps,
} from './ScenarioListPanel';
import * as stories from './ScenarioListPanel.stories';

import { useFilterDraft } from '@/components/blocks/FilterPanel';

const { Default, WithLoadMore, Empty } = composeStories(stories);

const Panel = (props: Partial<Omit<ScenarioListPanelProps, 'draftState'>>) => (
  <ScenarioListPanel
    systems={systems}
    tags={tags}
    draftState={useFilterDraft()}
    scenarios={scenarios.slice(0, 2)}
    totalCount={12}
    sort="newest"
    onSortChange={() => {}}
    {...props}
  />
);

const setup = (
  props: Partial<Omit<ScenarioListPanelProps, 'draftState'>> = {},
) => {
  const view = (nextProps: typeof props) => (
    <NuqsTestingAdapter hasMemory>
      <Panel {...nextProps} />
    </NuqsTestingAdapter>
  );
  const { rerender } = render(view(props));
  return {
    user: userEvent.setup(),
    update: (nextProps: typeof props) => rerender(view(nextProps)),
  };
};

describe('ScenarioListPanel', () => {
  it('全件数と現在取得済みの一覧を区別し、各詳細へのリンクを表示する', () => {
    setup();
    expect(screen.getByText('検索結果：12件')).toBeVisible();
    expect(screen.getAllByRole('heading', { level: 3 })).toHaveLength(2);
    expect(
      screen.getByRole('link', { name: /海辺のあいまいな約束/ }),
    ).toHaveAttribute('href', '/scenarios/scenario-seaside');
    expect(
      screen.getByRole('link', { name: /黄昏の街で、きみに問う/ }),
    ).toHaveAttribute('href', '/scenarios/scenario-twilight');
    expect(
      screen.queryByRole('button', { name: 'もっと見る' }),
    ).not.toBeInTheDocument();
  });

  it.each([
    ['古い順', 'oldest'],
    ['短時間順', 'playtime_asc'],
    ['長時間順', 'playtime_desc'],
  ])('並び替えの「%s」を選ぶと対応する検索値を通知する', async (label, value) => {
    const onSortChange = vi.fn();
    const { user } = setup({ onSortChange });
    await user.click(await screen.findByRole('combobox', { name: '並び替え' }));
    await user.click(await screen.findByRole('option', { name: label }));
    expect(onSortChange).toHaveBeenCalledExactlyOnceWith(value);
  });

  it('追加読込中は再実行を防ぎ、取得済みカードを残す', async () => {
    const onLoadMore = vi.fn();
    const { user, update } = setup({ hasMore: true, onLoadMore });
    await user.click(screen.getByRole('button', { name: 'もっと見る' }));
    expect(onLoadMore).toHaveBeenCalledTimes(1);
    update({ hasMore: true, isLoadingMore: true, onLoadMore });
    const loadingButton = screen.getByRole('button', { name: /読み込み中/ });
    expect(loadingButton).toBeDisabled();
    await user.click(loadingButton);
    expect(onLoadMore).toHaveBeenCalledTimes(1);
    expect(screen.getAllByRole('heading', { level: 3 })).toHaveLength(2);
  });

  it('検索中は空結果を表示せず、読込状態を通知する', () => {
    setup({ scenarios: [], totalCount: 0, isLoading: true });
    expect(screen.getByRole('status', { name: '検索中' })).toHaveAttribute(
      'aria-busy',
      'true',
    );
    expect(
      screen.queryByText('条件に一致するシナリオが見つかりませんでした'),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: '条件をリセット' }),
    ).not.toBeInTheDocument();
  });

  it('空結果から条件をリセットでき、登録ダイアログへ進める', async () => {
    const onResetFilters = vi.fn();
    const { user } = setup({ scenarios: [], totalCount: 0, onResetFilters });
    expect(screen.getByText('検索結果：0件')).toBeVisible();
    await user.click(screen.getByRole('button', { name: '条件をリセット' }));
    expect(onResetFilters).toHaveBeenCalledTimes(1);
    await user.click(
      screen.getByRole('button', { name: 'シナリオを登録する' }),
    );
    const dialog = await screen.findByRole('dialog', {
      name: 'シナリオを登録',
    });
    expect(
      within(dialog).getByRole('link', { name: '手動で入力' }),
    ).toHaveAttribute('href', '/scenarios/new');
  });

  it('画像と人数・時間がなくても長いタイトルと詳細リンクを保持する', () => {
    const name =
      '非常に長いシナリオ名でも詳細へ移動できることを確認する物語'.repeat(3);
    setup({
      scenarios: [
        createScenario({
          name,
          description: null,
          tags: [],
          minPlayer: null,
          maxPlayer: null,
          minPlaytime: null,
          maxPlaytime: null,
        }),
      ],
      totalCount: 1,
    });
    expect(screen.getByRole('heading', { name })).toBeVisible();
    expect(screen.getByRole('link')).toHaveAttribute(
      'href',
      '/scenarios/scenario-seaside',
    );
    expect(screen.getByText('No Image')).toBeVisible();
    expect(screen.queryByRole('img')).not.toBeInTheDocument();
  });
});

describe('操作用Story', () => {
  it('空の一覧では未確定のキーワードも条件をリセットで消せる', async () => {
    const user = userEvent.setup();
    render(<Empty />);
    await user.type(
      screen.getByRole('searchbox', { name: 'フリーワード検索' }),
      '未確定の入力',
    );
    await user.click(screen.getByRole('button', { name: '条件をリセット' }));
    expect(
      screen.getByRole('searchbox', { name: 'フリーワード検索' }),
    ).toHaveValue('');
  });

  it('キーワードは検索してから結果へ反映し、空結果からリセットできる', async () => {
    const user = userEvent.setup();
    render(<Default />);
    await user.type(
      screen.getByRole('searchbox', { name: 'フリーワード検索' }),
      '存在しないタイトル',
    );
    expect(screen.getByText('検索結果：6件')).toBeVisible();
    await user.click(screen.getByRole('button', { name: 'この条件で検索' }));
    await screen.findByText('検索結果：0件');
    await user.click(screen.getByRole('button', { name: '条件をリセット' }));
    await screen.findByText('検索結果：6件');
    expect(
      screen.getByRole('searchbox', { name: 'フリーワード検索' }),
    ).toHaveValue('');
  });

  it('追加読込で残りのカードを表示し、最終ページでボタンを隠す', async () => {
    const user = userEvent.setup();
    render(<WithLoadMore />);
    expect(screen.getAllByRole('heading', { level: 3 })).toHaveLength(3);
    await user.click(screen.getByRole('button', { name: 'もっと見る' }));
    expect(screen.getAllByRole('heading', { level: 3 })).toHaveLength(6);
    expect(
      screen.queryByRole('button', { name: 'もっと見る' }),
    ).not.toBeInTheDocument();
  });

  it('並び替えの選択に応じてカードの順番も変わる', async () => {
    const user = userEvent.setup();
    render(<Default />);
    expect(screen.getAllByRole('heading', { level: 3 })[0]).toHaveTextContent(
      '終末にさよなら',
    );
    await user.click(await screen.findByRole('combobox', { name: '並び替え' }));
    await user.click(await screen.findByRole('option', { name: '古い順' }));
    await waitFor(() =>
      expect(screen.getAllByRole('heading', { level: 3 })[0]).toHaveTextContent(
        '海辺のあいまいな約束',
      ),
    );
  });
});
