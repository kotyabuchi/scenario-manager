import { atom } from 'jotai';
import { ulid } from 'ulid';

/**
 * メッセージのレベル（種類）
 */
export type MessageLevel = 'success' | 'error' | 'warning' | 'info';

/**
 * システムメッセージの型定義
 */
export type SystemMessage = {
  id: string;
  level: MessageLevel;
  message: string;
  createdAt: number;
};

/**
 * システムメッセージのリストを管理するatom
 */
export const systemMessagesAtom = atom<SystemMessage[]>([]);

/**
 * メッセージを追加するための書き込み専用atom
 */
export const addSystemMessageAtom = atom(
  null,
  (get, set, payload: { level: MessageLevel; message: string }) => {
    const newMessage: SystemMessage = {
      id: ulid(),
      level: payload.level,
      message: payload.message,
      createdAt: Date.now(),
    };
    const currentMessages = get(systemMessagesAtom);
    set(systemMessagesAtom, [...currentMessages, newMessage]);
  },
);

/**
 * メッセージを削除するための書き込み専用atom
 */
export const removeSystemMessageAtom = atom(null, (get, set, id: string) => {
  const currentMessages = get(systemMessagesAtom);
  set(
    systemMessagesAtom,
    currentMessages.filter((msg) => msg.id !== id),
  );
});

/**
 * 全メッセージをクリアするための書き込み専用atom
 */
export const clearAllSystemMessagesAtom = atom(null, (_get, set) => {
  set(systemMessagesAtom, []);
});
