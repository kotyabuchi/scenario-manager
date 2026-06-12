import { atom } from 'jotai';

/**
 * サイドバーの折りたたみ状態
 * - `null`: ブレークポイント自動（lg以上は展開、md〜lgは折りたたみ。CSSで分岐）
 * - `true`: 折りたたみ（64px）
 * - `false`: 展開（240px）
 */
export const sidebarCollapsedAtom = atom<boolean | null>(null);
