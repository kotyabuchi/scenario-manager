import { composeStories } from '@storybook/react';
import { act, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import * as stories from './toast.stories';

const { Success, ErrorToast, InfoToast, Warning, TitleOnly, AutoHide } =
  composeStories(stories);

describe('Toast', () => {
  describe('レンダリング', () => {
    // TST-01: success状態で正しく表示される
    it('success状態で正しく表示される', () => {
      render(<Success />);

      const toast = screen.getByRole('alert');
      expect(toast).toBeInTheDocument();
      expect(toast).toHaveAttribute('data-status', 'success');
    });

    // TST-02: error状態で正しく表示される
    it('error状態で正しく表示される', () => {
      render(<ErrorToast />);

      const toast = screen.getByRole('alert');
      expect(toast).toHaveAttribute('data-status', 'error');
    });

    // TST-03: info状態で正しく表示される
    it('info状態で正しく表示される', () => {
      render(<InfoToast />);

      const toast = screen.getByRole('alert');
      expect(toast).toHaveAttribute('data-status', 'info');
    });

    // TST-04: warning状態で正しく表示される
    it('warning状態で正しく表示される', () => {
      render(<Warning />);

      const toast = screen.getByRole('alert');
      expect(toast).toHaveAttribute('data-status', 'warning');
    });

    // TST-05: タイトルが表示される
    it('タイトルが表示される', () => {
      render(<Success />);

      expect(screen.getByText('Success')).toBeInTheDocument();
    });

    // TST-06: 説明が表示される
    it('説明が表示される', () => {
      render(<Success />);

      expect(
        screen.getByText('Your changes have been saved.'),
      ).toBeInTheDocument();
    });

    // TST-07: タイトルのみでも表示される
    it('タイトルのみでも表示される', () => {
      render(<TitleOnly />);

      expect(screen.getByText('Saved successfully')).toBeInTheDocument();
      expect(screen.queryByText(/description/i)).not.toBeInTheDocument();
    });
  });

  describe('閉じるボタン', () => {
    // TST-08: 閉じるボタンが表示される
    it('閉じるボタンが表示される', () => {
      render(<Success />);

      expect(
        screen.getByRole('button', { name: '閉じる' }),
      ).toBeInTheDocument();
    });

    // TST-09: 閉じるボタンでToastが消える
    it('閉じるボタンでToastが消える', async () => {
      const user = userEvent.setup();

      render(<Success />);

      expect(screen.getByRole('alert')).toBeInTheDocument();

      await user.click(screen.getByRole('button', { name: '閉じる' }));

      expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    });

    // TST-10: onCloseが呼ばれる
    it('onCloseが呼ばれる', async () => {
      const user = userEvent.setup();
      const handleClose = vi.fn();

      render(<Success onClose={handleClose} />);

      await user.click(screen.getByRole('button', { name: '閉じる' }));

      expect(handleClose).toHaveBeenCalledTimes(1);
    });
  });

  describe('自動非表示', () => {
    // TST-11: duration後に自動で消える
    it('duration後に自動で消える', async () => {
      vi.useFakeTimers();

      const handleClose = vi.fn();
      render(<AutoHide onClose={handleClose} />);

      expect(screen.getByRole('alert')).toBeInTheDocument();

      // 3秒経過（actでラップしてReactの状態更新を待つ）
      await act(async () => {
        vi.advanceTimersByTime(3000);
      });

      expect(screen.queryByRole('alert')).not.toBeInTheDocument();
      expect(handleClose).toHaveBeenCalledTimes(1);

      vi.useRealTimers();
    });

    // TST-12: duration=0では自動非表示されない
    it('duration=0では自動非表示されない', async () => {
      vi.useFakeTimers();

      render(<Success />);

      // 10秒経過しても消えない
      vi.advanceTimersByTime(10000);

      expect(screen.getByRole('alert')).toBeInTheDocument();

      vi.useRealTimers();
    });
  });

  describe('アクセシビリティ', () => {
    // TST-13: role="alert"が設定される
    it('role="alert"が設定される', () => {
      render(<Success />);

      expect(screen.getByRole('alert')).toBeInTheDocument();
    });

    // TST-14: aria-live="polite"が設定される
    it('aria-live="polite"が設定される', () => {
      render(<Success />);

      const toast = screen.getByRole('alert');
      expect(toast).toHaveAttribute('aria-live', 'polite');
    });

    // TST-15: 閉じるボタンにaria-labelが設定される
    it('閉じるボタンにaria-labelが設定される', () => {
      render(<Success />);

      const closeButton = screen.getByRole('button', { name: '閉じる' });
      expect(closeButton).toHaveAttribute('aria-label', '閉じる');
    });
  });
});
