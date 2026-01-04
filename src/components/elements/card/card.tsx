import { type ComponentProps, forwardRef, type PropsWithChildren } from 'react';
import { ark } from '@ark-ui/react';

import { styled } from '@/styled-system/jsx';
import { card } from '@/styled-system/recipes';

type CardProps = ComponentProps<typeof StyledCard>;

export const StyledCard = styled(ark.div, card);

export const Card = forwardRef<HTMLDivElement, PropsWithChildren<CardProps>>(
  ({ children, ...rest }, ref) => (
    <StyledCard ref={ref} {...rest}>
      {children}
    </StyledCard>
  ),
);

Card.displayName = 'Card';
