'use client';

import { ark } from '@ark-ui/react';
import { styled } from '@styled-system/jsx';
import { spinner } from '@styled-system/recipes/spinner';
import type { ComponentProps } from 'react';

type SpinnerProps = {
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  loadingLabel?: string;
} & ComponentProps<typeof StyledSpinner>;

const StyledSpinner = styled(ark.div, spinner);

export const Spinner = ({
  size = 'md',
  loadingLabel,
  ...props
}: SpinnerProps) => {
  return (
    <StyledSpinner
      size={size}
      aria-label={loadingLabel || 'Loading'}
      {...props}
    />
  );
};
