import { Button } from '@/components/elements/button/button';

import type { MouseEventHandler, ReactNode } from 'react';

type ModalDismissButtonProps = {
  children: ReactNode;
  onClick?: MouseEventHandler<HTMLButtonElement>;
  disabled?: boolean;
};

export const ModalDismissButton = ({
  children,
  onClick,
  disabled,
}: ModalDismissButtonProps) => (
  <Button
    type="button"
    variant="ghost"
    status="primary"
    onClick={onClick}
    disabled={disabled}
  >
    {children}
  </Button>
);
