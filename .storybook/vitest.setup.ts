import '@testing-library/jest-dom/vitest';
import * as a11yAddonAnnotations from '@storybook/addon-a11y/preview';
import { setProjectAnnotations } from '@storybook/react';
import { cleanup } from '@testing-library/react';
import { afterEach, beforeAll, vi } from 'vitest';

import * as projectAnnotations from './preview';

// next/font は Next.js / Storybook のビルド時に変換されるため、
// その変換を行わない Vitest ではフォントのメタデータだけを代替する。
vi.mock('next/font/google', () => ({
  Noto_Sans_JP: () => ({
    className: 'test-noto-sans-jp',
    variable: 'test-noto-sans-jp-variable',
    style: { fontFamily: 'Noto Sans JP' },
  }),
}));

// ResizeObserver mock for jsdom
const ResizeObserverMock = vi.fn(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}));
vi.stubGlobal('ResizeObserver', ResizeObserverMock);

// scrollTo mock for jsdom (Ark UIのzag-jsが使用)
Element.prototype.scrollTo = vi.fn();

// matchMedia mock for jsdom
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation((query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

// テスト間でDOMをクリーンアップ
afterEach(() => {
  cleanup();
});

// composeStories使用時にStorybook設定を適用するために必要
// More info at: https://storybook.js.org/docs/api/portable-stories/portable-stories-vitest#setprojectannotations
const project = setProjectAnnotations([
  a11yAddonAnnotations,
  projectAnnotations,
]);

beforeAll(project.beforeAll);
