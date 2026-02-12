'use client';

import { useState } from 'react';
import { X } from '@phosphor-icons/react/ssr';

import * as styles from './styles';

export type TagsInputProps = {
  /**
   * 選択中のタグ（制御モード）
   */
  value?: string[];

  /**
   * 初期タグ（非制御モード）
   */
  defaultValue?: string[];

  /**
   * タグ変更時のコールバック
   */
  onValueChange?: (details: { value: string[] }) => void;

  /**
   * ラベル
   */
  label?: string;

  /**
   * プレースホルダー
   * @default 'タグを追加...'
   */
  placeholder?: string;

  /**
   * 必須フィールドかどうか
   * @default false
   */
  required?: boolean;

  /**
   * 無効状態
   * @default false
   */
  disabled?: boolean;

  /**
   * エラーメッセージ
   */
  error?: string;

  /**
   * サジェストリスト
   */
  suggestions?: string[];

  /**
   * 最大タグ数
   */
  maxTags?: number;

  /**
   * カスタムタグを許可するか
   * @default true
   */
  allowCustom?: boolean;

  /**
   * 追加のクラス名
   */
  className?: string;
};

/**
 * タグ入力コンポーネント
 *
 * 複数のタグを入力・管理する。
 *
 * @example
 * const [tags, setTags] = useState<string[]>([]);
 *
 * <TagsInput
 *   label="Tags"
 *   value={tags}
 *   onValueChange={(details) => setTags(details.value)}
 *   suggestions={['ホラー', '探索', '謎解き']}
 * />
 */
export const TagsInput = ({
  value,
  defaultValue = [],
  onValueChange,
  label,
  placeholder = 'タグを追加...',
  required = false,
  disabled = false,
  error,
  suggestions = [],
  maxTags,
  allowCustom = true,
  className,
}: TagsInputProps) => {
  const [internalValue, setInternalValue] = useState<string[]>(defaultValue);
  const [inputValue, setInputValue] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);

  const tags = value ?? internalValue;

  const handleAddTag = (tag: string) => {
    if (!tag.trim()) return;
    if (maxTags && tags.length >= maxTags) return;
    if (tags.includes(tag)) return;

    const newTags = [...tags, tag];
    setInternalValue(newTags);
    onValueChange?.({ value: newTags });
    setInputValue('');
    setShowSuggestions(false);
  };

  const handleRemoveTag = (tagToRemove: string) => {
    if (disabled) return;
    const newTags = tags.filter((tag) => tag !== tagToRemove);
    setInternalValue(newTags);
    onValueChange?.({ value: newTags });
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (allowCustom) {
        handleAddTag(inputValue);
      }
    } else if (e.key === 'Backspace' && inputValue === '' && tags.length > 0) {
      const lastTag = tags[tags.length - 1];
      if (lastTag) handleRemoveTag(lastTag);
    } else if (e.key === 'Escape') {
      setShowSuggestions(false);
    }
  };

  const filteredSuggestions = suggestions.filter(
    (s) =>
      s.toLowerCase().includes(inputValue.toLowerCase()) && !tags.includes(s),
  );

  const getListStyle = () => {
    if (disabled) return styles.tagsInputListDisabled;
    if (error) return styles.tagsInputListError;
    return styles.tagsInputList;
  };

  return (
    <div
      className={`${styles.tagsInputContainer} ${disabled ? styles.tagsInputContainerDisabled : ''} ${className ?? ''}`}
      data-disabled={disabled ? '' : undefined}
    >
      {label && (
        <span className={styles.tagsInputLabel}>
          {label}
          {required && (
            <span className={styles.tagsInputRequired} aria-hidden="true">
              *
            </span>
          )}
        </span>
      )}
      <div
        className={getListStyle()}
        role="listbox"
        aria-expanded={showSuggestions}
      >
        {tags.map((tag) => (
          /* biome-ignore lint/a11y/useFocusableInteractive: 選択済みタグの表示用optionロール */
          <span
            key={tag}
            role="option"
            aria-selected="true"
            className={styles.tagsInputItem}
          >
            {tag}
            {!disabled && (
              <button
                type="button"
                onClick={() => handleRemoveTag(tag)}
                className={styles.tagsInputRemoveButton}
                aria-label={`${tag}を削除`}
              >
                <X size={12} />
              </button>
            )}
          </span>
        ))}
        <input
          type="text"
          value={inputValue}
          onChange={(e) => {
            setInputValue(e.target.value);
            setShowSuggestions(
              e.target.value.length > 0 && suggestions.length > 0,
            );
          }}
          onKeyDown={handleKeyDown}
          onFocus={() =>
            setShowSuggestions(inputValue.length > 0 && suggestions.length > 0)
          }
          onBlur={() => setTimeout(() => setShowSuggestions(false), 150)}
          placeholder={tags.length === 0 ? placeholder : ''}
          disabled={
            disabled || (maxTags !== undefined && tags.length >= maxTags)
          }
          className={styles.tagsInputField}
        />
        {showSuggestions && filteredSuggestions.length > 0 && (
          <div className={styles.tagsInputSuggestions}>
            {filteredSuggestions.slice(0, 5).map((suggestion) => (
              <button
                key={suggestion}
                type="button"
                onClick={() => handleAddTag(suggestion)}
                className={styles.tagsInputSuggestionItem}
              >
                {suggestion}
              </button>
            ))}
          </div>
        )}
      </div>
      {error && <span className={styles.tagsInputError}>{error}</span>}
    </div>
  );
};
