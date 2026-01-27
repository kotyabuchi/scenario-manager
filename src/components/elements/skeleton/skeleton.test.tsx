import { composeStories } from '@storybook/react';
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import * as stories from './skeleton.stories';

const {
  Default,
  TextLines,
  Circle,
  Rectangle,
  NoAnimation,
  PresetText,
  PresetAvatar,
  PresetCard,
} = composeStories(stories);

describe('Skeleton', () => {
  describe('レンダリング', () => {
    // SKL-01: デフォルト状態で正しくレンダリングされる
    it('デフォルト状態でレンダリングできる', () => {
      render(<Default />);

      expect(screen.getByRole('status')).toBeInTheDocument();
    });

    // SKL-02: テキストバリアントがレンダリングできる
    it('テキストバリアントがレンダリングできる', () => {
      render(<TextLines />);

      expect(screen.getByRole('status')).toBeInTheDocument();
    });

    // SKL-03: 円形バリアントがレンダリングできる
    it('円形バリアントがレンダリングできる', () => {
      render(<Circle />);

      expect(screen.getByRole('status')).toBeInTheDocument();
    });

    // SKL-04: 長方形バリアントがレンダリングできる
    it('長方形バリアントがレンダリングできる', () => {
      render(<Rectangle />);

      expect(screen.getByRole('status')).toBeInTheDocument();
    });
  });

  describe('複数行テキスト', () => {
    // SKL-05: lines指定で複数行が表示される
    it('lines指定で複数行が表示される', () => {
      render(<TextLines />);

      // 3行分のスケルトンが表示される
      const status = screen.getByRole('status');
      const lines = status.querySelectorAll('div');
      expect(lines.length).toBe(3);
    });
  });

  describe('アニメーション', () => {
    // SKL-06: animate=falseでもレンダリングできる
    it('animate=falseでもレンダリングできる', () => {
      render(<NoAnimation />);

      expect(screen.getByRole('status')).toBeInTheDocument();
    });
  });

  describe('プリセット', () => {
    // SKL-07: SkeletonTextプリセットがレンダリングできる
    it('SkeletonTextプリセットがレンダリングできる', () => {
      render(<PresetText />);

      expect(screen.getByRole('status')).toBeInTheDocument();
    });

    // SKL-08: SkeletonAvatarプリセットがレンダリングできる
    it('SkeletonAvatarプリセットがレンダリングできる', () => {
      render(<PresetAvatar />);

      expect(screen.getByRole('status')).toBeInTheDocument();
    });

    // SKL-09: SkeletonCardプリセットがレンダリングできる
    it('SkeletonCardプリセットがレンダリングできる', () => {
      render(<PresetCard />);

      expect(screen.getByRole('status')).toBeInTheDocument();
    });
  });

  describe('アクセシビリティ', () => {
    // SKL-10: aria-busy="true"が設定される
    it('aria-busy="true"が設定される', () => {
      render(<Default />);

      const skeleton = screen.getByRole('status');
      expect(skeleton).toHaveAttribute('aria-busy', 'true');
    });

    // SKL-11: aria-labelが設定される
    it('aria-labelが設定される', () => {
      render(<Default />);

      const skeleton = screen.getByRole('status');
      expect(skeleton).toHaveAttribute('aria-label', '読み込み中');
    });

    // SKL-12: role="status"が設定される
    it('role="status"が設定される', () => {
      render(<Default />);

      expect(screen.getByRole('status')).toBeInTheDocument();
    });
  });
});
