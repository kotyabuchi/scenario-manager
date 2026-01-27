'use client';

import { Tabs as ArkTabs } from '@ark-ui/react/tabs';

import * as styles from './styles';

export type TabItem = {
  /**
   * タブの値（識別子）
   */
  value: string;

  /**
   * タブのラベル
   */
  label: string;

  /**
   * 無効状態
   */
  disabled?: boolean;

  /**
   * タブコンテンツ
   */
  content: React.ReactNode;
};

export type TabsProps = {
  /**
   * 選択中のタブ（制御モード）
   */
  value?: string;

  /**
   * 初期選択タブ（非制御モード）
   */
  defaultValue?: string;

  /**
   * タブ変更時のコールバック
   */
  onValueChange?: (details: { value: string }) => void;

  /**
   * バリアント
   * @default 'default'
   */
  variant?: 'default' | 'underline';

  /**
   * タブアイテムの配列
   */
  items: TabItem[];

  /**
   * 追加のクラス名
   */
  className?: string;
};

/**
 * タブコンポーネント
 *
 * コンテンツを切り替えて表示する。
 *
 * @example
 * <Tabs
 *   defaultValue="tab1"
 *   items={[
 *     { value: 'tab1', label: 'タブ1', content: <div>内容1</div> },
 *     { value: 'tab2', label: 'タブ2', content: <div>内容2</div> },
 *   ]}
 * />
 */
export const Tabs = ({
  value,
  defaultValue,
  onValueChange,
  variant = 'default',
  items,
  className,
}: TabsProps) => {
  return (
    <ArkTabs.Root
      value={value}
      defaultValue={defaultValue}
      onValueChange={onValueChange}
      className={`${styles.tabsRoot} ${className ?? ''}`}
      data-variant={variant}
    >
      <ArkTabs.List className={styles.tabsList({ variant })}>
        {items.map((item) => (
          <ArkTabs.Trigger
            key={item.value}
            value={item.value}
            disabled={item.disabled}
            className={styles.tabsTrigger({ variant })}
          >
            {item.label}
            {variant === 'underline' && (
              <span
                className={styles.tabsIndicator}
                data-selected={false}
                style={{
                  background: 'transparent',
                }}
              />
            )}
          </ArkTabs.Trigger>
        ))}
      </ArkTabs.List>
      {items.map((item) => (
        <ArkTabs.Content
          key={item.value}
          value={item.value}
          className={styles.tabsContent}
        >
          {item.content}
        </ArkTabs.Content>
      ))}
    </ArkTabs.Root>
  );
};
