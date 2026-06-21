import { composeStories } from '@storybook/react';
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import * as stories from './badge.stories';

const {
  Default,
  Success,
  Recruiting,
  Warning,
  ErrorVariant,
  Neutral,
  WithoutDot,
} = composeStories(stories);

describe('Badge', () => {
  describe('レンダリング', () => {
    // BDG-01: バッジが描画される
    it('バッジ要素が描画される', () => {
      render(<Default />);

      expect(screen.getByTestId('badge')).toBeInTheDocument();
    });

    // BDG-02: 静的表示（button ではない）
    it('button ではなく静的に描画される', () => {
      render(<Default />);

      expect(screen.queryByRole('button')).not.toBeInTheDocument();
    });
  });

  describe('childrenの表示', () => {
    // BDG-03: success のテキストが表示される
    it('success variantのテキストが表示される', () => {
      render(<Success />);

      expect(screen.getByText('Active')).toBeInTheDocument();
    });

    // BDG-04: recruiting のテキストが表示される
    it('recruiting variantのテキストが表示される', () => {
      render(<Recruiting />);

      expect(screen.getByText('募集中')).toBeInTheDocument();
    });

    // BDG-05: warning のテキストが表示される
    it('warning variantのテキストが表示される', () => {
      render(<Warning />);

      expect(screen.getByText('Pending')).toBeInTheDocument();
    });

    // BDG-06: error のテキストが表示される
    it('error variantのテキストが表示される', () => {
      render(<ErrorVariant />);

      expect(screen.getByText('Error')).toBeInTheDocument();
    });

    // BDG-07: neutral のテキストが表示される
    it('neutral variantのテキストが表示される', () => {
      render(<Neutral />);

      expect(screen.getByText('Draft')).toBeInTheDocument();
    });
  });

  describe('ドット表示', () => {
    // BDG-08: デフォルトでドットが表示される
    it('showDot未指定でドットが表示される', () => {
      render(<Default />);

      expect(screen.getByTestId('pill-dot')).toBeInTheDocument();
    });

    // BDG-09: showDot=falseでドットが非表示になる
    it('showDot=falseでドットが非表示になる', () => {
      render(<WithoutDot />);

      expect(screen.queryByTestId('pill-dot')).not.toBeInTheDocument();
    });

    // BDG-10: recruiting でもドットが表示される
    it('recruiting variantでドットが表示される', () => {
      render(<Recruiting />);

      expect(screen.getByTestId('pill-dot')).toBeInTheDocument();
    });
  });

  describe('スタイル', () => {
    // BDG-11: スタイルクラスが適用される
    it('バッジにスタイルクラスが適用される', () => {
      render(<Default />);

      expect(screen.getByTestId('badge').className).toBeTruthy();
    });
  });
});
