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
    <p role="alert" className={styles.fieldError}>
      {error.message}
    </p>
  );
};

export type { Props as FieldErrorProps };
