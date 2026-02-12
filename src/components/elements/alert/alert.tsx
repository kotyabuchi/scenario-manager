'use client';

import { ark } from '@ark-ui/react/factory';
import {
  Check,
  Info,
  Warning,
  WarningCircle,
  X,
} from '@phosphor-icons/react/ssr';
import { match } from 'ts-pattern';

import { alert } from '@/styled-system/recipes';

import type { ComponentProps } from 'react';

export type AlertVariant = 'soft' | 'subtle' | 'outline';
export type AlertStatus = 'info' | 'success' | 'warning' | 'danger';

type Props = {
  title?: string;
  description?: string;
  variant?: AlertVariant;
  status?: AlertStatus;
  subIcon?: React.ReactNode;
  onActionClick?: () => void;
} & ComponentProps<typeof ark.div>;

export const Alert = ({
  variant = 'soft',
  status = 'info',
  title,
  description,
  subIcon,
  onClick,
  onActionClick,
  ...props
}: Props) => {
  const recipe = alert({ variant, status, hasAction: !!onClick });

  return (
    <ark.div
      role="alert"
      aria-live="polite"
      onClick={(e) => {
        onClick?.(e);
      }}
      className={recipe.root}
      {...props}
    >
      <ark.svg
        role="img"
        aria-label={`${status} icon`}
        className={recipe.icon}
        asChild
      >
        {match(status)
          .with('info', () => <Info size="20" />)
          .with('success', () => <Check size="20" />)
          .with('warning', () => <Warning size="20" />)
          .with('danger', () => <WarningCircle size="20" />)
          .exhaustive()}
      </ark.svg>
      <ark.div className={recipe.content}>
        {title && (
          <ark.h5 className={recipe.title} aria-label={title}>
            {title}
          </ark.h5>
        )}
        {description && (
          <ark.div className={recipe.description} aria-label={description}>
            {description}
          </ark.div>
        )}
      </ark.div>
      {onActionClick && (
        <ark.button
          className={recipe.actionButton}
          aria-label="alert action"
          onClick={(e) => {
            e.stopPropagation();
            onActionClick?.();
          }}
        >
          <ark.svg
            role="img"
            aria-label="Close icon"
            className={recipe.icon}
            asChild
          >
            {subIcon || <X size="20" />}
          </ark.svg>
        </ark.button>
      )}
    </ark.div>
  );
};
