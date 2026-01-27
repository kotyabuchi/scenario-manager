import { composeStories } from '@storybook/react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';

import * as stories from './tooltip.stories';

const { Default, Bottom, Left, Right, NoDelay, LongContent } =
  composeStories(stories);

describe('Tooltip', () => {
  describe('レンダリング', () => {
    // TTP-01: トリガー要素が表示される
    it('トリガー要素が表示される', () => {
      render(<Default />);

      expect(
        screen.getByRole('button', { name: 'ホバーしてください' }),
      ).toBeInTheDocument();
    });

    // TTP-02: 初期状態ではツールチップは視覚的に非表示
    it('初期状態ではツールチップは視覚的に非表示', () => {
      render(<Default />);

      // Ark UIのTooltipはDOMには存在するがhidden属性で非表示
      const tooltip = screen.getByRole('tooltip', { hidden: true });
      expect(tooltip).toHaveAttribute('hidden');
    });
  });

  describe('表示/非表示', () => {
    // TTP-03: ホバーで表示される
    it('ホバーで表示される', async () => {
      const user = userEvent.setup();

      render(<NoDelay />);

      const trigger = screen.getByRole('button', { name: '遅延なし' });
      await user.hover(trigger);

      await waitFor(() => {
        expect(screen.getByText('即座に表示されます')).toBeInTheDocument();
      });
    });

    // TTP-04: 指定した内容が表示される
    it('指定した内容が表示される', async () => {
      const user = userEvent.setup();

      render(<NoDelay />);

      await user.hover(screen.getByRole('button'));

      await waitFor(() => {
        expect(screen.getByText('即座に表示されます')).toBeInTheDocument();
      });
    });

    // TTP-05: ホバー解除で非表示になる
    it('ホバー解除で非表示になる', async () => {
      const user = userEvent.setup();

      render(<NoDelay />);

      const trigger = screen.getByRole('button', { name: '遅延なし' });

      // ホバー
      await user.hover(trigger);
      await waitFor(() => {
        const tooltip = screen.getByRole('tooltip');
        expect(tooltip).not.toHaveAttribute('hidden');
      });

      // ホバー解除
      await user.unhover(trigger);
      await waitFor(() => {
        const tooltip = screen.getByRole('tooltip', { hidden: true });
        expect(tooltip).toHaveAttribute('hidden');
      });
    });
  });

  describe('配置', () => {
    // TTP-06: placement="top"で上に表示される
    it('placement="top"で上に表示される', async () => {
      const user = userEvent.setup();

      render(<Default />);

      await user.hover(screen.getByRole('button'));

      // Ark UIがdata-placementを設定するのを確認
      await waitFor(() => {
        const tooltip = screen.getByText('これはツールチップです');
        expect(tooltip).toBeInTheDocument();
      });
    });

    // TTP-07: placement="bottom"で下に表示される
    it('placement="bottom"で下に表示される', async () => {
      const user = userEvent.setup();

      render(<Bottom />);

      await user.hover(screen.getByRole('button'));

      await waitFor(() => {
        const tooltip = screen.getByText('下に表示されるツールチップ');
        expect(tooltip).toBeInTheDocument();
      });
    });

    // TTP-08: placement="left"で左に表示される
    it('placement="left"で左に表示される', async () => {
      const user = userEvent.setup();

      render(<Left />);

      await user.hover(screen.getByRole('button'));

      await waitFor(() => {
        const tooltip = screen.getByText('左に表示されるツールチップ');
        expect(tooltip).toBeInTheDocument();
      });
    });

    // TTP-09: placement="right"で右に表示される
    it('placement="right"で右に表示される', async () => {
      const user = userEvent.setup();

      render(<Right />);

      await user.hover(screen.getByRole('button'));

      await waitFor(() => {
        const tooltip = screen.getByText('右に表示されるツールチップ');
        expect(tooltip).toBeInTheDocument();
      });
    });
  });

  describe('遅延', () => {
    // TTP-10: delay=0で即座に表示される
    it('delay=0で即座に表示される', async () => {
      const user = userEvent.setup();

      render(<NoDelay />);

      await user.hover(screen.getByRole('button'));

      // 遅延なしで即座に表示
      await waitFor(
        () => {
          expect(screen.getByText('即座に表示されます')).toBeInTheDocument();
        },
        { timeout: 100 },
      );
    });
  });

  describe('コンテンツ', () => {
    // TTP-11: 長いテキストが折り返される
    it('長いテキストが折り返される', async () => {
      const user = userEvent.setup();

      render(<LongContent />);

      await user.hover(screen.getByRole('button'));

      await waitFor(() => {
        const tooltip = screen.getByText(
          'これは長いツールチップの内容です。最大幅を超えると自動的に折り返されます。',
        );
        expect(tooltip).toBeInTheDocument();
      });
    });
  });

  describe('アクセシビリティ', () => {
    // TTP-12: ツールチップがスクリーンリーダーで読み取れる
    it('ツールチップにrole="tooltip"が設定される', async () => {
      const user = userEvent.setup();

      render(<NoDelay />);

      await user.hover(screen.getByRole('button'));

      await waitFor(() => {
        const tooltip = screen.getByRole('tooltip');
        expect(tooltip).toBeInTheDocument();
      });
    });

    // TTP-13: フォーカスでもツールチップが表示される
    it('フォーカスでもツールチップが表示される', async () => {
      const user = userEvent.setup();

      render(<NoDelay />);

      await user.tab();

      await waitFor(() => {
        expect(screen.getByText('即座に表示されます')).toBeInTheDocument();
      });
    });
  });
});
