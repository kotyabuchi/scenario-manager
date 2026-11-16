import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
} from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { ScenarioForm } from './ScenarioForm';

import { isImportableUrl } from '@/lib/scenario-fetcher/url-validator';

vi.mock('../actions', () => ({ createScenarioAction: vi.fn() }));
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn(), back: vi.fn() }),
}));
vi.mock('@/lib/scenario-fetcher/url-validator', async (importOriginal) => {
  const actual =
    await importOriginal<
      typeof import('@/lib/scenario-fetcher/url-validator')
    >();
  return { ...actual, isImportableUrl: vi.fn(actual.isImportableUrl) };
});

const BOOTH = 'https://booth.pm/ja/items/12345';
const UNSUPPORTED = 'https://example.com/some-page';
const enterUrl = (value: string) => {
  fireEvent.change(screen.getByLabelText('配布URL'), { target: { value } });
};
const advance = (milliseconds: number) => {
  act(() => vi.advanceTimersByTime(milliseconds));
};

beforeEach(() => {
  vi.useFakeTimers();
  vi.clearAllMocks();
});
afterEach(() => {
  cleanup();
  vi.clearAllTimers();
  vi.useRealTimers();
  vi.restoreAllMocks();
});

describe('ScenarioFormの配布URL判定', () => {
  it('初期空欄から非対応URLを入力し、判定完了後もバナーを表示しない', () => {
    render(<ScenarioForm systems={[]} tags={[]} />);
    expect(screen.queryByRole('note')).toBeNull();
    enterUrl(UNSUPPORTED);
    expect(isImportableUrl).not.toHaveBeenCalledWith(UNSUPPORTED);
    advance(500);
    expect(isImportableUrl).toHaveBeenCalledWith(UNSUPPORTED);
    expect(screen.queryByRole('note')).toBeNull();
  });

  it('初期空欄からBOOTH URLを入力すると判定後にバナーを表示する', () => {
    render(<ScenarioForm systems={[]} tags={[]} />);
    enterUrl(BOOTH);
    advance(500);
    expect(isImportableUrl).toHaveBeenCalledWith(BOOTH);
    expect(screen.getByRole('note')).toBeVisible();
  });

  it('BOOTHバナー表示後に非対応URLへ変更すると判定後に消える', () => {
    render(<ScenarioForm systems={[]} tags={[]} />);
    enterUrl(BOOTH);
    advance(500);
    expect(isImportableUrl).toHaveBeenCalledWith(BOOTH);
    expect(screen.getByRole('note')).toBeVisible();

    enterUrl(UNSUPPORTED);
    expect(isImportableUrl).not.toHaveBeenCalledWith(UNSUPPORTED);
    advance(500);
    expect(isImportableUrl).toHaveBeenCalledWith(UNSUPPORTED);
    expect(screen.queryByRole('note')).toBeNull();
  });

  it('短時間のBOOTHから非対応URLへの変更で古い判定を取消す', () => {
    render(<ScenarioForm systems={[]} tags={[]} />);
    enterUrl(BOOTH);
    advance(150);
    enterUrl(UNSUPPORTED);
    advance(500);
    expect(isImportableUrl).not.toHaveBeenCalledWith(BOOTH);
    expect(isImportableUrl).toHaveBeenCalledWith(UNSUPPORTED);
    expect(screen.queryByRole('note')).toBeNull();
  });

  it('unmount時に保留中のURL判定を取消す', () => {
    const view = render(<ScenarioForm systems={[]} tags={[]} />);
    enterUrl(BOOTH);
    view.unmount();
    advance(500);
    expect(isImportableUrl).not.toHaveBeenCalledWith(BOOTH);
  });
});
