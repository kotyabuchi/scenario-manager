import { act, renderHook } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { useSpeedDial } from '../useSpeedDial';

describe('useSpeedDial', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('状態管理', () => {
    // SD-H01: 初期状態で isOpen が false
    it('初期状態で isOpen が false', () => {
      const { result } = renderHook(() => useSpeedDial());

      expect(result.current.isOpen).toBe(false);
    });

    // SD-H02: open() で isOpen が true になる
    it('open() で isOpen が true になる', () => {
      const { result } = renderHook(() => useSpeedDial());

      act(() => {
        result.current.open();
      });

      expect(result.current.isOpen).toBe(true);
    });

    // SD-H03: close() で isOpen が false になる
    it('close() で isOpen が false になる', () => {
      const { result } = renderHook(() => useSpeedDial());

      act(() => {
        result.current.open();
      });
      expect(result.current.isOpen).toBe(true);

      act(() => {
        result.current.close();
      });
      expect(result.current.isOpen).toBe(false);
    });

    // SD-H04: toggle() で isOpen がトグルされる
    it('toggle() で isOpen がトグルされる', () => {
      const { result } = renderHook(() => useSpeedDial());

      act(() => {
        result.current.toggle();
      });
      expect(result.current.isOpen).toBe(true);

      act(() => {
        result.current.toggle();
      });
      expect(result.current.isOpen).toBe(false);
    });
  });

  describe('キーボード操作', () => {
    // SD-H05: Escape キー押下で close() が呼ばれる
    it('Escape キー押下でメニューが閉じる', () => {
      const { result } = renderHook(() => useSpeedDial());

      act(() => {
        result.current.open();
      });
      expect(result.current.isOpen).toBe(true);

      act(() => {
        document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
      });

      expect(result.current.isOpen).toBe(false);
    });

    it('メニューが閉じている時はEscapeキーに反応しない', () => {
      const { result } = renderHook(() => useSpeedDial());

      expect(result.current.isOpen).toBe(false);

      act(() => {
        document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
      });

      expect(result.current.isOpen).toBe(false);
    });
  });
});
