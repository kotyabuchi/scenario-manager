import { AlertCircle } from 'lucide-react';

import * as styles from './styles';

import type { FieldError as RHFFieldError } from 'react-hook-form';

type Props = {
  error: RHFFieldError | undefined;
};

/**
 * フォームのフィールドエラー表示コンポーネント
 * React Hook Formのエラーオブジェクトを受け取り、エラーメッセージを表示する
 */
export const FieldError = ({ error }: Props) => {
  if (!error) {
    return null;
  }

  return (
    <div role="alert" className={styles.fieldError}>
      <AlertCircle className={styles.fieldError_icon} />
      <span className={styles.fieldError_message}>{error.message}</span>
    </div>
  );
};

export type { Props as FieldErrorProps };
