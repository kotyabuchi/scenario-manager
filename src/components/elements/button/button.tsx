import { ark } from '@ark-ui/react/factory';
import { button } from '@styled-system/recipes';
import { forwardRef } from 'react';
import { styled } from 'styled-system/jsx';
import type { ComponentProps } from 'styled-system/types';
import { Spinner } from '../spinner/spinner';

type ButtonProps = {
  loading?: boolean;
  loadingText?: string;
} & ComponentProps<typeof StyledButton>;

export const StyledButton = styled(ark.button, button);

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (props, ref) => {
    const { loading, loadingText, children, ...rest } = props;

    return (
      <StyledButton {...rest} ref={ref}>
        {loading && <Spinner size="sm" />}
        {children}
      </StyledButton>
    );
  },
);

Button.displayName = 'Button';
