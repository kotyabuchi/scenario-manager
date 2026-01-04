'use client';

import { Loader } from 'lucide-react';

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
    <Loader
      aria-label={loadingLabel}
      className={spinner({ size })}
      strokeWidth={3}
    />
  );
};
