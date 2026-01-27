import { composeStories } from '@storybook/react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import * as stories from './modal.stories';

const { Default, WithFooter } = composeStories(stories);

describe('Modal (Dialog)', () => {
  describe('レンダリング', () => {
    // DLG-01: openがtrueの時に表示される
    it('ボタンクリックでモーダルが開く', async () => {
      const user = userEvent.setup();

      render(<Default />);

      const openButton = screen.getByRole('button', {
        name: /モーダルを開く/i,
      });
      await user.click(openButton);

      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });
    });

    // DLG-02: タイトルが正しく表示される
    it('タイトルが表示される', async () => {
      const user = userEvent.setup();

      render(<Default />);

      await user.click(screen.getByRole('button', { name: /モーダルを開く/i }));

      await waitFor(() => {
        expect(screen.getByText('確認')).toBeInTheDocument();
      });
    });

    // DLG-03: コンテンツが正しく表示される
    it('コンテンツが表示される', async () => {
      const user = userEvent.setup();

      render(<Default />);

      await user.click(screen.getByRole('button', { name: /モーダルを開く/i }));

      await waitFor(() => {
        expect(
          screen.getByText(/モーダルの内容がここに表示されます/),
        ).toBeInTheDocument();
      });
    });

    // DLG-04: フッターが正しく表示される
    it('フッターが表示される', async () => {
      const user = userEvent.setup();

      render(<WithFooter />);

      await user.click(
        screen.getByRole('button', { name: /フッター付きモーダル/i }),
      );

      await waitFor(() => {
        expect(
          screen.getByRole('button', { name: /キャンセル/i }),
        ).toBeInTheDocument();
        expect(
          screen.getByRole('button', { name: /削除する/i }),
        ).toBeInTheDocument();
      });
    });
  });

  describe('閉じる操作', () => {
    // DLG-05: 閉じるボタンでonOpenChangeが呼ばれる
    it('閉じるボタンでモーダルが閉じる', async () => {
      const user = userEvent.setup();

      render(<Default />);

      // モーダルを開く
      await user.click(screen.getByRole('button', { name: /モーダルを開く/i }));

      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });

      // 閉じるボタンをクリック（Xボタン）
      const closeButton = screen.getByLabelText(/閉じる/i);
      if (closeButton) {
        await user.click(closeButton);

        await waitFor(() => {
          expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
        });
      }
    });

    // DLG-06: Escapeキーで閉じる
    it('Escapeキーでモーダルが閉じる', async () => {
      const user = userEvent.setup();

      render(<Default />);

      await user.click(screen.getByRole('button', { name: /モーダルを開く/i }));

      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });

      await user.keyboard('{Escape}');

      await waitFor(() => {
        expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
      });
    });
  });

  describe('アクセシビリティ', () => {
    // DLG-07: role="dialog"が設定される
    it('role="dialog"が設定される', async () => {
      const user = userEvent.setup();

      render(<Default />);

      await user.click(screen.getByRole('button', { name: /モーダルを開く/i }));

      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });
    });

    // DLG-08: aria-modal="true"が設定される
    it('aria-modal属性が設定される', async () => {
      const user = userEvent.setup();

      render(<Default />);

      await user.click(screen.getByRole('button', { name: /モーダルを開く/i }));

      await waitFor(() => {
        const dialog = screen.getByRole('dialog');
        expect(dialog).toHaveAttribute('aria-modal', 'true');
      });
    });
  });
});
