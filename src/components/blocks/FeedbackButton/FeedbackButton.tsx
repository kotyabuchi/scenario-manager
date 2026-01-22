'use client';

import { useState } from 'react';
import { MessageSquarePlus } from 'lucide-react';

import { FeedbackModal } from '../FeedbackModal';
import * as styles from './styles';

export const FeedbackButton = () => {
  const [isOpen, setIsOpen] = useState(false);

  const handleOpenChange = (details: { open: boolean }) => {
    setIsOpen(details.open);
  };

  return (
    <>
      <div className={styles.container}>
        <button
          type="button"
          className={styles.button}
          onClick={() => setIsOpen(true)}
          aria-label="フィードバックを送る"
          title="フィードバックを送る"
        >
          <MessageSquarePlus size={24} />
        </button>
      </div>

      <FeedbackModal open={isOpen} onOpenChange={handleOpenChange} />
    </>
  );
};
