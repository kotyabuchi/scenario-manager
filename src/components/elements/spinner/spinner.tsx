'use client';

import { SpinnerGap } from '@phosphor-icons/react/ssr';

import { spinner } from '@/styled-system/recipes/spinner';

type SpinnerProps = {
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  loadingLabel?: string;
};

export const Spinner = ({
  size = 'md',
  loadingLabel = 'Loading...',
}: SpinnerProps) => {
  return (
    <SpinnerGap
      aria-label={loadingLabel}
      className={spinner({ size })}
      weight="bold"
    />
  );
};
