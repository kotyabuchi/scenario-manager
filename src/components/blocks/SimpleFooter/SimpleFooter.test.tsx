import { composeStories } from '@storybook/react';
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import * as stories from './SimpleFooter.stories';

const { Default } = composeStories(stories);

describe('SimpleFooter', () => {
  describe('レンダリング', () => {
    // SFT-01: 正しくレンダリングされる
    it('正しくレンダリングできる', () => {
      render(<Default />);

      expect(screen.getByRole('contentinfo')).toBeInTheDocument();
    });

    // SFT-02: コピーライトテキストが表示される
    it('コピーライトテキストが表示される', () => {
      render(<Default />);

      expect(screen.getByText(/シナプレ管理くん/)).toBeInTheDocument();
    });

    // SFT-03: 年が表示される
    it('年が表示される', () => {
      render(<Default />);

      expect(screen.getByText(/2026/)).toBeInTheDocument();
    });
  });

  describe('アクセシビリティ', () => {
    // SFT-04: footer要素が使用されている
    it('footer要素が使用されている', () => {
      render(<Default />);

      // role="contentinfo"はfooter要素に暗黙的に適用される
      expect(screen.getByRole('contentinfo')).toBeInTheDocument();
    });
  });
});
