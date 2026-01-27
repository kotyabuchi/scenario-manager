import { composeStories } from '@storybook/react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import * as stories from './tags-input.stories';

const {
  Default,
  WithTags,
  Required,
  Disabled,
  WithError,
  WithSuggestions,
  MaxTags,
} = composeStories(stories);

describe('TagsInput', () => {
  describe('レンダリング', () => {
    // TGI-01: デフォルト状態で正しく表示される
    it('デフォルト状態で正しく表示される', () => {
      render(<Default />);

      expect(screen.getByRole('listbox')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('タグを追加...')).toBeInTheDocument();
    });

    // TGI-02: ラベルが表示される
    it('ラベルが表示される', () => {
      render(<Default />);

      expect(screen.getByText('Tags')).toBeInTheDocument();
    });

    // TGI-03: タグが表示される
    it('タグが表示される', () => {
      render(<WithTags />);

      expect(screen.getByText('ホラー')).toBeInTheDocument();
      expect(screen.getByText('探索')).toBeInTheDocument();
    });

    // TGI-04: 必須マークが表示される
    it('必須マークが表示される', () => {
      render(<Required />);

      expect(screen.getByText('*')).toBeInTheDocument();
    });
  });

  describe('タグ追加', () => {
    // TGI-05: タグを追加できる
    it('タグを追加できる', async () => {
      const user = userEvent.setup();
      const handleValueChange = vi.fn();

      render(<Default onValueChange={handleValueChange} />);

      const input = screen.getByPlaceholderText('タグを追加...');
      await user.type(input, '新しいタグ{Enter}');

      expect(handleValueChange).toHaveBeenCalledWith(
        expect.objectContaining({ value: ['新しいタグ'] }),
      );
    });

    // TGI-06: onValueChangeが呼ばれる
    it('onValueChangeが呼ばれる', async () => {
      const user = userEvent.setup();
      const handleValueChange = vi.fn();

      render(<Default onValueChange={handleValueChange} />);

      const input = screen.getByPlaceholderText('タグを追加...');
      await user.type(input, 'テスト{Enter}');

      expect(handleValueChange).toHaveBeenCalled();
    });
  });

  describe('タグ削除', () => {
    // TGI-07: タグを削除できる
    it('タグを削除できる', async () => {
      const user = userEvent.setup();
      const handleValueChange = vi.fn();

      render(<WithTags onValueChange={handleValueChange} />);

      const removeButton = screen.getByRole('button', { name: 'ホラーを削除' });
      await user.click(removeButton);

      expect(handleValueChange).toHaveBeenCalledWith(
        expect.objectContaining({ value: ['探索'] }),
      );
    });

    // TGI-08: Backspaceで最後のタグを削除できる
    it('Backspaceで最後のタグを削除できる', async () => {
      const user = userEvent.setup();
      const handleValueChange = vi.fn();

      render(<WithTags onValueChange={handleValueChange} />);

      const input = screen.getByRole('textbox');
      await user.click(input);
      await user.keyboard('{Backspace}');

      expect(handleValueChange).toHaveBeenCalledWith(
        expect.objectContaining({ value: ['ホラー'] }),
      );
    });
  });

  describe('サジェスト', () => {
    // TGI-09: サジェストが表示される
    it('サジェストが表示される', async () => {
      const user = userEvent.setup();

      render(<WithSuggestions />);

      const input = screen.getByRole('textbox');
      await user.type(input, '探');

      expect(screen.getByText('探索')).toBeInTheDocument();
      expect(screen.getByText('探偵')).toBeInTheDocument();
    });

    // TGI-10: サジェストから選択できる
    it('サジェストから選択できる', async () => {
      const user = userEvent.setup();
      const handleValueChange = vi.fn();

      render(<WithSuggestions onValueChange={handleValueChange} />);

      const input = screen.getByRole('textbox');
      await user.type(input, '探');
      await user.click(screen.getByRole('button', { name: '探索' }));

      expect(handleValueChange).toHaveBeenCalledWith(
        expect.objectContaining({ value: ['探索'] }),
      );
    });
  });

  describe('エラー状態', () => {
    // TGI-11: エラー状態が正しく表示される
    it('エラー状態が正しく表示される', () => {
      render(<WithError />);

      expect(
        screen.getByText('タグを1つ以上入力してください'),
      ).toBeInTheDocument();
    });
  });

  describe('無効状態', () => {
    // TGI-12: disabled時は操作できない
    it('disabled時は操作できない', () => {
      render(<Disabled />);

      const input = screen.getByRole('textbox');
      expect(input).toBeDisabled();

      // 削除ボタンも表示されない
      expect(
        screen.queryByRole('button', { name: 'ホラーを削除' }),
      ).not.toBeInTheDocument();
    });

    // TGI-13: disabled属性が設定される
    it('disabled属性が設定される', () => {
      render(<Disabled />);

      const container = screen.getByRole('listbox').parentElement;
      expect(container).toHaveAttribute('data-disabled', '');
    });
  });

  describe('最大タグ数制限', () => {
    // TGI-14: maxTagsで追加制限される
    it('maxTagsで追加制限される', async () => {
      const user = userEvent.setup();
      const handleValueChange = vi.fn();

      render(<MaxTags onValueChange={handleValueChange} />);

      // 既に2つのタグがあり、maxTagsは3
      const input = screen.getByRole('textbox');
      await user.type(input, '新しいタグ{Enter}');

      // 3つ目は追加される
      expect(handleValueChange).toHaveBeenCalledWith(
        expect.objectContaining({ value: ['ホラー', '探索', '新しいタグ'] }),
      );

      // 4つ目は追加されない（入力が無効化される）
      const updatedInput = screen.getByRole('textbox');
      expect(updatedInput).toBeDisabled();
    });
  });

  describe('キーボード操作', () => {
    // TGI-15: Enterでタグを確定できる
    it('Enterでタグを確定できる', async () => {
      const user = userEvent.setup();
      const handleValueChange = vi.fn();

      render(<Default onValueChange={handleValueChange} />);

      const input = screen.getByPlaceholderText('タグを追加...');
      await user.type(input, 'テスト{Enter}');

      expect(handleValueChange).toHaveBeenCalled();
    });

    // TGI-16: Escapeでサジェストを閉じる
    it('Escapeでサジェストを閉じる', async () => {
      const user = userEvent.setup();

      render(<WithSuggestions />);

      const input = screen.getByRole('textbox');
      await user.type(input, '探');

      // サジェストが表示されている
      expect(screen.getByText('探索')).toBeInTheDocument();

      await user.keyboard('{Escape}');

      // サジェストが閉じる
      const listbox = screen.getByRole('listbox');
      expect(listbox).toHaveAttribute('aria-expanded', 'false');
    });
  });

  describe('アクセシビリティ', () => {
    // TGI-17: role="listbox"が設定される
    it('role="listbox"が設定される', () => {
      render(<Default />);

      expect(screen.getByRole('listbox')).toBeInTheDocument();
    });

    // TGI-18: タグにrole="option"が設定される
    it('タグにrole="option"が設定される', () => {
      render(<WithTags />);

      const options = screen.getAllByRole('option');
      expect(options).toHaveLength(2);
    });

    // TGI-19: aria-expandedが設定される
    it('aria-expandedが設定される', async () => {
      const user = userEvent.setup();

      render(<WithSuggestions />);

      const listbox = screen.getByRole('listbox');
      expect(listbox).toHaveAttribute('aria-expanded', 'false');

      const input = screen.getByRole('textbox');
      await user.type(input, '探');

      expect(listbox).toHaveAttribute('aria-expanded', 'true');
    });
  });
});
