import { composeStories } from '@storybook/react';
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import * as stories from './badge.stories';

const { Default, Success, Warning, ErrorVariant, Neutral, WithoutDot } =
  composeStories(stories);

describe('Badge', () => {
  describe('バリアントの表示', () => {
    // BDG-01: success variantが正しく表示される
    it('success variantが正しいdata-variant属性を持つ', () => {
      render(<Success />);

      const badge = screen.getByTestId('badge');
      expect(badge).toBeInTheDocument();
      expect(badge).toHaveAttribute('data-variant', 'success');
    });

    // BDG-02: warning variantが正しく表示される
    it('warning variantが正しいdata-variant属性を持つ', () => {
      render(<Warning />);

      const badge = screen.getByTestId('badge');
      expect(badge).toBeInTheDocument();
      expect(badge).toHaveAttribute('data-variant', 'warning');
    });

    // BDG-03: error variantが正しく表示される
    it('error variantが正しいdata-variant属性を持つ', () => {
      render(<ErrorVariant />);

      const badge = screen.getByTestId('badge');
      expect(badge).toBeInTheDocument();
      expect(badge).toHaveAttribute('data-variant', 'error');
    });

    // BDG-04: neutral variantが正しく表示される
    it('neutral variantが正しいdata-variant属性を持つ', () => {
      render(<Neutral />);

      const badge = screen.getByTestId('badge');
      expect(badge).toBeInTheDocument();
      expect(badge).toHaveAttribute('data-variant', 'neutral');
    });
  });

  describe('childrenの表示', () => {
    // BDG-05: childrenが正しく表示される
    it('childrenのテキストが表示される', () => {
      render(<Success />);

      expect(screen.getByText('Active')).toBeInTheDocument();
    });

    it('異なるテキストも正しく表示される', () => {
      render(<Warning />);

      expect(screen.getByText('Pending')).toBeInTheDocument();
    });
  });

  describe('ドット表示', () => {
    // BDG-06: デフォルトでドットが表示される
    it('showDot未指定でドットが表示される', () => {
      render(<Default />);

      const dot = screen.getByTestId('badge-dot');
      expect(dot).toBeInTheDocument();
    });

    // BDG-07: showDot=falseでドットが非表示になる
    it('showDot=falseでドットが非表示になる', () => {
      render(<WithoutDot />);

      expect(screen.queryByTestId('badge-dot')).not.toBeInTheDocument();
    });
  });

  describe('ドットの色', () => {
    // BDG-08: success variantのドットが表示される
    it('success variantでドットが表示される', () => {
      render(<Success />);

      const dot = screen.getByTestId('badge-dot');
      expect(dot).toBeInTheDocument();
    });

    // BDG-09: warning variantのドットが表示される
    it('warning variantでドットが表示される', () => {
      render(<Warning />);

      const dot = screen.getByTestId('badge-dot');
      expect(dot).toBeInTheDocument();
    });

    // BDG-10: error variantのドットが表示される
    it('error variantでドットが表示される', () => {
      render(<ErrorVariant />);

      const dot = screen.getByTestId('badge-dot');
      expect(dot).toBeInTheDocument();
    });

    // BDG-11: neutral variantのドットが表示される
    it('neutral variantでドットが表示される', () => {
      render(<Neutral />);

      const dot = screen.getByTestId('badge-dot');
      expect(dot).toBeInTheDocument();
    });
  });

  describe('テキストの表示', () => {
    // BDG-12: success variantのテキストが表示される
    it('success variantでテキストが表示される', () => {
      render(<Success />);

      const text = screen.getByText('Active');
      expect(text).toBeInTheDocument();
    });

    // BDG-13: warning variantのテキストが表示される
    it('warning variantでテキストが表示される', () => {
      render(<Warning />);

      const text = screen.getByText('Pending');
      expect(text).toBeInTheDocument();
    });

    // BDG-14: error variantのテキストが表示される
    it('error variantでテキストが表示される', () => {
      render(<ErrorVariant />);

      const text = screen.getByText('Error');
      expect(text).toBeInTheDocument();
    });

    // BDG-15: neutral variantのテキストが表示される
    it('neutral variantでテキストが表示される', () => {
      render(<Neutral />);

      const text = screen.getByText('Draft');
      expect(text).toBeInTheDocument();
    });
  });

  describe('デフォルト値', () => {
    // BDG-16: variantのデフォルト値がneutral
    it('variantを指定しない場合neutralがデフォルト', () => {
      render(<Default />);

      const badge = screen.getByTestId('badge');
      expect(badge).toHaveAttribute('data-variant', 'neutral');
    });
  });

  describe('スタイル', () => {
    // BDG-17: バッジにスタイルクラスが適用される
    it('バッジにスタイルクラスが適用される', () => {
      render(<Default />);

      const badge = screen.getByTestId('badge');
      // PandaCSSのユーティリティクラスが適用されていることを確認
      expect(badge.className).toBeTruthy();
    });

    // BDG-18: ドットが存在する
    it('ドットが存在する', () => {
      render(<Default />);

      const dot = screen.getByTestId('badge-dot');
      expect(dot).toBeInTheDocument();
      expect(dot.className).toBeTruthy();
    });

    // BDG-19: テキスト要素が存在する
    it('テキスト要素が存在する', () => {
      render(<Default />);

      const text = screen.getByTestId('badge').querySelector('span');
      expect(text).toBeInTheDocument();
      expect(text?.className).toBeTruthy();
    });
  });
});
