'use client';

import { useCallback, useEffect, useRef, useState, useTransition } from 'react';
import { AtIcon, SpinnerGapIcon } from '@phosphor-icons/react/ssr';

import { searchUsersAction } from '../../actions';
import * as styles from './styles';

import { Avatar } from '@/components/elements/avatar';
import { Input } from '@/components/elements/input';

import type { UserSummary } from '../../actions';

type MemberSearchInputProps = {
  /** ユーザー選択時のコールバック */
  onSelect: (user: UserSummary) => void;
  /** 除外するユーザーID（既に追加済み + 自分自身） */
  excludeUserIds: string[];
};

const DEBOUNCE_MS = 300;
const MIN_QUERY_LENGTH = 2;

export const MemberSearchInput = ({
  onSelect,
  excludeUserIds,
}: MemberSearchInputProps) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<UserSummary[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const [isPending, startTransition] = useTransition();
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleSearch = useCallback(
    (value: string) => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }

      if (value.length < MIN_QUERY_LENGTH) {
        setResults([]);
        setIsOpen(false);
        setActiveIndex(-1);
        return;
      }

      timerRef.current = setTimeout(() => {
        startTransition(async () => {
          const result = await searchUsersAction(value);
          if (result.success) {
            const filtered = result.data.filter(
              (u) => !excludeUserIds.includes(u.user_id),
            );
            setResults(filtered);
            setIsOpen(filtered.length > 0);
            setActiveIndex(-1);
          }
        });
      }, DEBOUNCE_MS);
    },
    [excludeUserIds],
  );

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setQuery(value);
    handleSearch(value);
  };

  const handleSelect = (user: UserSummary) => {
    onSelect(user);
    setQuery('');
    setResults([]);
    setIsOpen(false);
    setActiveIndex(-1);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (results.length === 0) return;

    switch (e.key) {
      case 'ArrowDown': {
        e.preventDefault();
        if (!isOpen) {
          setIsOpen(true);
        }
        setActiveIndex((prev) => (prev < results.length - 1 ? prev + 1 : 0));
        break;
      }
      case 'ArrowUp': {
        e.preventDefault();
        if (!isOpen) {
          setIsOpen(true);
        }
        setActiveIndex((prev) => (prev > 0 ? prev - 1 : results.length - 1));
        break;
      }
      case 'Enter': {
        if (isOpen && activeIndex >= 0 && results[activeIndex]) {
          e.preventDefault();
          handleSelect(results[activeIndex]);
        }
        break;
      }
      case 'Escape': {
        setIsOpen(false);
        setActiveIndex(-1);
        break;
      }
    }
  };

  useEffect(() => {
    if (!isOpen) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (!containerRef.current?.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  const activeUserId =
    activeIndex >= 0 ? results[activeIndex]?.user_id : undefined;

  return (
    <div ref={containerRef} className={styles.memberSearch}>
      <div className={styles.memberSearch_inputWrapper}>
        <Input
          value={query}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          placeholder="ユーザー名で検索"
          aria-label="メンバー検索"
          aria-expanded={isOpen}
          role="combobox"
          aria-controls="member-search-listbox"
          aria-autocomplete="list"
          aria-activedescendant={
            activeUserId ? `member-option-${activeUserId}` : undefined
          }
          autoComplete="off"
          prefix={
            <AtIcon
              className={styles.memberSearch_prefixIcon}
              size="16"
              aria-hidden="true"
            />
          }
          aria-busy={isPending}
          suffix={
            isPending && (
              <SpinnerGapIcon
                className={styles.memberSearch_loadingIcon}
                aria-hidden="true"
              />
            )
          }
        />
      </div>

      {isOpen && results.length > 0 && (
        <div
          id="member-search-listbox"
          role="listbox"
          className={styles.memberSearch_dropdown}
        >
          {results.map((user, index) => (
            <div
              key={user.user_id}
              id={`member-option-${user.user_id}`}
              role="option"
              tabIndex={-1}
              aria-selected={index === activeIndex}
              data-active={index === activeIndex ? 'true' : undefined}
              className={styles.memberSearch_item}
              onClick={() => handleSelect(user)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  handleSelect(user);
                }
              }}
            >
              <Avatar
                {...(user.image ? { src: user.image } : {})}
                alt={user.nickname}
                size="sm"
              />
              <div className={styles.memberSearch_itemText}>
                <span className={styles.memberSearch_nickname}>
                  {user.nickname}
                </span>
                <span className={styles.memberSearch_username}>
                  @{user.user_name}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
