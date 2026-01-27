import { composeStories } from '@storybook/react';
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import * as stories from './progress.stories';

const { Default, Empty, Complete, NoLabel, Circle, CircleSizes } =
  composeStories(stories);

describe('Progress', () => {
  describe('バー形式', () => {
    // PRG-01: デフォルト状態で正しくレンダリングされる
    it('デフォルト状態でレンダリングできる', () => {
      render(<Default />);

      expect(screen.getByRole('progressbar')).toBeInTheDocument();
    });

    // PRG-02: ラベルが表示される
    it('ラベルが表示される', () => {
      render(<Default />);

      expect(screen.getByText('Progress')).toBeInTheDocument();
    });

    // PRG-03: パーセント表示が正しい
    it('パーセント表示が正しい', () => {
      render(<Default />);

      expect(screen.getByText('65%')).toBeInTheDocument();
    });

    // PRG-04: value=0で0%が表示される
    it('value=0で0%が表示される', () => {
      render(<Empty />);

      expect(screen.getByText('0%')).toBeInTheDocument();
    });

    // PRG-05: value=100で100%が表示される
    it('value=100で100%が表示される', () => {
      render(<Complete />);

      expect(screen.getByText('100%')).toBeInTheDocument();
    });

    // PRG-06: ラベルなしでもレンダリングできる
    it('ラベルなしでもレンダリングできる', () => {
      render(<NoLabel />);

      expect(screen.getByRole('progressbar')).toBeInTheDocument();
    });
  });

  describe('サークル形式', () => {
    // PRG-07: サークル形式でレンダリングできる
    it('サークル形式でレンダリングできる', () => {
      render(<Circle />);

      expect(screen.getByRole('progressbar')).toBeInTheDocument();
    });

    // PRG-08: サークル形式でパーセント表示される
    it('サークル形式でパーセント表示される', () => {
      render(<Circle />);

      expect(screen.getByText('65%')).toBeInTheDocument();
    });

    // PRG-09: サイズバリエーションがレンダリングできる
    it('サイズバリエーションがレンダリングできる', () => {
      render(<CircleSizes />);

      const progressBars = screen.getAllByRole('progressbar');
      expect(progressBars).toHaveLength(3);
    });
  });

  describe('アクセシビリティ', () => {
    // PRG-10: aria-valuenowが設定される
    it('aria-valuenowが設定される', () => {
      render(<Default />);

      const progressbar = screen.getByRole('progressbar');
      expect(progressbar).toHaveAttribute('aria-valuenow', '65');
    });

    // PRG-11: aria-valueminが設定される
    it('aria-valueminが設定される', () => {
      render(<Default />);

      const progressbar = screen.getByRole('progressbar');
      expect(progressbar).toHaveAttribute('aria-valuemin', '0');
    });

    // PRG-12: aria-valuemaxが設定される
    it('aria-valuemaxが設定される', () => {
      render(<Default />);

      const progressbar = screen.getByRole('progressbar');
      expect(progressbar).toHaveAttribute('aria-valuemax', '100');
    });

    // PRG-13: aria-labelが設定される
    it('aria-labelが設定される', () => {
      render(<Default />);

      const progressbar = screen.getByRole('progressbar');
      expect(progressbar).toHaveAttribute('aria-label');
    });
  });

  describe('境界値', () => {
    // PRG-14: 0%で空の状態が正しく表示される
    it('0%で空の状態が正しく表示される', () => {
      render(<Empty />);

      const progressbar = screen.getByRole('progressbar');
      expect(progressbar).toHaveAttribute('aria-valuenow', '0');
    });

    // PRG-15: 100%で完全に埋まった状態が正しく表示される
    it('100%で完全に埋まった状態が正しく表示される', () => {
      render(<Complete />);

      const progressbar = screen.getByRole('progressbar');
      expect(progressbar).toHaveAttribute('aria-valuenow', '100');
    });
  });
});
