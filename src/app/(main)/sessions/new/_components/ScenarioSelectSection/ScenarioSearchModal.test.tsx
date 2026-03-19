import { act, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { ScenarioSearchModal } from './ScenarioSearchModal';

import type { ScenarioSummary } from '../../interface';

vi.mock('../../actions', () => ({
  searchScenariosForSessionAction: vi.fn(),
}));

import { searchScenariosForSessionAction } from '../../actions';

const mockSearchAction = vi.mocked(searchScenariosForSessionAction);

const mockScenarios: ScenarioSummary[] = [
  {
    scenarioId: '01HTESTSCENARIO001AAAA',
    name: 'テストシナリオA',
    systemName: 'クトゥルフ神話TRPG',
    minPlayer: 3,
    maxPlayer: 5,
    minPlaytime: 120,
    maxPlaytime: 180,
  },
  {
    scenarioId: '01HTESTSCENARIO002BBBB',
    name: 'テストシナリオB',
    systemName: 'ソード・ワールド2.5',
    minPlayer: 2,
    maxPlayer: 4,
    minPlaytime: 60,
    maxPlaytime: 90,
  },
];

const defaultProps = {
  open: true,
  onOpenChange: vi.fn(),
  onSelect: vi.fn(),
  systems: [],
  invitedMembers: [],
};

describe('ScenarioSearchModal', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    mockSearchAction.mockResolvedValue({ success: true, data: [] });
  });

  afterEach(() => {
    vi.runOnlyPendingTimers();
    vi.useRealTimers();
    vi.clearAllMocks();
  });

  describe('表示', () => {
    it('open=true でモーダルが表示される', async () => {
      render(<ScenarioSearchModal {...defaultProps} />);

      expect(screen.getByRole('dialog')).toBeInTheDocument();
      expect(screen.getByText('シナリオを選ぶ')).toBeInTheDocument();
    });

    it('open=false でモーダルが表示されない', () => {
      render(<ScenarioSearchModal {...defaultProps} open={false} />);

      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });
  });

  describe('検索', () => {
    it('open=true でデフォルト条件の検索が実行される', async () => {
      render(<ScenarioSearchModal {...defaultProps} />);

      await act(async () => {
        vi.advanceTimersByTime(500);
      });

      await act(async () => {
        await Promise.resolve();
      });

      expect(mockSearchAction).toHaveBeenCalledTimes(1);
      const [params] = mockSearchAction.mock.calls[0] ?? [];
      expect(params).toEqual(
        expect.objectContaining({
          smartFilters: {
            unplayedByPlayers: true,
            canKeeper: true,
            ownedByMembers: true,
          },
          invitedMembers: [],
        }),
      );
      expect(params).not.toHaveProperty('scenarioName');
      expect(params).not.toHaveProperty('scenarioId');
      expect(params).not.toHaveProperty('systemId');
    });

    it('open=false ではデフォルト検索が実行されない', async () => {
      render(<ScenarioSearchModal {...defaultProps} open={false} />);

      await act(async () => {
        vi.advanceTimersByTime(500);
      });

      expect(mockSearchAction).not.toHaveBeenCalled();
    });

    it('検索入力でアクションがデバウンス後に呼ばれる', async () => {
      mockSearchAction.mockResolvedValue({
        success: true,
        data: mockScenarios,
      });

      render(<ScenarioSearchModal {...defaultProps} />);

      const input = screen.getByLabelText('シナリオ名で検索');

      fireEvent.change(input, { target: { value: 'テスト' } });

      // デバウンス前はまだ呼ばれていない
      expect(mockSearchAction).not.toHaveBeenCalledWith(
        expect.objectContaining({ scenarioName: 'テスト' }),
      );

      // デバウンス経過
      await act(async () => {
        vi.advanceTimersByTime(500);
      });

      expect(mockSearchAction).toHaveBeenCalledWith(
        expect.objectContaining({ scenarioName: 'テスト' }),
      );
    });
  });

  describe('シナリオ選択', () => {
    it('シナリオ選択後に「選択」ボタンで onSelect コールバックが呼ばれる', async () => {
      const onSelect = vi.fn();
      mockSearchAction.mockResolvedValue({
        success: true,
        data: mockScenarios,
      });

      render(<ScenarioSearchModal {...defaultProps} onSelect={onSelect} />);

      // 検索して結果を表示
      const input = screen.getByLabelText('シナリオ名で検索');
      fireEvent.change(input, { target: { value: 'テスト' } });

      await act(async () => {
        vi.advanceTimersByTime(500);
      });

      // Promiseの解決を待つ
      await act(async () => {
        await Promise.resolve();
      });

      expect(screen.getByText('テストシナリオA')).toBeInTheDocument();

      // シナリオをクリックして選択
      fireEvent.click(screen.getByText('テストシナリオA'));

      // 「選択」ボタンをクリック
      fireEvent.click(screen.getByRole('button', { name: /選択/ }));

      expect(onSelect).toHaveBeenCalledWith(mockScenarios[0]);
    });

    it('未選択時は「選択」ボタンが disabled', () => {
      render(<ScenarioSearchModal {...defaultProps} />);

      const confirmButton = screen.getByRole('button', { name: /選択/ });
      expect(confirmButton).toBeDisabled();
    });

    it('シナリオを選択すると「選択」ボタンが有効になる', async () => {
      mockSearchAction.mockResolvedValue({
        success: true,
        data: mockScenarios,
      });

      render(<ScenarioSearchModal {...defaultProps} />);

      // 選択前は disabled
      expect(screen.getByRole('button', { name: /選択/ })).toBeDisabled();

      // 検索して結果を表示
      const input = screen.getByLabelText('シナリオ名で検索');
      fireEvent.change(input, { target: { value: 'テスト' } });

      await act(async () => {
        vi.advanceTimersByTime(500);
      });

      // Promiseの解決を待つ
      await act(async () => {
        await Promise.resolve();
      });

      expect(screen.getByText('テストシナリオA')).toBeInTheDocument();

      // シナリオをクリック
      fireEvent.click(screen.getByText('テストシナリオA'));

      // 選択後は enabled
      expect(screen.getByRole('button', { name: /選択/ })).not.toBeDisabled();
    });
  });
});
