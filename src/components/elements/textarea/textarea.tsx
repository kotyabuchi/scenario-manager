import { forwardRef } from 'react';
import { ark } from '@ark-ui/react/factory';
import { styled } from 'styled-system/jsx';

import { textarea } from './styles';

import type { ComponentProps } from 'styled-system/types';

const StyledTextarea = styled(ark.textarea, textarea);

type TextareaProps = ComponentProps<typeof StyledTextarea>;

/**
 * テキストエリアコンポーネント
 *
 * UIデザインシステム準拠:
 * - ボーダーレス（影で階層表現）
 * - ホバー/フォーカス時の背景色変化
 * - フォーカスリングでアクセシビリティ確保
 * - 垂直方向のリサイズ可能
 *
 * React Hook Formの`register`と完全互換
 *
 * @example
 * <Textarea id="description" placeholder="説明を入力" {...register('description')} />
 *
 * @example
 * <Textarea size="lg" rows={10} {...register('content')} />
 */
export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  (props, ref) => {
    return <StyledTextarea {...props} ref={ref} />;
  },
);

Textarea.displayName = 'Textarea';

export type { TextareaProps };
