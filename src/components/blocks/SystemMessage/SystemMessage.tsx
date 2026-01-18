'use client';

import { useAtomValue, useSetAtom } from 'jotai';
import { AlertCircle, AlertTriangle, CheckCircle, Info, X } from 'lucide-react';

import * as styles from './styles';

import {
  type MessageLevel,
  removeSystemMessageAtom,
  systemMessagesAtom,
} from '@/store/systemMessage';

const getIcon = (level: MessageLevel) => {
  switch (level) {
    case 'success':
      return <CheckCircle size={20} />;
    case 'error':
      return <AlertCircle size={20} />;
    case 'warning':
      return <AlertTriangle size={20} />;
    case 'info':
      return <Info size={20} />;
  }
};

export const SystemMessage = () => {
  const messages = useAtomValue(systemMessagesAtom);
  const removeMessage = useSetAtom(removeSystemMessageAtom);

  if (messages.length === 0) {
    return null;
  }

  return (
    <div className={styles.container} role="alert" aria-live="polite">
      {messages.map((msg) => (
        <div key={msg.id} className={styles.messageItem({ level: msg.level })}>
          <span className={styles.icon}>{getIcon(msg.level)}</span>
          <span className={styles.messageText}>{msg.message}</span>
          <button
            type="button"
            className={styles.closeButton}
            onClick={() => removeMessage(msg.id)}
            aria-label="メッセージを閉じる"
          >
            <X size={16} />
          </button>
        </div>
      ))}
    </div>
  );
};
