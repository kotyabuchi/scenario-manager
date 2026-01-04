import { forwardRef } from 'react';
import { ark } from '@ark-ui/react/factory';
import { styled } from 'styled-system/jsx';

import { Spinner } from '../spinner/spinner';

import { type ButtonVariantProps, button } from '@/styled-system/recipes';

import type { ComponentProps } from 'styled-system/types';

type IconButtonProps = {
  loading?: boolean;
  loadingText?: string;
} & ComponentProps<typeof StyledIconButton>;

export const StyledIconButton = styled(ark.button, button, {
  defaultProps: { px: 0 } as ButtonVariantProps,
});

export const IconButton = forwardRef<HTMLButtonElement, IconButtonProps>(
  (props, ref) => {
    const {
      loading,
      loadingText,
      children,
      'aria-label': ariaLabel,
      ...rest
    } = props;

    return (
      <StyledIconButton
        {...rest}
        disabled={loading || rest.disabled}
        aria-label={loading ? loadingText || 'Loading...' : ariaLabel}
        ref={ref}
      >
        {loading ? <Spinner size="sm" /> : children}
      </StyledIconButton>
    );
  },
);
IconButton.displayName = 'IconButton';
