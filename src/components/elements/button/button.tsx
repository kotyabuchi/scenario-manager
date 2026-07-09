import { forwardRef, type ReactNode } from 'react';
import { ark } from '@ark-ui/react/factory';
import { styled } from 'styled-system/jsx';

import { Spinner } from '../spinner/spinner';
import * as styles from './styles';

import { button } from '@/styled-system/recipes';

import type { ComponentProps } from 'styled-system/types';

export const StyledButton = styled(ark.button, button);

type StyledButtonProps = ComponentProps<typeof StyledButton>;

type ButtonProps = Omit<StyledButtonProps, 'prefix' | 'suffix'> & {
  loading?: boolean;
  loadingText?: string;
  prefix?: ReactNode;
  suffix?: ReactNode;
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (props, ref) => {
    const { loading, loadingText, prefix, suffix, children, ...rest } = props;

    // テキストラベルはハーフレディングを刈り取り、アイコンと光学中央揃えにする。
    // 要素child（アイコン等）を巻き込まないよう文字列/数値のみ対象
    const label =
      typeof children === 'string' || typeof children === 'number' ? (
        <span className={styles.buttonLabel}>{children}</span>
      ) : (
        children
      );

    // asChild の場合は子要素を Slot にそのまま渡す。
    // prefix/suffix/loading のラッパー（フラグメント＋複数子）を挟むと
    // Ark の Slot が単一子要素を要求するためマージに失敗し、何も描画されなくなる。
    if (rest.asChild) {
      return (
        <StyledButton {...rest} ref={ref} disabled={loading || rest.disabled}>
          {children}
        </StyledButton>
      );
    }

    return (
      <StyledButton {...rest} ref={ref} disabled={loading || rest.disabled}>
        {loading ? (
          <>
            <Spinner />
            {loadingText ? (
              <span className={styles.buttonLabel}>{loadingText}</span>
            ) : (
              label
            )}
          </>
        ) : (
          <>
            {prefix}
            {label}
          </>
        )}
        {suffix}
      </StyledButton>
    );
  },
);

Button.displayName = 'Button';
