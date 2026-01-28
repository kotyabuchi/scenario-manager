import { forwardRef } from 'react';
import { ark } from '@ark-ui/react/factory';
import { styled } from 'styled-system/jsx';

import { Spinner } from '../spinner/spinner';

import { button } from '@/styled-system/recipes';

import type { ComponentProps } from 'styled-system/types';

type ButtonProps = {
  loading?: boolean;
  loadingText?: string;
} & ComponentProps<typeof StyledButton>;

export const StyledButton = styled(ark.button, button);

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (props, ref) => {
    const { loading, loadingText, children, ...rest } = props;

    return (
      <StyledButton {...rest} ref={ref} disabled={loading || rest.disabled}>
        {loading ? (
          <>
            <Spinner size="sm" />
            {loadingText ? <span>{loadingText}</span> : children}
          </>
        ) : (
          children
        )}
      </StyledButton>
    );
  },
);

Button.displayName = 'Button';
