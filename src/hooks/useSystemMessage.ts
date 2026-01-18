import { useCallback } from 'react';
import { useSetAtom } from 'jotai';

import {
  addSystemMessageAtom,
  clearAllSystemMessagesAtom,
  type MessageLevel,
  removeSystemMessageAtom,
} from '@/store/systemMessage';

/**
 * システムメッセージを操作するためのカスタムフック
 */
export const useSystemMessage = () => {
  const addMessage = useSetAtom(addSystemMessageAtom);
  const removeMessage = useSetAtom(removeSystemMessageAtom);
  const clearAll = useSetAtom(clearAllSystemMessagesAtom);

  const showMessage = useCallback(
    (level: MessageLevel, message: string) => {
      addMessage({ level, message });
    },
    [addMessage],
  );

  const showSuccess = useCallback(
    (message: string) => {
      showMessage('success', message);
    },
    [showMessage],
  );

  const showError = useCallback(
    (message: string) => {
      showMessage('error', message);
    },
    [showMessage],
  );

  const showWarning = useCallback(
    (message: string) => {
      showMessage('warning', message);
    },
    [showMessage],
  );

  const showInfo = useCallback(
    (message: string) => {
      showMessage('info', message);
    },
    [showMessage],
  );

  return {
    showMessage,
    showSuccess,
    showError,
    showWarning,
    showInfo,
    removeMessage,
    clearAll,
  };
};
