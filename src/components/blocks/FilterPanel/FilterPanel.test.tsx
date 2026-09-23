import { act, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { NuqsTestingAdapter, type UrlUpdateEvent } from 'nuqs/adapters/testing';
import { describe, expect, it, vi } from 'vitest';

import { FilterPanel } from './FilterPanel';
import { useFilterState } from './useFilterState';

const ImmediateFilters = () => (
  <FilterPanel systems={[]} tags={[]} filterState={useFilterState()} />
);

const setup = (query: string) => {
  const onUrlUpdate = vi.fn<(event: UrlUpdateEvent) => void>();
  const view = (searchParams: string) => (
    <NuqsTestingAdapter
      searchParams={searchParams}
      hasMemory
      onUrlUpdate={onUrlUpdate}
    >
      <ImmediateFilters />
    </NuqsTestingAdapter>
  );
  const { rerender } = render(view(query));
  return {
    user: userEvent.setup(),
    onUrlUpdate,
    navigate: (searchParams: string) => rerender(view(searchParams)),
  };
};

describe('FilterPanelの即時適用モード', () => {
  it.each([
    ['プレイ人数', '2人 ～ 10人+', '1人 ～ 10人+'],
    ['プレイ時間', '2h ～ 20h+', '1h ～ 20h+'],
  ])('URL未設定の%sも、編集直後のクリアで表示を初期値に戻す', async (name, edited, cleared) => {
    const { user, onUrlUpdate } = setup('?tags=tag1');
    const [minimum] = await screen.findAllByRole('slider', { name });
    minimum?.focus();
    await user.keyboard('{ArrowRight}');
    expect(screen.getByText(edited)).toBeVisible();
    await user.click(
      screen.getByRole('button', { name: 'フィルターをクリア' }),
    );
    expect(screen.getByText(cleared)).toBeVisible();
    await waitFor(() => expect(onUrlUpdate).toHaveBeenCalledTimes(1));
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 400));
    });
    expect(onUrlUpdate).toHaveBeenCalledTimes(1);
    expect(onUrlUpdate.mock.lastCall?.[0].queryString).toBe('');
    expect(screen.getByText(cleared)).toBeVisible();
  });

  it('編集直後のクリアで保留中の検索も取り消し、条件を復活させない', async () => {
    const { user, onUrlUpdate } = setup('?minPlayer=3');
    const [minPlayer] = await screen.findAllByRole('slider', {
      name: 'プレイ人数',
    });
    minPlayer?.focus();
    await user.keyboard('{ArrowRight}');
    expect(screen.getByText('4人 ～ 10人+')).toBeVisible();
    await user.click(
      screen.getByRole('button', { name: 'フィルターをクリア' }),
    );
    await waitFor(() => expect(onUrlUpdate).toHaveBeenCalledTimes(1));
    // debounceの300msが過ぎても、クリア済みのURLと表示を維持する。
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 400));
    });
    expect(onUrlUpdate).toHaveBeenCalledTimes(1);
    expect(onUrlUpdate.mock.lastCall?.[0].queryString).toBe('');
    expect(screen.getByText('1人 ～ 10人+')).toBeVisible();
  });

  it('URLへ反映される前も連続キー操作を表示し、確定後も値を維持する', async () => {
    const { user, onUrlUpdate } = setup('');
    const [minPlayer] = await screen.findAllByRole('slider', {
      name: 'プレイ人数',
    });
    expect(minPlayer).toBeDefined();
    minPlayer?.focus();
    await user.keyboard('{ArrowRight}{ArrowRight}');
    expect(screen.getByText('3人 ～ 10人+')).toBeVisible();
    expect(onUrlUpdate).not.toHaveBeenCalled();
    await waitFor(() => expect(onUrlUpdate).toHaveBeenCalledTimes(1));
    expect(onUrlUpdate.mock.calls[0]?.[0].searchParams.get('minPlayer')).toBe(
      '3',
    );
    await waitFor(() => expect(screen.getByText('3人 ～ 10人+')).toBeVisible());
  });

  it('クリアとURLの履歴移動を人数・時間の両方へ反映する', async () => {
    const { user, onUrlUpdate, navigate } = setup(
      '?minPlayer=3&maxPlayer=5&minPlaytime=4&maxPlaytime=8',
    );
    await user.click(
      screen.getByRole('button', { name: 'フィルターをクリア' }),
    );
    await waitFor(() => expect(screen.getByText('1人 ～ 10人+')).toBeVisible());
    expect(screen.getByText('1h ～ 20h+')).toBeVisible();
    await waitFor(() => expect(onUrlUpdate).toHaveBeenCalledTimes(1));
    expect(onUrlUpdate.mock.calls[0]?.[0].queryString).toBe('');

    navigate('?minPlayer=2&maxPlayer=4&minPlaytime=2&maxPlaytime=6');
    await waitFor(() => expect(screen.getByText('2人 ～ 4人')).toBeVisible());
    expect(screen.getByText('2h ～ 6h')).toBeVisible();
  });
});
