import { act, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { MemberSearchInput } from './MemberSearchInput';

import type { UserSummary } from '../actions';

vi.mock('../actions', () => ({
  searchUsersAction: vi.fn(),
}));

import { searchUsersAction } from '../actions';

const mockSearchUsersAction = vi.mocked(searchUsersAction);

const mockUsers: UserSummary[] = [
  {
    user_id: '01HTESTUSER00000001AAA',
    user_name: 'test_user1',
    nickname: 'テストユーザー1',
    image: null,
  },
  {
    user_id: '01HTESTUSER00000002BBB',
    user_name: 'test_user2',
    nickname: 'テストユーザー2',
    image: null,
  },
];

const defaultProps = {
  onSelect: vi.fn(),
  excludeUserIds: [],
};

describe('MemberSearchInput', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    mockSearchUsersAction.mockResolvedValue({ success: true, data: [] });
  });

  afterEach(() => {
    vi.runOnlyPendingTimers();
    vi.useRealTimers();
    vi.clearAllMocks();
  });

  describe('表示', () => {
    it('検索入力が表示される', () => {
      render(<MemberSearchInput {...defaultProps} />);

      expect(screen.getByLabelText('メンバー検索')).toBeInTheDocument();
    });
  });

  describe('検索', () => {
    it('2文字以上入力するとデバウンス後にアクションが呼ばれる', async () => {
      mockSearchUsersAction.mockResolvedValue({
        success: true,
        data: mockUsers,
      });

      render(<MemberSearchInput {...defaultProps} />);

      const input = screen.getByLabelText('メンバー検索');
      fireEvent.change(input, { target: { value: 'te' } });

      // デバウンス前はまだ呼ばれていない
      expect(mockSearchUsersAction).not.toHaveBeenCalled();

      // デバウンス経過
      await act(async () => {
        vi.advanceTimersByTime(300);
      });

      expect(mockSearchUsersAction).toHaveBeenCalledWith('te');
    });

    it('1文字では検索されない', async () => {
      render(<MemberSearchInput {...defaultProps} />);

      const input = screen.getByLabelText('メンバー検索');
      fireEvent.change(input, { target: { value: 't' } });

      await act(async () => {
        vi.advanceTimersByTime(300);
      });

      // MIN_QUERY_LENGTH=2 のため呼ばれない
      expect(mockSearchUsersAction).not.toHaveBeenCalled();
    });
  });

  describe('ユーザー選択', () => {
    it('検索結果からユーザーを選択すると onSelect コールバックが呼ばれる', async () => {
      const onSelect = vi.fn();
      mockSearchUsersAction.mockResolvedValue({
        success: true,
        data: mockUsers,
      });

      render(<MemberSearchInput {...defaultProps} onSelect={onSelect} />);

      const input = screen.getByLabelText('メンバー検索');
      fireEvent.change(input, { target: { value: 'te' } });

      await act(async () => {
        vi.advanceTimersByTime(300);
      });

      // Promiseの解決を待つ
      await act(async () => {
        await Promise.resolve();
      });

      expect(screen.getByText('テストユーザー1')).toBeInTheDocument();

      fireEvent.click(screen.getByText('テストユーザー1'));

      expect(onSelect).toHaveBeenCalledWith(mockUsers[0]);
    });

    it('excludeUserIds に含まれるユーザーは結果に表示されない', async () => {
      mockSearchUsersAction.mockResolvedValue({
        success: true,
        data: mockUsers,
      });

      render(
        <MemberSearchInput
          {...defaultProps}
          excludeUserIds={['01HTESTUSER00000001AAA']}
        />,
      );

      const input = screen.getByLabelText('メンバー検索');
      fireEvent.change(input, { target: { value: 'te' } });

      await act(async () => {
        vi.advanceTimersByTime(300);
      });

      // Promiseの解決を待つ
      await act(async () => {
        await Promise.resolve();
      });

      expect(screen.getByText('テストユーザー2')).toBeInTheDocument();

      // 除外されたユーザーは表示されない
      expect(screen.queryByText('テストユーザー1')).not.toBeInTheDocument();
    });
  });
});
