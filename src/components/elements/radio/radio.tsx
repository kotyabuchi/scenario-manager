'use client';

import { RadioGroup as ArkRadioGroup } from '@ark-ui/react/radio-group';

import * as styles from './styles';

export type RadioGroupProps = {
  /**
   * 選択中の値
   */
  value?: string;

  /**
   * 初期値
   */
  defaultValue?: string;

  /**
   * 値が変更された時のコールバック
   */
  onValueChange?: (details: { value: string | null }) => void;

  /**
   * 無効状態
   */
  disabled?: boolean;

  /**
   * フォーム送信時の名前
   */
  name?: string;

  /**
   * 子要素
   */
  children: React.ReactNode;

  /**
   * 追加のクラス名
   */
  className?: string;
};

export type RadioItemProps = {
  /**
   * 値
   */
  value: string;

  /**
   * 無効状態
   */
  disabled?: boolean;

  /**
   * ラベルテキスト
   */
  children?: React.ReactNode;

  /**
   * 追加のクラス名
   */
  className?: string;
};

/**
 * ラジオボタングループコンポーネント
 *
 * 排他的な選択肢から1つを選択する。
 *
 * @example
 * const [value, setValue] = useState('option1');
 *
 * <Radio value={value} onValueChange={(details) => setValue(details.value)}>
 *   <Radio.Item value="option1">オプション1</Radio.Item>
 *   <Radio.Item value="option2">オプション2</Radio.Item>
 * </Radio>
 */
const RadioGroup = ({
  value,
  defaultValue,
  onValueChange,
  disabled,
  name,
  children,
  className,
}: RadioGroupProps) => {
  return (
    <ArkRadioGroup.Root
      value={value}
      defaultValue={defaultValue}
      onValueChange={onValueChange}
      disabled={disabled}
      name={name}
      className={`${styles.radioGroupRoot} ${className ?? ''}`}
    >
      {children}
    </ArkRadioGroup.Root>
  );
};

/**
 * ラジオボタン項目コンポーネント
 */
const RadioItem = ({
  value,
  disabled,
  children,
  className,
}: RadioItemProps) => {
  return (
    <ArkRadioGroup.Item
      value={value}
      disabled={disabled}
      className={`${styles.radioItem} ${className ?? ''}`}
    >
      <ArkRadioGroup.ItemControl className={styles.radioControl}>
        <span className={styles.radioIndicator} />
      </ArkRadioGroup.ItemControl>
      <ArkRadioGroup.ItemText className={styles.radioText}>
        {children}
      </ArkRadioGroup.ItemText>
      <ArkRadioGroup.ItemHiddenInput />
    </ArkRadioGroup.Item>
  );
};

/**
 * Compound component
 */
export const Radio = Object.assign(RadioGroup, { Item: RadioItem });
