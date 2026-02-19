import { forwardRef } from 'react';
import { ark } from '@ark-ui/react/factory';
import { styled } from 'styled-system/jsx';

import { input, inputAddon, inputInner, inputWrapper } from './styles';

import type { ReactNode } from 'react';
import type { ComponentProps } from 'styled-system/types';

const StyledInput = styled(ark.input, input);

type StyledInputProps = ComponentProps<typeof StyledInput>;

type InputProps = Omit<StyledInputProps, 'prefix' | 'suffix'> & {
  /** 入力欄の左側に配置する要素（アイコン、テキスト等） */
  prefix?: ReactNode;
  /** 入力欄の右側に配置する要素（単位、ボタン等） */
  suffix?: ReactNode;
};

/**
 * テキスト入力コンポーネント
 *
 * UIデザインシステム準拠:
 * - ボーダーレス（影で階層表現）
 * - ホバー/フォーカス時の背景色変化
 * - フォーカスリングでアクセシビリティ確保
 *
 * React Hook Formの`register`と完全互換
 *
 * @example
 * <Input id="name" placeholder="名前を入力" {...register('name')} />
 *
 * @example
 * <Input prefix={<MagnifyingGlass />} placeholder="検索..." />
 *
 * @example
 * <Input suffix={<span>円</span>} type="number" placeholder="金額" />
 */
export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ prefix, suffix, size, hasError, className, ...inputProps }, ref) => {
    if (!prefix && !suffix) {
      return (
        <StyledInput
          size={size}
          hasError={hasError}
          className={className}
          {...inputProps}
          ref={ref}
        />
      );
    }

    return (
      <div
        className={inputWrapper({
          size: size as 'sm' | 'md' | 'lg' | undefined,
          hasError,
        })}
      >
        {prefix && <span className={inputAddon}>{prefix}</span>}
        <StyledInput
          size={size}
          {...inputProps}
          ref={ref}
          className={className ? `${inputInner} ${className}` : inputInner}
        />
        {suffix && <span className={inputAddon}>{suffix}</span>}
      </div>
    );
  },
);

Input.displayName = 'Input';

export type { InputProps };
