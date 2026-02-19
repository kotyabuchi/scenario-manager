import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { Select } from './select';

const mockItems = [
  { label: 'りんご', value: 'apple' },
  { label: 'バナナ', value: 'banana' },
  { label: 'オレンジ', value: 'orange' },
];

const mockItemsWithDisabled = [
  { label: 'りんご', value: 'apple' },
  { label: 'バナナ', value: 'banana', disabled: true },
  { label: 'オレンジ', value: 'orange' },
];

describe('Select', () => {
  it('プレースホルダーを表示できる', () => {
    render(
      <Select
        items={mockItems}
        placeholder="果物を選択"
        onValueChange={vi.fn()}
      />,
    );
    expect(screen.getByText('果物を選択')).toBeInTheDocument();
  });

  it('選択中の値を表示できる', () => {
    render(
      <Select items={mockItems} value={['apple']} onValueChange={vi.fn()} />,
    );
    // トリガー要素内に選択された値が表示される
    const trigger = screen.getByRole('combobox');
    expect(trigger).toHaveTextContent('りんご');
  });

  it('クリックでドロップダウンが開く', async () => {
    const user = userEvent.setup();

    render(<Select items={mockItems} onValueChange={vi.fn()} />);

    const trigger = screen.getByRole('combobox');
    await user.click(trigger);

    await waitFor(() => {
      expect(screen.getByRole('listbox')).toBeInTheDocument();
    });
  });

  it('disabled状態では開かない', async () => {
    const user = userEvent.setup();

    render(<Select items={mockItems} disabled onValueChange={vi.fn()} />);

    const trigger = screen.getByRole('combobox');
    expect(trigger).toHaveAttribute('data-disabled', '');

    await user.click(trigger);

    expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
  });

  it('コンポーネントが正しくレンダリングされる', () => {
    render(
      <Select
        items={mockItems}
        value={['banana']}
        placeholder="選択してください"
        name="fruit"
        onValueChange={vi.fn()}
      />,
    );

    const trigger = screen.getByRole('combobox');
    expect(trigger).toBeInTheDocument();
    expect(trigger).toHaveTextContent('バナナ');
  });

  it('複数選択モードでレンダリングできる', () => {
    render(<Select items={mockItems} multiple onValueChange={vi.fn()} />);

    const trigger = screen.getByRole('combobox');
    expect(trigger).toBeInTheDocument();
  });

  describe('選択済みアイテム', () => {
    it('選択済みアイテムにdata-state="checked"属性が付与される', async () => {
      const user = userEvent.setup();

      render(
        <Select items={mockItems} value={['apple']} onValueChange={vi.fn()} />,
      );

      const trigger = screen.getByRole('combobox');
      await user.click(trigger);

      await waitFor(() => {
        const selectedItem = screen.getByRole('option', { name: 'りんご' });
        // Ark UIは data-state="checked" を使用
        expect(selectedItem).toHaveAttribute('data-state', 'checked');
      });
    });

    it('シングルセレクトでは選択状態がdata-stateで表現される（アイコンなし）', async () => {
      const user = userEvent.setup();

      render(
        <Select items={mockItems} value={['apple']} onValueChange={vi.fn()} />,
      );

      const trigger = screen.getByRole('combobox');
      await user.click(trigger);

      await waitFor(() => {
        const selectedItem = screen.getByRole('option', { name: 'りんご' });
        // シングルセレクトでは背景色で選択状態を表現（アイコンなし）
        expect(selectedItem).toHaveAttribute('data-state', 'checked');
        const svg = selectedItem.querySelector('svg');
        expect(svg).not.toBeInTheDocument();
      });
    });
  });

  describe('マルチセレクトのチェックアイコン', () => {
    it('マルチセレクトモードでアイテムにチェックアイコンが左側に表示される', async () => {
      const user = userEvent.setup();

      render(
        <Select
          items={mockItems}
          value={['apple']}
          multiple
          onValueChange={vi.fn()}
        />,
      );

      const trigger = screen.getByRole('combobox');
      await user.click(trigger);

      await waitFor(() => {
        const selectedItem = screen.getByRole('option', { name: 'りんご' });
        // チェックアイコンが data-icon="checked" を持つ
        const checkedIcon = selectedItem.querySelector('[data-icon="checked"]');
        expect(checkedIcon).toBeInTheDocument();
      });
    });

    it('マルチセレクトモードで未選択アイテムに空チェックボックスが表示される', async () => {
      const user = userEvent.setup();

      render(
        <Select
          items={mockItems}
          value={['apple']}
          multiple
          onValueChange={vi.fn()}
        />,
      );

      const trigger = screen.getByRole('combobox');
      await user.click(trigger);

      await waitFor(() => {
        const uncheckedItem = screen.getByRole('option', { name: 'バナナ' });
        // 未選択アイコンが data-icon="unchecked" を持つ
        const uncheckedIcon = uncheckedItem.querySelector(
          '[data-icon="unchecked"]',
        );
        expect(uncheckedIcon).toBeInTheDocument();
      });
    });

    it('シングルセレクトモードではチェックボックスアイコンが表示されない', async () => {
      const user = userEvent.setup();

      render(
        <Select items={mockItems} value={['apple']} onValueChange={vi.fn()} />,
      );

      const trigger = screen.getByRole('combobox');
      await user.click(trigger);

      await waitFor(() => {
        const item = screen.getByRole('option', { name: 'りんご' });
        // data-icon属性を持つ要素が存在しない
        const iconElement = item.querySelector('[data-icon]');
        expect(iconElement).not.toBeInTheDocument();
      });
    });

    it('マルチセレクトモードでContentにdata-multiple属性が付与される', async () => {
      const user = userEvent.setup();

      render(<Select items={mockItems} multiple onValueChange={vi.fn()} />);

      const trigger = screen.getByRole('combobox');
      await user.click(trigger);

      await waitFor(() => {
        const listbox = screen.getByRole('listbox');
        expect(listbox).toHaveAttribute('data-multiple');
      });
    });
  });

  describe('無効アイテム', () => {
    it('無効アイテムにdata-disabled属性が付与される', async () => {
      const user = userEvent.setup();

      render(<Select items={mockItemsWithDisabled} onValueChange={vi.fn()} />);

      const trigger = screen.getByRole('combobox');
      await user.click(trigger);

      await waitFor(() => {
        const disabledItem = screen.getByRole('option', { name: 'バナナ' });
        expect(disabledItem).toHaveAttribute('data-disabled');
      });
    });

    it('無効アイテムをクリックしても選択されない', async () => {
      const user = userEvent.setup();
      const onValueChange = vi.fn();

      render(
        <Select items={mockItemsWithDisabled} onValueChange={onValueChange} />,
      );

      const trigger = screen.getByRole('combobox');
      await user.click(trigger);

      await waitFor(() => {
        expect(screen.getByRole('listbox')).toBeInTheDocument();
      });

      const disabledItem = screen.getByRole('option', { name: 'バナナ' });
      await user.click(disabledItem);

      // 無効アイテムをクリックしてもonValueChangeは呼ばれない
      expect(onValueChange).not.toHaveBeenCalled();
    });
  });

  describe('キーボード操作', () => {
    it('矢印キーでアイテムをハイライトできる', async () => {
      const user = userEvent.setup();

      render(<Select items={mockItems} onValueChange={vi.fn()} />);

      const trigger = screen.getByRole('combobox');
      await user.click(trigger);

      await waitFor(() => {
        expect(screen.getByRole('listbox')).toBeInTheDocument();
      });

      // 矢印下キーでハイライト
      await user.keyboard('{ArrowDown}');

      await waitFor(() => {
        const items = screen.getAllByRole('option');
        // 最初のアイテムがハイライトされる
        expect(items[0]).toHaveAttribute('data-highlighted');
      });
    });

    // Note: jsdom環境ではArk UIのscrollTo関数が未実装のためスキップ
    // キーボード選択のテストはE2E（Playwright）で実施
    it.skip('Enterキーで選択できる', async () => {
      const user = userEvent.setup();
      const onValueChange = vi.fn();

      render(<Select items={mockItems} onValueChange={onValueChange} />);

      const trigger = screen.getByRole('combobox');
      await user.click(trigger);

      await waitFor(() => {
        expect(screen.getByRole('listbox')).toBeInTheDocument();
      });

      await user.keyboard('{ArrowDown}');
      await user.keyboard('{Enter}');

      expect(onValueChange).toHaveBeenCalled();
    });

    it('Escapeキーでドロップダウンを閉じる', async () => {
      const user = userEvent.setup();

      render(<Select items={mockItems} onValueChange={vi.fn()} />);

      const trigger = screen.getByRole('combobox');
      await user.click(trigger);

      await waitFor(() => {
        expect(screen.getByRole('listbox')).toBeInTheDocument();
      });

      await user.keyboard('{Escape}');

      await waitFor(() => {
        expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
      });
    });
  });
});
