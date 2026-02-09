'use client';

import * as styles from './styles';

import { Alert } from '@/components/elements';
import {
  useSystemMessageActions,
  useSystemMessages,
} from '@/hooks/useSystemMessage';

export const SystemMessage = () => {
  const messages = useSystemMessages();
  const { removeMessage } = useSystemMessageActions();

  if (messages.length === 0) {
    return null;
  }

  return (
    <div className={styles.container} role="alert" aria-live="polite">
      {messages.map((msg) => (
        <Alert
          key={msg.id}
          status={msg.level}
          variant="subtle"
          title={msg.message}
          onActionClick={() => removeMessage(msg.id)}
        />
      ))}
    </div>
  );
};
