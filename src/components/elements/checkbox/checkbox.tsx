import { Checkbox as ArkCheckbox } from '@ark-ui/react/checkbox';
import { Check } from '@phosphor-icons/react/ssr';

import * as styles from './styles';

type CheckedChangeDetails = {
  checked: boolean | 'indeterminate';
};

export type CheckboxProps = {
  /**
   * チェック状態（制御コンポーネント用）
   */
  checked?: boolean;

  /**
   * デフォルトチェック状態
   */
  defaultChecked?: boolean;

  /**
   * チェック状態変更時のコールバック
   */
  onCheckedChange?: (details: CheckedChangeDetails) => void;

  /**
   * 無効状態
   */
  disabled?: boolean;

  /**
   * ラベルテキスト
   */
  children?: React.ReactNode;

  /**
   * フォーム用name属性
   */
  name?: string;

  /**
   * フォーム用value属性
   */
  value?: string;

  /**
   * 追加のクラス名
   */
  className?: string;
};

/**
 * チェックボックスコンポーネント
 *
 * 複数選択可能なチェックボックス。
 * フィルター条件、同意確認、設定項目などで使用する。
 *
 * @example
 * // 基本的な使い方
 * <Checkbox
 *   checked={isAgreed}
 *   onCheckedChange={(details) => setIsAgreed(details.checked)}
 * >
 *   利用規約に同意する
 * </Checkbox>
 *
 * @example
 * // 非制御コンポーネント
 * <Checkbox defaultChecked>
 *   デフォルトでチェック済み
 * </Checkbox>
 */
export const Checkbox = ({
  checked,
  defaultChecked = false,
  onCheckedChange,
  disabled = false,
  children,
  name,
  value,
  className,
}: CheckboxProps) => {
  return (
    <ArkCheckbox.Root
      checked={checked}
      defaultChecked={defaultChecked}
      onCheckedChange={onCheckedChange}
      disabled={disabled}
      name={name}
      value={value}
      className={`${styles.checkboxRoot} ${className ?? ''}`}
    >
      <ArkCheckbox.Control
        className={styles.checkboxControl({
          checked: checked ?? defaultChecked,
          disabled,
        })}
      >
        <ArkCheckbox.Indicator>
          <Check size={14} color="#FFFFFF" />
        </ArkCheckbox.Indicator>
      </ArkCheckbox.Control>
      {children && (
        <ArkCheckbox.Label className={styles.checkboxLabel({ disabled })}>
          {children}
        </ArkCheckbox.Label>
      )}
      <ArkCheckbox.HiddenInput />
    </ArkCheckbox.Root>
  );
};
