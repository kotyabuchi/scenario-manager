'use client';

import { ark } from '@ark-ui/react/factory';
import { alert } from '@styled-system/recipes';
import {
  CheckIcon,
  CircleAlert,
  InfoIcon,
  TriangleAlert,
  X,
} from 'lucide-react';
import type { ComponentProps } from 'react';
import { match } from 'ts-pattern';

export type AlertVariant = 'solid' | 'subtle' | 'outline';
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
  variant = 'solid',
  status = 'info',
  title,
  description,
  subIcon,
  onClick,
  onActionClick,
  ...props
}: Props) => {
  const recipe = alert({ variant, status });

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
      <ark.svg role="img" aria-label={`${status} icon`} className={recipe.icon}>
        {match(status)
          .with('info', () => <InfoIcon />)
          .with('success', () => <CheckIcon />)
          .with('warning', () => <TriangleAlert />)
          .with('danger', () => <CircleAlert />)
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
          <ark.svg role="img" aria-label="Close icon" className={recipe.icon}>
            {subIcon || <X />}
          </ark.svg>
        </ark.button>
      )}
    </ark.div>
  );
};
