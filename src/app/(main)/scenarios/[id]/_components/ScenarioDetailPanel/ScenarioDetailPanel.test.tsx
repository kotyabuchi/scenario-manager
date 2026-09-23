import { act, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { reviewFixture, scenarioFixture, videoFixture } from './fixtures';
import {
  ScenarioDetailPanel,
  type ScenarioDetailPanelProps,
} from './ScenarioDetailPanel';

const defaultProps: ScenarioDetailPanelProps = {
  scenario: scenarioFixture,
  sessions: [],
  videos: [],
  reviews: [],
  reviewTotalCount: 0,
  isLoggedIn: true,
};

// 通信境界のコールバックだけを制御し、ヘッド・各セクション・UI部品は実物で確認する。
describe('ScenarioDetailPanel', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('単独ページの戻るリンクとシナリオ指定のセッション作成リンクを表示する', () => {
    render(<ScenarioDetailPanel {...defaultProps} variant="page" />);
    expect(
      screen.getByRole('link', { name: 'シナリオ一覧に戻る' }),
    ).toHaveAttribute('href', '/scenarios');
    expect(
      screen.queryByRole('link', { name: '閉じる' }),
    ).not.toBeInTheDocument();
    for (const link of screen.getAllByRole('link', {
      name: /セッションを作成/,
    })) {
      expect(link).toHaveAttribute('href', '/sessions/new?scenarioId=scn_01');
    }
  });

  it('ペインの閉じる・戻るリンクはいずれも一覧を指す', () => {
    render(<ScenarioDetailPanel {...defaultProps} />);
    // CSSのブレークポイントによる出し分けはブラウザ検証で確認する。
    expect(screen.getByRole('link', { name: '閉じる' })).toHaveAttribute(
      'href',
      '/scenarios',
    );
    expect(
      screen.getByRole('link', { name: 'シナリオ一覧に戻る' }),
    ).toHaveAttribute('href', '/scenarios');
  });

  it('未ログイン時はお気に入りを実行できない', async () => {
    const onToggleFavorite = vi.fn(async () => {});
    const user = userEvent.setup();
    render(
      <ScenarioDetailPanel
        {...defaultProps}
        isLoggedIn={false}
        onToggleFavorite={onToggleFavorite}
      />,
    );
    const button = screen.getByRole('button', { name: 'お気に入り' });
    expect(button).toBeDisabled();
    await user.click(button);
    expect(onToggleFavorite).not.toHaveBeenCalled();
  });

  it('お気に入り処理が未接続の場合はボタンを無効にする', () => {
    render(<ScenarioDetailPanel {...defaultProps} />);
    expect(screen.getByRole('button', { name: 'お気に入り' })).toBeDisabled();
  });

  it.each([
    false,
    true,
  ])('初期お気に入り=%sから即座に表示を切り替え、処理中の重複操作を防ぐ', async (initialFavorite) => {
    const request = Promise.withResolvers<void>();
    const onToggleFavorite = vi.fn(() => request.promise);
    const props = {
      ...defaultProps,
      isFavorite: initialFavorite,
      onToggleFavorite,
    };
    const { rerender } = render(<ScenarioDetailPanel {...props} />);
    const user = userEvent.setup();
    const button = screen.getByRole('button', { name: 'お気に入り' });

    await user.click(button);
    expect(button).toHaveAttribute('aria-pressed', String(!initialFavorite));
    expect(button).toBeDisabled();
    expect(button).toHaveAttribute('aria-busy', 'true');
    await user.click(button);
    expect(onToggleFavorite).toHaveBeenCalledTimes(1);

    await act(async () => {
      // サーバーの再検証で確定値がpropsへ返る契約を再現する。
      rerender(
        <ScenarioDetailPanel {...props} isFavorite={!initialFavorite} />,
      );
      request.resolve();
    });
    await waitFor(() => expect(button).toBeEnabled());
    expect(button).toHaveAttribute('aria-pressed', String(!initialFavorite));
  });

  it.each([
    false,
    true,
  ])('お気に入り=%sで失敗した場合は表示を戻し、再試行できる', async (initialFavorite) => {
    const request = Promise.withResolvers<void>();
    const onToggleFavorite = vi
      .fn<() => Promise<void>>()
      .mockReturnValueOnce(request.promise)
      .mockResolvedValue(undefined);
    render(
      <ScenarioDetailPanel
        {...defaultProps}
        isFavorite={initialFavorite}
        onToggleFavorite={onToggleFavorite}
      />,
    );
    const user = userEvent.setup();
    const button = screen.getByRole('button', { name: 'お気に入り' });
    await user.click(button);
    expect(button).toHaveAttribute('aria-pressed', String(!initialFavorite));

    await act(async () => request.reject(new Error('Network unavailable')));
    expect(await screen.findByRole('alert')).toHaveTextContent(
      'お気に入りの更新に失敗しました。もう一度お試しください。',
    );
    expect(button).toHaveAttribute('aria-pressed', String(initialFavorite));
    expect(button).toBeEnabled();
    await user.click(button);
    await waitFor(() =>
      expect(screen.queryByRole('alert')).not.toBeInTheDocument(),
    );
    expect(onToggleFavorite).toHaveBeenCalledTimes(2);
  });

  it('関連データがない場合は各セクションの空状態を表示する', () => {
    render(<ScenarioDetailPanel {...defaultProps} />);
    expect(
      screen.getByRole('heading', { name: '関連セッション（0件）' }),
    ).toBeInTheDocument();
    expect(screen.getByText('まだプレイ動画がありません')).toBeInTheDocument();
    expect(
      screen.getByText(
        'まだレビューがありません。プレイしたら感想を書いてみましょう！',
      ),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: '動画を登録する' }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: 'レビューを書く' }),
    ).not.toBeInTheDocument();
  });

  it('関連セッションへのリンクと未定のGM・日程を表示する', () => {
    render(
      <ScenarioDetailPanel
        {...defaultProps}
        sessions={[
          {
            gameSessionId: 'session_01',
            sessionName: '週末の探索会',
            scenarioId: scenarioFixture.scenarioId,
            sessionPhase: 'RECRUITING',
            createdAt: '2026-06-01T10:00:00Z',
            updatedAt: '2026-06-01T10:00:00Z',
            keeper: null,
            participantCount: 0,
            scheduleDate: null,
          },
        ]}
      />,
    );
    expect(screen.getByRole('link', { name: '週末の探索会' })).toHaveAttribute(
      'href',
      '/sessions/session_01',
    );
    expect(screen.getByText('GM：未定')).toBeInTheDocument();
    expect(screen.getByText('プレイ予定：日程未定')).toBeInTheDocument();
    expect(screen.getByText('参加人数：0人')).toBeInTheDocument();
  });

  it('投稿者本人のコメントだけに編集導線を表示する', () => {
    const { rerender } = render(
      <ScenarioDetailPanel
        {...defaultProps}
        currentUserId="u1"
        reviews={[reviewFixture]}
        reviewTotalCount={1}
      />,
    );
    expect(screen.getByRole('button', { name: '編集' })).toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: '非表示' }),
    ).not.toBeInTheDocument();
    rerender(
      <ScenarioDetailPanel
        {...defaultProps}
        currentUserId="u2"
        reviews={[reviewFixture]}
        reviewTotalCount={1}
      />,
    );
    expect(
      screen.queryByRole('button', { name: '編集' }),
    ).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: '非表示' })).toBeInTheDocument();
  });

  it('ネタバレでない動画は最初から開ける', () => {
    render(
      <ScenarioDetailPanel
        {...defaultProps}
        videos={[{ ...videoFixture, spoiler: false }]}
      />,
    );
    expect(
      screen.getByRole('link', { name: 'YouTube動画を開く' }),
    ).toHaveAttribute('href', videoFixture.videoUrl);
    expect(
      screen.queryByRole('checkbox', { name: 'ネタバレ表示' }),
    ).not.toBeInTheDocument();
  });

  it('プレイ済みでは投稿導線を表示し、ネタバレ本文は操作するまで隠す', async () => {
    const user = userEvent.setup();
    render(
      <ScenarioDetailPanel
        {...defaultProps}
        isPlayed
        reviews={[reviewFixture]}
        reviewTotalCount={1}
      />,
    );
    expect(
      screen.getByRole('button', { name: '動画を登録する' }),
    ).toBeInTheDocument();
    expect(screen.getByText('探索と会話を楽しめました。')).toBeInTheDocument();
    expect(
      screen.queryByText('失踪事件の真相に驚きました。'),
    ).not.toBeInTheDocument();
    await user.click(
      screen.getByRole('button', { name: 'ネタバレを表示する' }),
    );
    expect(
      screen.getByText('失踪事件の真相に驚きました。'),
    ).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'ネタバレを非表示' }));
    expect(
      screen.queryByText('失踪事件の真相に驚きました。'),
    ).not.toBeInTheDocument();
  });

  it('ネタバレ動画のサムネイルを個別に表示し、一括スイッチで隠せる', async () => {
    const user = userEvent.setup();
    render(<ScenarioDetailPanel {...defaultProps} videos={[videoFixture]} />);
    expect(
      screen.queryByRole('link', { name: 'YouTube動画を開く' }),
    ).not.toBeInTheDocument();
    const toggle = screen.getByRole('checkbox', { name: 'ネタバレ表示' });
    expect(toggle).not.toBeChecked();
    await user.click(screen.getByRole('button', { name: 'ネタバレ表示' }));
    expect(
      screen.getByRole('link', { name: 'YouTube動画を開く' }),
    ).toHaveAttribute('href', videoFixture.videoUrl);
    expect(toggle).toBeChecked();
    await user.click(toggle);
    expect(
      screen.queryByRole('link', { name: 'YouTube動画を開く' }),
    ).not.toBeInTheDocument();
  });

  it('概要未登録の場合は空の概要見出しを表示しない', () => {
    render(
      <ScenarioDetailPanel
        {...defaultProps}
        scenario={{ ...scenarioFixture, description: null }}
      />,
    );
    expect(
      screen.queryByRole('heading', { name: 'シナリオ概要' }),
    ).not.toBeInTheDocument();
  });
});
