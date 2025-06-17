'use client';

import { spinner } from '@styled-system/recipes/spinner';
import { Loader } from 'lucide-react';

type SpinnerProps = {
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  loadingLabel?: string;
};

export const Spinner = ({
  size = 'md',
  loadingLabel = 'Loading...',
}: SpinnerProps) => {
  return <Loader aria-label={loadingLabel} className={spinner({ size })} />;
};
