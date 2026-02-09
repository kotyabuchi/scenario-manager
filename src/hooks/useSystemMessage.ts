import { useCallback } from 'react';
import { useAtomValue, useSetAtom } from 'jotai';

import {
  type MessageLevel,
  systemMessageActionsAtom,
  systemMessagesAtom,
} from '@/store/systemMessage';

/**
 * システムメッセージの一覧を取得するフック（読み取り専用）
 * メッセージの変更を監視するため、表示コンポーネントで使用する
 */
export const useSystemMessages = () => {
  return useAtomValue(systemMessagesAtom);
};

/**
 * システムメッセージを操作するためのフック（書き込み専用）
 * atom を購読しないため、メッセージ変更による再レンダリングが発生しない
 */
export const useSystemMessageActions = () => {
  const dispatch = useSetAtom(systemMessageActionsAtom);

  const addMessage = useCallback(
    (level: MessageLevel, message: string) => {
      dispatch({ type: 'add', level, message });
    },
    [dispatch],
  );

  const removeMessage = useCallback(
    (id: string) => {
      dispatch({ type: 'remove', id });
    },
    [dispatch],
  );

  const clearAll = useCallback(() => {
    dispatch({ type: 'clear' });
  }, [dispatch]);

  return { addMessage, removeMessage, clearAll };
};
