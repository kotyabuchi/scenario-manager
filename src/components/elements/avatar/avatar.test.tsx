import { composeStories } from '@storybook/react';
import { render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import * as stories from './avatar.stories';

// StorybookのStoryからテスト用コンポーネントを生成
const {
  Default,
  WithImage,
  WithFallback,
  SizeXs,
  SizeSm,
  SizeMd,
  SizeLg,
  SizeXl,
} = composeStories(stories);

describe('Avatar', () => {
  describe('画像表示', () => {
    // AVT-01: 画像が正しく表示される
    it('srcが指定されている場合、画像が表示される', async () => {
      render(<WithImage />);

      // 画像のロード完了を待つ
      await waitFor(() => {
        const img = screen.getByRole('img');
        expect(img).toBeInTheDocument();
      });
    });

    // AVT-02: alt属性が設定される
    it('alt属性が正しく設定される', async () => {
      render(<WithImage />);

      await waitFor(() => {
        const img = screen.getByRole('img');
        expect(img).toHaveAttribute('alt');
      });
    });
  });

  describe('フォールバック', () => {
    // AVT-03: 画像なしでフォールバックが表示される
    it('srcがない場合、フォールバックアイコンが表示される', () => {
      render(<WithFallback />);

      // Userアイコン（SVG）が表示される
      const fallback = screen.getByTestId('avatar-fallback');
      expect(fallback).toBeInTheDocument();
    });

    // AVT-04: カスタムフォールバックが表示される
    it('カスタムフォールバックが渡された場合、それが表示される', () => {
      render(
        <Default fallback={<span data-testid="custom-fallback">AB</span>} />,
      );

      expect(screen.getByTestId('custom-fallback')).toBeInTheDocument();
      expect(screen.getByText('AB')).toBeInTheDocument();
    });
  });

  describe('サイズバリエーション', () => {
    // AVT-05: xsサイズが正しく表示される
    it('size="xs"でdata-size属性がxsになる', () => {
      render(<SizeXs />);

      const avatar = screen.getByTestId('avatar');
      expect(avatar).toHaveAttribute('data-size', 'xs');
    });

    // AVT-06: smサイズが正しく表示される
    it('size="sm"でdata-size属性がsmになる', () => {
      render(<SizeSm />);

      const avatar = screen.getByTestId('avatar');
      expect(avatar).toHaveAttribute('data-size', 'sm');
    });

    // AVT-07: mdサイズ（デフォルト）が正しく表示される
    it('size="md"でdata-size属性がmdになる', () => {
      render(<SizeMd />);

      const avatar = screen.getByTestId('avatar');
      expect(avatar).toHaveAttribute('data-size', 'md');
    });

    // AVT-08: lgサイズが正しく表示される
    it('size="lg"でdata-size属性がlgになる', () => {
      render(<SizeLg />);

      const avatar = screen.getByTestId('avatar');
      expect(avatar).toHaveAttribute('data-size', 'lg');
    });

    // AVT-09: xlサイズが正しく表示される
    it('size="xl"でdata-size属性がxlになる', () => {
      render(<SizeXl />);

      const avatar = screen.getByTestId('avatar');
      expect(avatar).toHaveAttribute('data-size', 'xl');
    });
  });

  describe('デフォルト値', () => {
    // AVT-10: sizeのデフォルト値がmdである
    it('sizeを指定しない場合、mdがデフォルト', () => {
      render(<Default />);

      const avatar = screen.getByTestId('avatar');
      expect(avatar).toHaveAttribute('data-size', 'md');
    });
  });

  describe('アクセシビリティ', () => {
    // AVT-11: 画像にalt属性が必須
    it('画像にはalt属性が設定されている', async () => {
      render(<WithImage />);

      await waitFor(() => {
        const img = screen.getByRole('img');
        expect(img).toHaveAttribute('alt');
        expect(img.getAttribute('alt')).not.toBe('');
      });
    });
  });

  describe('円形表示', () => {
    // AVT-12: 円形に表示される（CSSクラスが適用されている）
    it('border-radius 50%のクラスが適用されている', () => {
      render(<Default />);

      const avatar = screen.getByTestId('avatar');
      // PandaCSSのユーティリティクラス（bdr_full）が適用されていることを確認
      expect(avatar.className).toContain('bdr_full');
    });
  });
});
