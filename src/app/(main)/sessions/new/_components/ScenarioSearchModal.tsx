'use client';

import { useCallback, useEffect, useRef, useState, useTransition } from 'react';
import { Clock, Users } from '@phosphor-icons/react/ssr';

import { searchScenariosForSessionAction } from '../actions';
import * as styles from './scenarioSearchStyles';

import { Button } from '@/components/elements/button/button';
import { Input } from '@/components/elements/input';
import { Modal } from '@/components/elements/modal';
import { Select } from '@/components/elements/select';

import type { SystemSummary } from '../actions';
import type { ScenarioSummary } from '../interface';

type ScenarioSearchModalProps = {
  open: boolean;
  onOpenChange: (details: { open: boolean }) => void;
  onSelect: (scenario: ScenarioSummary) => void;
  systems: SystemSummary[];
};

const DEBOUNCE_MS = 300;

/** プレイ人数のフォーマット */
const formatPlayerCount = (min: number | null, max: number | null): string => {
  if (min === null && max === null) return '−';
  if (min !== null && max !== null) {
    return min === max ? `${min}人` : `${min}〜${max}人`;
  }
  if (min !== null) return `${min}人〜`;
  return `〜${max}人`;
};

/** プレイ時間のフォーマット */
const formatPlaytime = (min: number | null, max: number | null): string => {
  if (min === null && max === null) return '−';
  if (min !== null && max !== null) {
    return min === max ? `${min}分` : `${min}〜${max}分`;
  }
  if (min !== null) return `${min}分〜`;
  return `〜${max}分`;
};

export const ScenarioSearchModal = ({
  open,
  onOpenChange,
  onSelect,
  systems,
}: ScenarioSearchModalProps) => {
  const [query, setQuery] = useState('');
  const [systemId, setSystemId] = useState<string | null>(null);
  const [results, setResults] = useState<ScenarioSummary[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  const doSearch = useCallback((name: string, sysId: string | null) => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }

    timerRef.current = setTimeout(() => {
      startTransition(async () => {
        const params = {
          ...(name ? { scenarioName: name } : {}),
          ...(sysId ? { systemId: sysId } : {}),
        };
        const result = await searchScenariosForSessionAction(params);
        if (result.success) {
          setResults(result.data);
        }
      });
    }, DEBOUNCE_MS);
  }, []);

  const handleQueryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setQuery(value);
    doSearch(value, systemId);
  };

  const handleSystemChange = (details: { value: string[] }) => {
    const newSystemId = details.value[0] ?? null;
    setSystemId(newSystemId);
    doSearch(query, newSystemId);
  };

  const handleConfirm = () => {
    const selected = results.find((s) => s.scenarioId === selectedId);
    if (selected) {
      onSelect(selected);
      handleClose();
    }
  };

  const handleClose = () => {
    setQuery('');
    setSystemId(null);
    setResults([]);
    setSelectedId(null);
    onOpenChange({ open: false });
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (results.length === 0) return;

    const currentIndex = results.findIndex((s) => s.scenarioId === selectedId);

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      const nextIndex =
        currentIndex < results.length - 1 ? currentIndex + 1 : 0;
      setSelectedId(results[nextIndex]?.scenarioId ?? null);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      const prevIndex =
        currentIndex > 0 ? currentIndex - 1 : results.length - 1;
      setSelectedId(results[prevIndex]?.scenarioId ?? null);
    } else if (e.key === 'Enter' && selectedId) {
      e.preventDefault();
      handleConfirm();
    }
  };

  const systemItems = [
    { label: 'すべてのシステム', value: '' },
    ...systems.map((s) => ({ label: s.name, value: s.systemId })),
  ];

  const footer = (
    <div className={styles.footer}>
      <Button type="button" variant="ghost" onClick={handleClose}>
        キャンセル
      </Button>
      <Button
        type="button"
        status="primary"
        disabled={!selectedId}
        onClick={handleConfirm}
      >
        選択
      </Button>
    </div>
  );

  return (
    <Modal
      open={open}
      onOpenChange={(details) => {
        if (!details.open) handleClose();
      }}
      title="シナリオを検索"
      footer={footer}
    >
      <search onKeyDown={handleKeyDown}>
        <div className={styles.searchArea}>
          <div className={styles.searchArea_input}>
            <Input
              value={query}
              onChange={handleQueryChange}
              placeholder="シナリオ名で検索"
              aria-label="シナリオ名で検索"
            />
          </div>
          <div className={styles.searchArea_select}>
            <Select
              items={systemItems}
              value={systemId ? [systemId] : []}
              onValueChange={handleSystemChange}
              placeholder="システム"
              aria-label="システムで絞り込み"
              variant="form"
            />
          </div>
        </div>

        <section aria-label="シナリオ検索結果" className={styles.scenarioList}>
          {results.length === 0 && !isPending && (
            <p className={styles.scenarioList_empty}>
              {query.length > 0
                ? '該当するシナリオが見つかりません'
                : 'シナリオ名を入力して検索してください'}
            </p>
          )}
          {isPending && results.length === 0 && (
            <output className={styles.scenarioList_empty} aria-live="polite">
              検索中...
            </output>
          )}
          {results.map((scenario) => (
            <button
              key={scenario.scenarioId}
              type="button"
              aria-pressed={selectedId === scenario.scenarioId}
              data-selected={selectedId === scenario.scenarioId}
              className={styles.scenarioList_item}
              onClick={() => setSelectedId(scenario.scenarioId)}
              onDoubleClick={() => {
                setSelectedId(scenario.scenarioId);
                handleConfirm();
              }}
            >
              <div className={styles.scenarioList_itemContent}>
                <span className={styles.scenarioList_itemSystem}>
                  {scenario.systemName}
                </span>
                <p className={styles.scenarioList_itemName}>{scenario.name}</p>
                <div className={styles.scenarioList_itemMeta}>
                  <span className={styles.scenarioList_itemMetaItem}>
                    <Users size={12} aria-hidden="true" />
                    {formatPlayerCount(scenario.minPlayer, scenario.maxPlayer)}
                  </span>
                  <span className={styles.scenarioList_itemMetaItem}>
                    <Clock size={12} aria-hidden="true" />
                    {formatPlaytime(scenario.minPlaytime, scenario.maxPlaytime)}
                  </span>
                </div>
              </div>
            </button>
          ))}
        </section>
      </search>
    </Modal>
  );
};

export type { ScenarioSearchModalProps };
