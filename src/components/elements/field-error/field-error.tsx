import * as styles from './styles';

type Props = {
  error:
    | {
        message?: string;
      }
    | undefined;
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
      <span className={styles.fieldError_message}>{error.message}</span>
    </div>
  );
};

export type { Props as FieldErrorProps };
