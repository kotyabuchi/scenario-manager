'use client';

import { useCallback, useEffect, useRef, useState, useTransition } from 'react';
import {
  CheckCircleIcon,
  CheckIcon,
  CircleIcon,
  ClockIcon,
  LinkIcon,
  MagnifyingGlassIcon,
  UsersIcon,
  XIcon,
} from '@phosphor-icons/react/ssr';

import { searchScenariosForSessionAction } from '../../actions';
import { formatPlayerCount, formatPlaytime } from './formatters';
import * as styles from './styles';

import { Button } from '@/components/elements/button/button';
import { Input } from '@/components/elements/input';
import { Modal } from '@/components/elements/modal';
import { Select } from '@/components/elements/select';

import type { ScenarioSummary, SystemSummary } from '../../interface';
import type { ParticipantType } from '../ParticipantsSection/MemberListItem';

type ScenarioSearchModalProps = {
  open: boolean;
  onOpenChange: (details: { open: boolean }) => void;
  onSelect: (scenario: ScenarioSummary) => void;
  systems: SystemSummary[];
  invitedMembers: Array<{
    userId: string;
    participantType: ParticipantType;
  }>;
};

const DEBOUNCE_MS = 500;
const SCENARIO_ID_REGEX = /[0-9A-HJKMNP-TV-Z]{26}/i;
const SCENARIO_URL_REGEX = /\/scenarios\/([0-9A-HJKMNP-TV-Z]{26})/i;

const extractScenarioId = (input: string): string | null => {
  const trimmed = input.trim();
  if (!trimmed) return null;

  const urlMatch = trimmed.match(SCENARIO_URL_REGEX);
  if (urlMatch?.[1]) return urlMatch[1];

  const idMatch = trimmed.match(SCENARIO_ID_REGEX);
  return idMatch?.[0] ?? null;
};

export const ScenarioSearchModal = ({
  open,
  onOpenChange,
  onSelect,
  systems,
  invitedMembers,
}: ScenarioSearchModalProps) => {
  const [idOrUrl, setIdOrUrl] = useState('');
  const [query, setQuery] = useState('');
  const [systemId, setSystemId] = useState<string | null>(null);
  const [results, setResults] = useState<ScenarioSummary[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [smartFilters, setSmartFilters] = useState({
    unplayedByPlayers: true,
    canKeeper: true,
    ownedByMembers: true,
  });
  const [isPending, startTransition] = useTransition();
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const wasOpenRef = useRef(false);
  const invitedMembersRef = useRef(invitedMembers);
  invitedMembersRef.current = invitedMembers;

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  const doSearch = useCallback(
    (
      idInput: string,
      name: string,
      sysId: string | null,
      filters: {
        unplayedByPlayers: boolean;
        canKeeper: boolean;
        ownedByMembers: boolean;
      },
      allowEmpty = false,
      immediate = false,
    ) => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }

      const execute = () => {
        startTransition(async () => {
          const scenarioId = extractScenarioId(idInput);
          if (idInput.trim().length > 0 && !scenarioId) {
            setResults([]);
            setSelectedId(null);
            return;
          }
          if (!scenarioId && name.trim() === '' && !sysId && !allowEmpty) {
            setResults([]);
            setSelectedId(null);
            return;
          }

          const params = {
            ...(scenarioId ? { scenarioId } : {}),
            ...(!scenarioId && name ? { scenarioName: name } : {}),
            ...(!scenarioId && sysId ? { systemId: sysId } : {}),
            smartFilters: filters,
            invitedMembers: invitedMembersRef.current,
          };
          const result = await searchScenariosForSessionAction(params);
          if (result.success) {
            setResults(result.data);
            setSelectedId(null);
          }
        });
      };

      if (immediate) {
        execute();
      } else {
        timerRef.current = setTimeout(execute, DEBOUNCE_MS);
      }
    },
    [],
  );

  useEffect(() => {
    if (open && !wasOpenRef.current) {
      doSearch(idOrUrl, query, systemId, smartFilters, true, true);
    }
    wasOpenRef.current = open;
  }, [open, idOrUrl, query, systemId, smartFilters, doSearch]);

  const handleIdOrUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setIdOrUrl(value);
    doSearch(value, query, systemId, smartFilters);
  };

  const handleQueryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setQuery(value);
    doSearch(idOrUrl, value, systemId, smartFilters);
  };

  const handleSystemChange = (details: { value: string[] }) => {
    const newSystemId = details.value[0] ?? null;
    setSystemId(newSystemId);
    doSearch(idOrUrl, query, newSystemId, smartFilters);
  };

  const handleSmartFilterToggle = (
    key: 'unplayedByPlayers' | 'canKeeper' | 'ownedByMembers',
  ) => {
    const nextFilters = { ...smartFilters, [key]: !smartFilters[key] };
    setSmartFilters(nextFilters);
    doSearch(idOrUrl, query, systemId, nextFilters);
  };

  const handleConfirm = () => {
    const selected = results.find((s) => s.scenarioId === selectedId);
    if (selected) {
      onSelect(selected);
      handleClose();
    }
  };

  const handleClose = () => {
    setIdOrUrl('');
    setQuery('');
    setSystemId(null);
    setResults([]);
    setSelectedId(null);
    setSmartFilters({
      unplayedByPlayers: true,
      canKeeper: true,
      ownedByMembers: true,
    });
    onOpenChange({ open: false });
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (results.length === 0) return;

    const currentIndex = results.findIndex((s) => s.scenarioId === selectedId);

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      const nextIndex =
        currentIndex < results.length - 1 ? currentIndex + 1 : 0;
      const nextId = results[nextIndex]?.scenarioId ?? null;
      setSelectedId(nextId);
      if (nextId) {
        document
          .querySelector(`[data-scenario-id="${nextId}"]`)
          ?.scrollIntoView({ block: 'nearest' });
      }
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      const prevIndex =
        currentIndex > 0 ? currentIndex - 1 : results.length - 1;
      const prevId = results[prevIndex]?.scenarioId ?? null;
      setSelectedId(prevId);
      if (prevId) {
        document
          .querySelector(`[data-scenario-id="${prevId}"]`)
          ?.scrollIntoView({ block: 'nearest' });
      }
    } else if (e.key === 'Enter' && selectedId) {
      e.preventDefault();
      handleConfirm();
    }
  };

  const systemItems = [
    { label: 'すべてのシステム', value: '' },
    ...systems.map((s) => ({ label: s.name, value: s.systemId })),
  ];
  const isIdMode = idOrUrl.trim().length > 0;

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
      title="シナリオを選ぶ"
      size="lg"
      footer={footer}
    >
      <search onKeyDown={handleKeyDown} className={styles.modalBody}>
        <div className={styles.searchPanel}>
          <div className={styles.searchPanel_idRow}>
            <div className={styles.searchArea_idInput}>
              <Input
                id="scenario-id-or-url-input"
                value={idOrUrl}
                onChange={handleIdOrUrlChange}
                placeholder="シナリオIDまたは詳細URLで検索"
                aria-label="シナリオIDまたは詳細URLで検索"
                prefix={<LinkIcon size={16} aria-hidden="true" />}
                suffix={
                  <button
                    type="button"
                    className={styles.clearButton}
                    onClick={() => {
                      if (!isIdMode) return;
                      setIdOrUrl('');
                      doSearch('', query, systemId, smartFilters);
                    }}
                    aria-label="ID/URL入力をクリア"
                    aria-controls="scenario-id-or-url-input"
                    title="ID/URL入力をクリア"
                  >
                    <XIcon size={14} aria-hidden="true" />
                  </button>
                }
              />
            </div>
          </div>
          <div className={styles.searchArea}>
            <div className={styles.searchArea_input}>
              <Input
                id="scenario-search-input"
                value={query}
                onChange={handleQueryChange}
                placeholder="シナリオ名で検索"
                aria-label="シナリオ名で検索"
                disabled={isIdMode}
                prefix={<MagnifyingGlassIcon size={16} aria-hidden="true" />}
                suffix={
                  <button
                    type="button"
                    className={styles.clearButton}
                    onClick={() => {
                      if (isIdMode) return;
                      setQuery('');
                      doSearch(idOrUrl, '', systemId, smartFilters);
                    }}
                    aria-label="検索入力をクリア"
                    aria-controls="scenario-search-input"
                    title="検索入力をクリア"
                  >
                    <XIcon size={14} aria-hidden="true" />
                  </button>
                }
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
                disabled={isIdMode}
              />
            </div>
          </div>
          <div className={styles.filterRow}>
            <span className={styles.filterLabel}>スマートフィルタ:</span>
            <div className={styles.filterChips}>
              <button
                type="button"
                className={styles.filterChip({
                  selected: smartFilters.unplayedByPlayers,
                })}
                aria-pressed={smartFilters.unplayedByPlayers}
                onClick={() => handleSmartFilterToggle('unplayedByPlayers')}
              >
                <span aria-hidden="true" data-filter-check>
                  <CheckIcon size={14} aria-hidden="true" />
                </span>
                PLが未プレイ
              </button>
              <button
                type="button"
                className={styles.filterChip({
                  selected: smartFilters.canKeeper,
                })}
                aria-pressed={smartFilters.canKeeper}
                onClick={() => handleSmartFilterToggle('canKeeper')}
              >
                <span aria-hidden="true" data-filter-check>
                  <CheckIcon size={14} aria-hidden="true" />
                </span>
                GMが回せる
              </button>
              <button
                type="button"
                className={styles.filterChip({
                  selected: smartFilters.ownedByMembers,
                })}
                aria-pressed={smartFilters.ownedByMembers}
                onClick={() => handleSmartFilterToggle('ownedByMembers')}
              >
                <span aria-hidden="true" data-filter-check>
                  <CheckIcon size={14} aria-hidden="true" />
                </span>
                メンバーが保有
              </button>
            </div>
          </div>
        </div>

        <section aria-label="シナリオ検索結果" className={styles.scenarioList}>
          {results.length === 0 && !isPending && (
            <p className={styles.scenarioList_empty}>
              {idOrUrl.length > 0 || query.length > 0
                ? '該当するシナリオが見つかりません'
                : 'シナリオ名またはID/URLを入力して検索してください'}
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
              data-scenario-id={scenario.scenarioId}
              aria-pressed={selectedId === scenario.scenarioId}
              className={styles.scenarioList_item({
                selected: selectedId === scenario.scenarioId,
              })}
              onClick={() => setSelectedId(scenario.scenarioId)}
              onDoubleClick={() => {
                onSelect(scenario);
                handleClose();
              }}
            >
              <div className={styles.scenarioList_itemContent}>
                <div className={styles.scenarioList_itemHeader}>
                  <p className={styles.scenarioList_itemName}>
                    {scenario.name}
                  </p>
                  <span className={styles.scenarioList_itemSystem}>
                    {scenario.systemName}
                  </span>
                </div>
                <div className={styles.scenarioList_itemMeta}>
                  <span className={styles.scenarioList_itemMetaItem}>
                    <UsersIcon weight="fill" size={14} aria-hidden="true" />
                    {formatPlayerCount(scenario.minPlayer, scenario.maxPlayer)}
                  </span>
                  <span className={styles.scenarioList_itemMetaItem}>
                    <ClockIcon weight="fill" size={14} aria-hidden="true" />
                    {formatPlaytime(scenario.minPlaytime, scenario.maxPlaytime)}
                  </span>
                </div>
              </div>
              <div className={styles.scenarioList_itemActions}>
                {selectedId === scenario.scenarioId ? (
                  <CheckCircleIcon
                    size={24}
                    weight="fill"
                    aria-hidden="true"
                    className={styles.scenarioList_itemCheckIcon({
                      selected: true,
                    })}
                  />
                ) : (
                  <CircleIcon
                    size={24}
                    weight="light"
                    aria-hidden="true"
                    className={styles.scenarioList_itemCheckIcon({
                      selected: false,
                    })}
                  />
                )}
              </div>
            </button>
          ))}
        </section>
      </search>
    </Modal>
  );
};

export type { ScenarioSearchModalProps };
