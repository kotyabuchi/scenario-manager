import { atom } from 'jotai';
import { ulid } from 'ulid';

/**
 * メッセージのレベル（種類）
 */
export type MessageLevel = 'success' | 'danger' | 'warning' | 'info';

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
 * システムメッセージアクションの型定義
 */
export type SystemMessageAction =
  | { type: 'add'; level: MessageLevel; message: string }
  | { type: 'remove'; id: string }
  | { type: 'clear' };

/**
 * システムメッセージのリストを管理するatom
 */
export const systemMessagesAtom = atom<SystemMessage[]>([]);

/**
 * システムメッセージを操作するための統合atom
 * - add: メッセージを追加
 * - remove: 指定IDのメッセージを削除
 * - clear: 全メッセージをクリア
 */
export const systemMessageActionsAtom = atom(
  null,
  (get, set, action: SystemMessageAction) => {
    const currentMessages = get(systemMessagesAtom);

    switch (action.type) {
      case 'add': {
        const newMessage: SystemMessage = {
          id: ulid(),
          level: action.level,
          message: action.message,
          createdAt: Date.now(),
        };
        set(systemMessagesAtom, [...currentMessages, newMessage]);
        break;
      }
      case 'remove': {
        set(
          systemMessagesAtom,
          currentMessages.filter((msg) => msg.id !== action.id),
        );
        break;
      }
      case 'clear': {
        set(systemMessagesAtom, []);
        break;
      }
    }
  },
);
