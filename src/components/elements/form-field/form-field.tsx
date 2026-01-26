import { isNil } from 'ramda';

import { FieldError } from '../field-error/field-error';
import * as styles from './styles';

import type { ReactNode } from 'react';

type FormFieldProps = {
  /** ラベルテキスト */
  label: string;
  /** 入力要素のID（指定時はlabel要素を使用、未指定時はfieldset/legendを使用） */
  id?: string;
  /** 必須マーク表示 */
  required?: boolean;
  /** エラーオブジェクト（React Hook Form互換） */
  error?: { message?: string } | undefined;
  /** ヒントテキスト */
  hint?: string;
  /** 入力要素 */
  children: ReactNode;
};

/**
 * フォームフィールドの共通ラッパーコンポーネント
 *
 * - idあり: <div> + <label> で単一入力フィールドをラップ
 * - idなし: <fieldset> + <legend> で複数入力グループをラップ
 *
 * @example
 * // 単一入力（テキストフィールド等）
 * <FormField id="name" label="名前" required error={errors.name}>
 *   <Input id="name" {...register('name')} />
 * </FormField>
 *
 * @example
 * // グループ入力（ラジオボタン、チップ選択等）
 * <FormField label="システム" required error={errors.system}>
 *   <ChipGroup>...</ChipGroup>
 * </FormField>
 */
export const FormField = ({
  label,
  id,
  required = false,
  error,
  hint,
  children,
}: FormFieldProps) => {
  // idが指定されている場合はlabel要素を使用
  if (!isNil(id)) {
    return (
      <div className={styles.formField_container}>
        <label htmlFor={id} className={styles.formField_label}>
          {label}
          {required && <span className={styles.formField_required}>*</span>}
        </label>
        {children}
        {!isNil(hint) && <p className={styles.formField_hint}>{hint}</p>}
        <FieldError error={error} />
      </div>
    );
  }

  // idがない場合はfieldset/legendを使用（複数入力グループ用）
  return (
    <fieldset className={styles.formField_fieldset}>
      <legend className={styles.formField_label}>
        {label}
        {required && <span className={styles.formField_required}>*</span>}
      </legend>
      {children}
      {!isNil(hint) && <p className={styles.formField_hint}>{hint}</p>}
      <FieldError error={error} />
    </fieldset>
  );
};

export type { FormFieldProps };
