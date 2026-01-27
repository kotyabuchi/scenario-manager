'use client';

import { useEffect, useRef, useState } from 'react';
import { Check, ChevronDown } from 'lucide-react';

import * as styles from './styles';

export type DropdownItem = {
  value: string;
  label: string;
  disabled?: boolean;
};

export type DropdownProps = {
  /**
   * メニューアイテムのリスト
   */
  items: DropdownItem[];

  /**
   * 選択中の値
   */
  value?: string;

  /**
   * 値が変更された時のコールバック
   */
  onValueChange?: (value: string) => void;

  /**
   * カスタムトリガー要素
   */
  trigger?: React.ReactNode;

  /**
   * メニューの表示位置
   * @default 'bottom-start'
   */
  placement?: 'bottom-start' | 'bottom-end' | 'top-start' | 'top-end';

  /**
   * 追加のクラス名
   */
  className?: string;
};

/**
 * ドロップダウンコンポーネント
 *
 * ソート順やフィルターなどの選択肢を表示する。
 *
 * @example
 * const [value, setValue] = useState('newest');
 *
 * <Dropdown
 *   items={[
 *     { value: 'newest', label: '新着順' },
 *     { value: 'rating', label: '高評価順' },
 *   ]}
 *   value={value}
 *   onValueChange={setValue}
 * />
 */
export const Dropdown = ({
  items,
  value,
  onValueChange,
  trigger,
  className,
}: DropdownProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const selectedItem = items.find((item) => item.value === value);

  // クリック外でメニューを閉じる
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const handleTriggerClick = () => {
    setIsOpen(!isOpen);
  };

  const handleTriggerKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      setIsOpen(!isOpen);
    } else if (event.key === 'Escape') {
      setIsOpen(false);
    }
  };

  const handleItemClick = (item: DropdownItem) => {
    if (!item.disabled) {
      onValueChange?.(item.value);
      setIsOpen(false);
    }
  };

  const handleItemKeyDown = (
    event: React.KeyboardEvent,
    item: DropdownItem,
  ) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      handleItemClick(item);
    }
  };

  return (
    <div
      ref={containerRef}
      className={`${styles.dropdownRoot} ${className ?? ''}`}
    >
      <button
        type="button"
        onClick={handleTriggerClick}
        onKeyDown={handleTriggerKeyDown}
        aria-expanded={isOpen}
        aria-haspopup="menu"
        className={styles.dropdownTrigger}
      >
        {trigger || selectedItem?.label || '選択してください'}
        <ChevronDown size={16} />
      </button>

      {isOpen && (
        <div role="menu" className={styles.dropdownMenu}>
          {items.map((item) => (
            <button
              key={item.value}
              type="button"
              role="menuitem"
              disabled={item.disabled}
              aria-checked={item.value === value}
              onClick={() => handleItemClick(item)}
              onKeyDown={(e) => handleItemKeyDown(e, item)}
              className={styles.dropdownItem({
                selected: item.value === value,
                disabled: item.disabled,
              })}
            >
              {item.label}
              {item.value === value && <Check size={14} />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};
