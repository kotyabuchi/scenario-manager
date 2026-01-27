import { composeStories } from '@storybook/react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import * as stories from './textarea.stories';

const { Default, Sizes, Disabled, WithValue, LongText, WithMaxLength } =
  composeStories(stories);

describe('Textarea', () => {
  describe('レンダリング', () => {
    // TXA-01: デフォルト状態で正しくレンダリングされる
    it('デフォルト状態でレンダリングできる', () => {
      render(<Default />);

      expect(screen.getByRole('textbox')).toBeInTheDocument();
    });

    // TXA-02: placeholderが表示される
    it('placeholderが表示される', () => {
      render(<Default />);

      expect(screen.getByPlaceholderText('テキストを入力')).toBeInTheDocument();
    });

    // TXA-03: defaultValueが表示される
    it('defaultValueが表示される', () => {
      render(<WithValue />);

      const textarea = screen.getByRole('textbox');
      expect(textarea).toHaveValue(
        'これは入力済みのテキストです。\n複数行にわたる長いテキストを入力できます。\nテキストエリアは縦方向にリサイズ可能です。',
      );
    });
  });

  describe('サイズバリエーション', () => {
    // TXA-04: size="sm"が正しく表示される
    it('size="sm"がレンダリングできる', () => {
      render(<Sizes />);

      expect(screen.getByPlaceholderText('Small')).toBeInTheDocument();
    });

    // TXA-05: size="md"が正しく表示される
    it('size="md"がレンダリングできる', () => {
      render(<Sizes />);

      expect(
        screen.getByPlaceholderText('Medium（デフォルト）'),
      ).toBeInTheDocument();
    });

    // TXA-06: size="lg"が正しく表示される
    it('size="lg"がレンダリングできる', () => {
      render(<Sizes />);

      expect(screen.getByPlaceholderText('Large')).toBeInTheDocument();
    });
  });

  describe('インタラクション', () => {
    // TXA-07: 入力時にonChangeが呼ばれる
    it('入力時にonChangeが呼ばれる', async () => {
      const user = userEvent.setup();
      const handleChange = vi.fn();

      render(<Default onChange={handleChange} />);

      const textarea = screen.getByRole('textbox');
      await user.type(textarea, 'テスト入力');

      expect(handleChange).toHaveBeenCalled();
    });

    // TXA-08: フォーカス時にonFocusが呼ばれる
    it('フォーカス時にonFocusが呼ばれる', async () => {
      const user = userEvent.setup();
      const handleFocus = vi.fn();

      render(<Default onFocus={handleFocus} />);

      const textarea = screen.getByRole('textbox');
      await user.click(textarea);

      expect(handleFocus).toHaveBeenCalled();
    });

    // TXA-09: フォーカス離脱時にonBlurが呼ばれる
    it('フォーカス離脱時にonBlurが呼ばれる', async () => {
      const user = userEvent.setup();
      const handleBlur = vi.fn();

      render(<Default onBlur={handleBlur} />);

      const textarea = screen.getByRole('textbox');
      await user.click(textarea);
      await user.tab();

      expect(handleBlur).toHaveBeenCalled();
    });
  });

  describe('無効状態', () => {
    // TXA-10: disabled時は入力できない
    it('disabled状態では入力できない', async () => {
      const user = userEvent.setup();
      const handleChange = vi.fn();

      render(<Disabled onChange={handleChange} />);

      const textarea = screen.getByRole('textbox');
      expect(textarea).toBeDisabled();

      await user.type(textarea, 'テスト');
      expect(handleChange).not.toHaveBeenCalled();
    });
  });

  describe('行数指定', () => {
    // TXA-11: rows属性が設定される
    it('rows属性が正しく設定される', () => {
      render(<LongText />);

      const textarea = screen.getByRole('textbox');
      expect(textarea).toHaveAttribute('rows', '10');
    });
  });

  describe('文字数制限', () => {
    // TXA-12: maxLength属性が設定される
    it('maxLength属性が正しく設定される', () => {
      render(<WithMaxLength />);

      const textarea = screen.getByRole('textbox');
      expect(textarea).toHaveAttribute('maxLength', '200');
    });
  });

  describe('キーボード操作', () => {
    // TXA-13: Tabでフォーカスできる
    it('Tabでフォーカスできる', async () => {
      const user = userEvent.setup();

      render(<Default />);

      await user.tab();

      const textarea = screen.getByRole('textbox');
      expect(textarea).toHaveFocus();
    });
  });

  describe('アクセシビリティ', () => {
    // TXA-14: role="textbox"が設定される
    it('role="textbox"が設定される', () => {
      render(<Default />);

      expect(screen.getByRole('textbox')).toBeInTheDocument();
    });

    // TXA-15: フォーカス可能
    it('フォーカス可能', () => {
      render(<Default />);

      const textarea = screen.getByRole('textbox');
      textarea.focus();
      expect(textarea).toHaveFocus();
    });
  });

  describe('エラーケース', () => {
    // TXA-16: 空のvalueでもクラッシュしない
    it('空のvalueでもクラッシュしない', () => {
      render(<Default value="" />);

      expect(screen.getByRole('textbox')).toBeInTheDocument();
    });
  });
});
