'use client';

import { Switch as ArkSwitch } from '@ark-ui/react/switch';

import * as styles from './styles';

export type SwitchProps = {
  /**
   * チェック状態
   */
  checked?: boolean;

  /**
   * 初期チェック状態
   */
  defaultChecked?: boolean;

  /**
   * チェック状態が変更された時のコールバック
   */
  onCheckedChange?: (details: { checked: boolean }) => void;

  /**
   * 無効状態
   */
  disabled?: boolean;

  /**
   * ラベルテキスト
   */
  children?: React.ReactNode;

  /**
   * フォーム送信時の名前
   */
  name?: string;

  /**
   * 追加のクラス名
   */
  className?: string;
};

/**
 * スイッチコンポーネント
 *
 * オン/オフの切り替えを行う。
 *
 * @example
 * const [checked, setChecked] = useState(false);
 *
 * <Switch
 *   checked={checked}
 *   onCheckedChange={(details) => setChecked(details.checked)}
 * >
 *   通知を有効にする
 * </Switch>
 */
export const Switch = ({
  checked,
  defaultChecked,
  onCheckedChange,
  disabled,
  children,
  name,
  className,
}: SwitchProps) => {
  return (
    <ArkSwitch.Root
      checked={checked}
      defaultChecked={defaultChecked}
      onCheckedChange={onCheckedChange}
      disabled={disabled}
      name={name}
      className={`${styles.switchRoot} ${className ?? ''}`}
    >
      <ArkSwitch.Control className={styles.switchControl}>
        <ArkSwitch.Thumb className={styles.switchThumb} />
      </ArkSwitch.Control>
      {children && (
        <ArkSwitch.Label className={styles.switchLabel}>
          {children}
        </ArkSwitch.Label>
      )}
      <ArkSwitch.HiddenInput />
    </ArkSwitch.Root>
  );
};
