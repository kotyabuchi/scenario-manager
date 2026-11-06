import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { NuqsTestingAdapter, type UrlUpdateEvent } from 'nuqs/adapters/testing';
import { describe, expect, it, vi } from 'vitest';

import { ScenarioFilters } from './ScenarioFilters';

import { useFilterDraft } from '@/components/blocks/FilterPanel';

const systems = [
  { systemId: 'coc7', name: 'CoC 7版' },
  { systemId: 'sw25', name: 'ソード・ワールド2.5' },
];
const tags = [{ tagId: 'horror', name: 'ホラー' }];

const Filters = () => (
  <ScenarioFilters
    systems={systems}
    tags={tags}
    draftState={useFilterDraft()}
    defaultExpanded
  />
);

const setup = (searchParams = '') => {
  const onUrlUpdate = vi.fn<(event: UrlUpdateEvent) => void>();
  const view = (query: string) => (
    <NuqsTestingAdapter
      searchParams={query}
      hasMemory
      onUrlUpdate={onUrlUpdate}
    >
      <Filters />
    </NuqsTestingAdapter>
  );
  const { rerender } = render(view(searchParams));
  return {
    user: userEvent.setup(),
    onUrlUpdate,
    navigate: (query: string) => rerender(view(query)),
  };
};

describe('ScenarioFilters', () => {
  it('入力と選択はドラフトに保持し、検索時にまとめてURLへ反映する', async () => {
    const { user, onUrlUpdate } = setup('?sort=oldest');

    await user.type(
      screen.getByRole('searchbox', { name: 'フリーワード検索' }),
      '海辺',
    );
    await user.click(screen.getByRole('button', { name: 'CoC 7版' }));
    await user.click(screen.getByRole('button', { name: 'ホラー' }));
    expect(screen.getByRole('button', { name: 'CoC 7版' })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
    expect(screen.getByRole('button', { name: 'ホラー' })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
    expect(onUrlUpdate).not.toHaveBeenCalled();

    await user.click(screen.getByRole('button', { name: 'この条件で検索' }));
    await waitFor(() => expect(onUrlUpdate).toHaveBeenCalledTimes(1));
    const update = onUrlUpdate.mock.calls[0]?.[0];
    expect(update?.searchParams.get('q')).toBe('海辺');
    expect(update?.searchParams.get('systems')).toBe('coc7');
    expect(update?.searchParams.get('tags')).toBe('horror');
    expect(update?.searchParams.get('sort')).toBe('oldest');
    expect(update?.options).toMatchObject({
      history: 'push',
      shallow: false,
      scroll: false,
    });
  });

  it('同じシステムとタグを再度選ぶとドラフトから解除できる', async () => {
    const { user, onUrlUpdate } = setup('?systems=coc7&tags=horror');
    await user.click(screen.getByRole('button', { name: 'CoC 7版' }));
    await user.click(screen.getByRole('button', { name: 'ホラー' }));
    expect(screen.getByRole('button', { name: 'CoC 7版' })).toHaveAttribute(
      'aria-pressed',
      'false',
    );
    expect(screen.getByRole('button', { name: 'ホラー' })).toHaveAttribute(
      'aria-pressed',
      'false',
    );
    expect(onUrlUpdate).not.toHaveBeenCalled();

    await user.click(screen.getByRole('button', { name: 'この条件で検索' }));
    await waitFor(() => expect(onUrlUpdate).toHaveBeenCalledTimes(1));
    expect(onUrlUpdate.mock.calls[0]?.[0].searchParams.has('systems')).toBe(
      false,
    );
    expect(onUrlUpdate.mock.calls[0]?.[0].searchParams.has('tags')).toBe(false);
  });

  it('キーワードだけ指定した場合もクリアでき、再検索するまでURLは維持する', async () => {
    const { user, onUrlUpdate } = setup('?q=海辺&sort=oldest');
    await user.click(
      screen.getByRole('button', { name: 'フィルターをクリア' }),
    );
    expect(
      screen.getByRole('searchbox', { name: 'フリーワード検索' }),
    ).toHaveValue('');
    expect(onUrlUpdate).not.toHaveBeenCalled();

    await user.click(screen.getByRole('button', { name: 'この条件で検索' }));
    await waitFor(() => expect(onUrlUpdate).toHaveBeenCalledTimes(1));
    expect(onUrlUpdate.mock.calls[0]?.[0].searchParams.has('q')).toBe(false);
    expect(onUrlUpdate.mock.calls[0]?.[0].searchParams.get('sort')).toBe(
      'oldest',
    );
  });

  it('人数と時間のキーボード操作を検索条件へ反映する', async () => {
    const { user, onUrlUpdate } = setup();
    const [minPlayer, maxPlayer] = await screen.findAllByRole('slider', {
      name: 'プレイ人数',
    });
    const [minPlaytime, maxPlaytime] = await screen.findAllByRole('slider', {
      name: 'プレイ時間',
    });
    expect(minPlayer).toBeDefined();
    expect(maxPlayer).toBeDefined();
    expect(minPlaytime).toBeDefined();
    expect(maxPlaytime).toBeDefined();
    minPlayer?.focus();
    await user.keyboard('{ArrowRight}');
    maxPlayer?.focus();
    await user.keyboard('{ArrowLeft}');
    minPlaytime?.focus();
    await user.keyboard('{ArrowRight}');
    maxPlaytime?.focus();
    await user.keyboard('{ArrowLeft}');
    expect(onUrlUpdate).not.toHaveBeenCalled();

    await user.click(screen.getByRole('button', { name: 'この条件で検索' }));
    await waitFor(() => expect(onUrlUpdate).toHaveBeenCalledTimes(1));
    expect(
      Object.fromEntries(onUrlUpdate.mock.calls[0]?.[0].searchParams ?? []),
    ).toMatchObject({
      minPlayer: '2',
      maxPlayer: '9',
      minPlaytime: '2',
      maxPlaytime: '19',
    });
  });

  it('クリアすると人数と時間の表示も制限なしへ戻る', async () => {
    const { user, onUrlUpdate } = setup(
      '?minPlayer=3&maxPlayer=5&minPlaytime=4&maxPlaytime=8',
    );
    expect(screen.getByText('3人 ～ 5人')).toBeVisible();
    expect(screen.getByText('4h ～ 8h')).toBeVisible();
    await user.click(
      screen.getByRole('button', { name: 'フィルターをクリア' }),
    );
    expect(screen.getByText('1人 ～ 10人+')).toBeVisible();
    expect(screen.getByText('1h ～ 20h+')).toBeVisible();
    expect(onUrlUpdate).not.toHaveBeenCalled();
    await user.click(screen.getByRole('button', { name: 'この条件で検索' }));
    await waitFor(() => expect(onUrlUpdate).toHaveBeenCalledTimes(1));
    expect(onUrlUpdate.mock.calls[0]?.[0].queryString).toBe('');
  });

  it('URLを戻すと未確定の入力を含めてキーワードと範囲を同期する', async () => {
    const { user, navigate, onUrlUpdate } = setup(
      '?q=海辺&minPlayer=3&maxPlayer=5&minPlaytime=4&maxPlaytime=8',
    );
    await user.type(
      screen.getByRole('searchbox', { name: 'フリーワード検索' }),
      'の続編',
    );
    navigate('?q=山&minPlayer=2&maxPlayer=4&minPlaytime=1&maxPlaytime=3');
    await waitFor(() =>
      expect(
        screen.getByRole('searchbox', { name: 'フリーワード検索' }),
      ).toHaveValue('山'),
    );
    expect(screen.getByText('2人 ～ 4人')).toBeVisible();
    expect(screen.getByText('1h ～ 3h')).toBeVisible();
    expect(onUrlUpdate).not.toHaveBeenCalled();
  });

  it('詳細フィルターはキーボードで開閉でき、入力を保持する', async () => {
    const { user } = setup('?systems=coc7');
    const trigger = screen.getByRole('button', { name: /詳細フィルター/ });
    trigger.focus();
    await user.keyboard('{Enter}');
    await waitFor(() =>
      expect(trigger).toHaveAttribute('aria-expanded', 'false'),
    );
    await user.keyboard('{Enter}');
    await waitFor(() =>
      expect(trigger).toHaveAttribute('aria-expanded', 'true'),
    );
    expect(screen.getByRole('button', { name: 'CoC 7版' })).toBeVisible();
    expect(
      screen.getByRole('button', { name: 'フィルターをクリア' }),
    ).toBeVisible();
  });
});
