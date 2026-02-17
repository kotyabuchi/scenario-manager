'use client';

import { useState } from 'react';
import { Plus } from '@phosphor-icons/react/ssr';

import { FeedbackModal } from '@/components/blocks/FeedbackModal';
import { Button } from '@/components/elements/button/button';

export const NewFeedbackButton = () => {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button status="primary" size="sm" onClick={() => setOpen(true)}>
        <Plus size={16} weight="bold" />
        新規投稿
      </Button>
      <FeedbackModal open={open} onOpenChange={(d) => setOpen(d.open)} />
    </>
  );
};
