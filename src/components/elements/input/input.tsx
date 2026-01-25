import { forwardRef } from 'react';
import { ark } from '@ark-ui/react/factory';
import { styled } from 'styled-system/jsx';

import { input } from './styles';

import type { ComponentProps } from 'styled-system/types';

const StyledInput = styled(ark.input, input);

type InputProps = ComponentProps<typeof StyledInput>;

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
 * <Input type="url" id="website" placeholder="https://..." {...register('website')} />
 *
 * @example
 * <Input type="number" min={1} max={20} {...register('count')} />
 */
export const Input = forwardRef<HTMLInputElement, InputProps>((props, ref) => {
  return <StyledInput {...props} ref={ref} />;
});

Input.displayName = 'Input';

export type { InputProps };
