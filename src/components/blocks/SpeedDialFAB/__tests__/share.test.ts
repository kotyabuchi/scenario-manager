import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { shareCurrentPage } from '../share';

describe('shareCurrentPage', () => {
  beforeEach(() => {
    // document.title と location.href のモック
    Object.defineProperty(document, 'title', {
      value: 'テストページ',
      writable: true,
    });
    Object.defineProperty(window, 'location', {
      value: { href: 'https://example.com/scenarios/123' },
      writable: true,
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  // SD-S01: デスクトップ: URLをクリップボードにコピーできる
  it('Web Share API非対応時にクリップボードにコピーする', async () => {
    // Web Share API を非対応にする
    Object.defineProperty(navigator, 'share', {
      value: undefined,
      writable: true,
      configurable: true,
    });

    const writeTextMock = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, 'clipboard', {
      value: { writeText: writeTextMock },
      writable: true,
      configurable: true,
    });

    const result = await shareCurrentPage();

    expect(writeTextMock).toHaveBeenCalledWith(
      'https://example.com/scenarios/123',
    );
    expect(result).toBe('clipboard');
  });

  // SD-S02: Web Share API対応時: navigator.share が呼ばれる
  it('Web Share API対応時にnavigator.shareが呼ばれる', async () => {
    const shareMock = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, 'share', {
      value: shareMock,
      writable: true,
      configurable: true,
    });
    Object.defineProperty(navigator, 'canShare', {
      value: () => true,
      writable: true,
      configurable: true,
    });

    const result = await shareCurrentPage();

    expect(shareMock).toHaveBeenCalledWith({
      title: 'テストページ',
      url: 'https://example.com/scenarios/123',
    });
    expect(result).toBe('share');
  });

  // SD-S03: Web Share API非対応時: クリップボードにフォールバック
  it('navigator.shareがエラーの場合クリップボードにフォールバックする', async () => {
    const shareMock = vi.fn().mockRejectedValue(new Error('Share failed'));
    Object.defineProperty(navigator, 'share', {
      value: shareMock,
      writable: true,
      configurable: true,
    });
    Object.defineProperty(navigator, 'canShare', {
      value: () => true,
      writable: true,
      configurable: true,
    });

    const writeTextMock = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, 'clipboard', {
      value: { writeText: writeTextMock },
      writable: true,
      configurable: true,
    });

    const result = await shareCurrentPage();

    expect(writeTextMock).toHaveBeenCalledWith(
      'https://example.com/scenarios/123',
    );
    expect(result).toBe('clipboard');
  });
});
