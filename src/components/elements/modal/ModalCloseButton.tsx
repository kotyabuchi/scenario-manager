import { type ButtonHTMLAttributes, forwardRef } from 'react';
import { X } from '@phosphor-icons/react/ssr';

import * as styles from './styles';

type ModalCloseButtonProps = Omit<
  ButtonHTMLAttributes<HTMLButtonElement>,
  'children' | 'className' | 'style' | 'type'
>;

export const ModalCloseButton = forwardRef<
  HTMLButtonElement,
  ModalCloseButtonProps
>((props, ref) => (
  <button
    {...props}
    ref={ref}
    type="button"
    className={styles.closeButton}
    aria-label={props['aria-label'] ?? '閉じる'}
  >
    <X size={20} aria-hidden="true" />
  </button>
));

ModalCloseButton.displayName = 'ModalCloseButton';
