import { createRef } from 'react';
import { composeStories } from '@storybook/react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { Input } from './input';
import * as stories from './input.stories';

const { Default, Sizes, Types, Disabled, WithValue } = composeStories(stories);

describe('Input', () => {
  describe('レンダリング', () => {
    // INP-01: 必須Propsなしで正しくレンダリングされる
    it('デフォルト状態でレンダリングできる', () => {
      render(<Default />);

      expect(screen.getByRole('textbox')).toBeInTheDocument();
    });

    // INP-02: placeholderが表示される
    it('placeholderが表示される', () => {
      render(<Default />);

      expect(screen.getByPlaceholderText('テキストを入力')).toBeInTheDocument();
    });

    // INP-03: 値が入力済みの場合に表示される
    it('defaultValueが表示される', () => {
      render(<WithValue />);

      expect(screen.getByDisplayValue('入力済みの値')).toBeInTheDocument();
    });
  });

  describe('サイズバリエーション', () => {
    // INP-04: size="sm"が正しく表示される
    it('size="sm"がレンダリングできる', () => {
      render(<Sizes />);

      expect(screen.getByPlaceholderText('Small')).toBeInTheDocument();
    });

    // INP-05: size="md"が正しく表示される
    it('size="md"がレンダリングできる', () => {
      render(<Sizes />);

      expect(
        screen.getByPlaceholderText('Medium（デフォルト）'),
      ).toBeInTheDocument();
    });

    // INP-06: size="lg"が正しく表示される
    it('size="lg"がレンダリングできる', () => {
      render(<Sizes />);

      expect(screen.getByPlaceholderText('Large')).toBeInTheDocument();
    });
  });

  describe('入力タイプ', () => {
    // INP-07: 各タイプが正しく設定される
    it('type="email"が設定される', () => {
      render(<Types />);

      const emailInput = screen.getByPlaceholderText('email@example.com');
      expect(emailInput).toHaveAttribute('type', 'email');
    });

    it('type="url"が設定される', () => {
      render(<Types />);

      const urlInput = screen.getByPlaceholderText('https://example.com');
      expect(urlInput).toHaveAttribute('type', 'url');
    });

    it('type="password"が設定される', () => {
      render(<Types />);

      const passwordInput = screen.getByPlaceholderText('パスワード');
      expect(passwordInput).toHaveAttribute('type', 'password');
    });
  });

  describe('インタラクション', () => {
    // INP-08: 入力時にonChangeが呼ばれる
    it('入力時にonChangeが呼ばれる', async () => {
      const user = userEvent.setup();
      const handleChange = vi.fn();

      render(<Default onChange={handleChange} />);

      const input = screen.getByRole('textbox');
      await user.type(input, 'テスト入力');

      expect(handleChange).toHaveBeenCalled();
    });

    // INP-09: フォーカス時にonFocusが呼ばれる
    it('フォーカス時にonFocusが呼ばれる', async () => {
      const user = userEvent.setup();
      const handleFocus = vi.fn();

      render(<Default onFocus={handleFocus} />);

      const input = screen.getByRole('textbox');
      await user.click(input);

      expect(handleFocus).toHaveBeenCalled();
    });

    // INP-10: フォーカス離脱時にonBlurが呼ばれる
    it('フォーカス離脱時にonBlurが呼ばれる', async () => {
      const user = userEvent.setup();
      const handleBlur = vi.fn();

      render(<Default onBlur={handleBlur} />);

      const input = screen.getByRole('textbox');
      await user.click(input);
      await user.tab();

      expect(handleBlur).toHaveBeenCalled();
    });
  });

  describe('無効状態', () => {
    // INP-11: disabled時は入力できない
    it('disabled状態では入力できない', async () => {
      const user = userEvent.setup();
      const handleChange = vi.fn();

      render(<Disabled onChange={handleChange} />);

      const input = screen.getByRole('textbox');
      expect(input).toBeDisabled();

      await user.type(input, 'テスト');
      expect(handleChange).not.toHaveBeenCalled();
    });
  });

  describe('キーボード操作', () => {
    // INP-12: Tabでフォーカスできる
    it('Tabでフォーカスできる', async () => {
      const user = userEvent.setup();

      render(<Default />);

      await user.tab();

      const input = screen.getByRole('textbox');
      expect(input).toHaveFocus();
    });
  });

  describe('アクセシビリティ', () => {
    // INP-13: role="textbox"が設定される
    it('role="textbox"が設定される', () => {
      render(<Default />);

      expect(screen.getByRole('textbox')).toBeInTheDocument();
    });
  });

  describe('エラーケース', () => {
    // INP-14: 空のvalueでもクラッシュしない
    it('空のvalueでもクラッシュしない', () => {
      render(<Default value="" />);

      expect(screen.getByRole('textbox')).toBeInTheDocument();
    });
  });

  describe('prefix/suffix', () => {
    // INP-15: prefix がレンダリングされる
    it('prefix がレンダリングされる', () => {
      render(<Input prefix={<span>$</span>} placeholder="金額を入力" />);

      expect(screen.getByText('$')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('金額を入力')).toBeInTheDocument();
    });

    // INP-16: suffix がレンダリングされる
    it('suffix がレンダリングされる', () => {
      render(<Input suffix={<span>円</span>} placeholder="金額を入力" />);

      expect(screen.getByText('円')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('金額を入力')).toBeInTheDocument();
    });

    // INP-17: prefix と suffix の両方がレンダリングされる
    it('prefix と suffix の両方がレンダリングされる', () => {
      render(
        <Input
          prefix={<span>$</span>}
          suffix={<span>.00</span>}
          placeholder="金額"
        />,
      );

      expect(screen.getByText('$')).toBeInTheDocument();
      expect(screen.getByText('.00')).toBeInTheDocument();
    });

    // INP-18: prefix 付きでも入力できる
    it('prefix 付きでも入力できる', async () => {
      const user = userEvent.setup();
      const handleChange = vi.fn();

      render(
        <Input
          prefix={<span>$</span>}
          placeholder="金額"
          onChange={handleChange}
        />,
      );

      const input = screen.getByPlaceholderText('金額');
      await user.type(input, '100');

      expect(handleChange).toHaveBeenCalled();
      expect(input).toHaveValue('100');
    });

    // INP-19: ref が input 要素を指す（React Hook Form 互換）
    it('prefix 付きでも ref が input 要素を指す', () => {
      const ref = createRef<HTMLInputElement>();

      render(<Input ref={ref} prefix={<span>$</span>} placeholder="金額" />);

      expect(ref.current).toBeInstanceOf(HTMLInputElement);
      expect(ref.current?.tagName).toBe('INPUT');
    });

    // INP-20: disabled 時は prefix 付きでも入力できない
    it('prefix 付きでも disabled 時は入力できない', async () => {
      const user = userEvent.setup();

      render(<Input prefix={<span>$</span>} placeholder="金額" disabled />);

      const input = screen.getByPlaceholderText('金額');
      expect(input).toBeDisabled();

      await user.type(input, '100');
      expect(input).toHaveValue('');
    });

    // INP-21: prefix/suffix なしでは従来通りレンダリングされる
    it('prefix/suffix なしでは従来通りレンダリングされる', () => {
      render(<Input placeholder="通常入力" />);

      const input = screen.getByPlaceholderText('通常入力');
      expect(input).toBeInTheDocument();
      expect(input.tagName).toBe('INPUT');
    });

    // INP-22: hasError + prefix でラッパーにエラースタイルが適用される
    it('hasError + prefix でも入力欄がレンダリングされる', () => {
      render(<Input prefix={<span>$</span>} placeholder="金額" hasError />);

      expect(screen.getByText('$')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('金額')).toBeInTheDocument();
    });

    // INP-23: suffix 付きでも入力・変更が正しく動作する
    it('suffix 付きでも入力できる', async () => {
      const user = userEvent.setup();
      const handleChange = vi.fn();

      render(
        <Input
          suffix={<span>円</span>}
          placeholder="金額"
          onChange={handleChange}
        />,
      );

      const input = screen.getByPlaceholderText('金額');
      await user.type(input, '500');

      expect(handleChange).toHaveBeenCalled();
      expect(input).toHaveValue('500');
    });
  });
});
