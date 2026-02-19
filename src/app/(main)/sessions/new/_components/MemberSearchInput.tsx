'use client';

import { useCallback, useEffect, useRef, useState, useTransition } from 'react';
import { At, MagnifyingGlass } from '@phosphor-icons/react/ssr';

import { searchUsersAction } from '../actions';
import * as styles from './memberStyles';

import { Avatar } from '@/components/elements/avatar';
import { Input } from '@/components/elements/input';

import type { UserSummary } from '../actions';

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

  return (
    <div ref={containerRef} className={styles.memberSearch}>
      <div className={styles.memberSearch_inputWrapper}>
        <At className={styles.memberSearch_prefixIcon} aria-hidden="true" />
        <Input
          value={query}
          onChange={handleInputChange}
          placeholder="ユーザー名で検索"
          aria-label="メンバー検索"
          aria-expanded={isOpen}
          role="combobox"
          aria-controls="member-search-listbox"
          aria-autocomplete="list"
          autoComplete="off"
        />
        {isPending && (
          <MagnifyingGlass
            className={styles.memberSearch_loadingIcon}
            aria-hidden="true"
          />
        )}
      </div>

      {isOpen && results.length > 0 && (
        <div
          id="member-search-listbox"
          role="listbox"
          className={styles.memberSearch_dropdown}
        >
          {results.map((user) => (
            <button
              key={user.user_id}
              type="button"
              role="option"
              aria-selected={false}
              className={styles.memberSearch_item}
              onClick={() => handleSelect(user)}
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
            </button>
          ))}
        </div>
      )}
    </div>
  );
};
