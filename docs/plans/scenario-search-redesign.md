# シナリオ検索画面 PC/SPレイアウト リデザイン計画

## Context

シナリオ検索画面（`/scenarios`）の検索フォームを「メイン検索」と「詳細フィルター」に分離し、PCでは上部バー＋左サイドバー＋右結果の構成、SPではモーダルベースの検索UIに刷新する。現在のFilterChipBar（タブレット用、未完成）を廃止し、2段階レスポンシブ（SP/PC）に簡素化する。

フィルター適用タイミングを「即時適用」から「検索ボタン押下時にまとめて適用」に変更し、ユーザーが意図的に検索を実行する操作感を実現する。

併せて、プロジェクト全体のデザインツール参照を **Penpot → Pencil MCP** に統一する。

## 設計判断サマリ

| 判断項目 | 決定 | 理由 |
|---------|------|------|
| タブレット | SP方式に統合（< 1024px = SP） | FilterChipBar廃止、実装シンプル化 |
| フィルター適用 | ボタン押下時にまとめて適用 | ユーザー意図的な検索操作 |
| システム配置 | 上部バーのみ（サイドバーから除外） | 重複排除 |
| ソート配置 | 結果ヘッダーに維持、`useQueryState` でURL同期 | ブックマーク・共有URL対応 |
| サイドバー幅 | 展開280px / 折りたたみ48px | ユーザー要件 |
| パディング | サイドバー8px（SearchSidebar cvaで一元管理、FilterPanel sidebarのpadding除去で累積防止） / 結果16px | ユーザー要件 |
| デザインツール | Pencil MCPに統一（Penpot参照を全廃止） | ユーザー要件 |

## 新レイアウト概要

### PC（>= 1024px）
```
┌─────────────────────────────────────────────┐
│ GlobalHeader (64px)                         │
├─────────────────────────────────────────────┤
│ [システム選択▼] [シナリオ名検索...] [クリア] [検索] │ ← SearchTopBar (sticky)
├──────────┬──────────────────────────────────┤
│ 詳細      │  検索結果：XX件  並び替え：[▼]  │
│ フィルター │                                │
│ ────────  │  [Card] [Card] [Card]           │
│ タグ      │  [Card] [Card] [Card]           │
│ プレイ人数│                                │
│ プレイ時間│                                │
│ ────────  │                                │
│ [検索]    │                                │
│ [◀ 閉じる]│                                │
├──────────┴──────────────────────────────────┤
│ (padding: 8px)  (padding: 16px)             │
```

### SP（< 1024px）
```
┌──────────────────────────┐
│ GlobalHeader             │
├──────────────────────────┤
│ [シナリオ名検索...]      │ ← MobileSearchBar
│ [システム▼] [検索]       │
├──────────────────────────┤
│ [フィルター(2)]  XX件    │ ← mobileFilterRow
├──────────────────────────┤
│  [Card]                  │
│  [Card]                  │
│  [Card]                  │
└──────────────────────────┘

+ FilterBottomSheet（モーダル）
  ├ タグ
  ├ プレイ人数
  ├ プレイ時間
  └ [条件をリセット] [すべてクリアして検索] [この条件で検索]
```

### SP ドラフト操作フロー

```
MobileSearchBar（常時表示）          FilterBottomSheet（モーダル）
┌────────────────────────┐      ┌─────────────────────────────┐
│ キーワード入力 → draft.q │      │ タグ選択 → draft.tags        │
│ システム選択 → draft.sys │      │ 人数設定 → draft.playerRange │
│ [検索] → commit() ─────┼──┐   │ 時間設定 → draft.duration    │
└────────────────────────┘  │   │                             │
                            │   │ [条件をリセット] → clearAll() │
                            │   │  （ドラフトのみ、commitなし） │
                            │   │                             │
                            │   │ [すべてクリアして検索]        │
                            │   │  → clearAll() + commit()     │
                            │   │                             │
                            │   │ [この条件で検索]             │
                            │   │  → commit() + onClose() ────┼──┐
                            │   └─────────────────────────────┘  │
                            ↓                                    ↓
                     URL更新 → useEffect → API呼び出し → 結果表示
```

**ポイント**: MobileSearchBarで[検索]を押した後にFilterBottomSheetを開くと、
ドラフトは直前のcommit済み状態から開始される（useEffectでcommitted→draft同期のため）。
FilterBottomSheetの「条件をリセット」はドラフトのみリセットするため、モーダルを閉じれば
前回のcommit済み状態に戻る（意図しないクリアを防止）。ラベルを「クリア」ではなく
「条件をリセット」にすることで、検索結果には影響しないことをユーザーに示す。

---

## Phase 0: Penpot → Pencil 統一

> **実施方針**: Phase 0 は検索UIリデザイン（Phase 2-4）と論理的に独立しているため、**別コミット（または別PR）で先行実施**する。これにより、レビュー粒度の改善とロールバック容易性を確保する。

プロジェクト全体のデザインツール参照をPenpotからPencil MCPに統一する。

### Step 0.1 スキルの書き換え

Penpot MCP ツール（`mcp__penpot__*`）→ Pencil MCP ツール（`mcp__pencil__*`）に差し替え。

| ファイル | 操作 | 概要 |
|---------|------|------|
| `.claude/commands/penpot-design.md` | リネーム → `pencil-design.md` | allowed-tools をPencil MCPに変更、手順をPencil操作に全面書き換え |
| `.claude/commands/redesign.md` | 変更 | allowed-tools と本文のPenpot参照をPencilに変更 |
| `.claude/commands/component-spec.md` | 変更 | allowed-tools と本文のPenpot参照をPencilに変更 |

**allowed-tools 変更マッピング**:
```
mcp__penpot__execute_code      → mcp__pencil__batch_design, mcp__pencil__batch_get
mcp__penpot__high_level_overview → mcp__pencil__get_editor_state
mcp__penpot__export_shape      → mcp__pencil__get_screenshot
mcp__penpot__import_image      → mcp__pencil__batch_design (G操作)
mcp__penpot__penpot_api_info   → mcp__pencil__get_guidelines
```

### Step 0.2 ルール・ドキュメント更新

| ファイル | 変更内容 |
|---------|---------|
| `.claude/rules/tdd-workflow.md` | `/penpot-design` → `/pencil-design`、「Penpotクラウド」→「Pencil」に全置換 |
| `CLAUDE.md`（ルート） | Skills Reference の `/penpot-design` → `/pencil-design`、説明文のPenpot→Pencil |
| `.serena/memories/ui-design-system.md` | Penpot参照があれば Pencil に更新 |

### Step 0.3 不要ファイルの削除

| ファイル | 理由 |
|---------|------|
| `.serena/memories/penpot-mcp-guide.md` | Penpot固有ガイド |
| `.claude/plans/penpot-review-fixes.md` | 完了済み歴史的文書 |
| `.claude/plans/penpot-component-migration.md` | 〃 |
| `.claude/plans/penpot-design-migration.md` | 〃 |
| `.claude/reviews/penpot-component-migration-review-prompt.md` | 〃 |
| `.claude/reviews/penpot-mcp-guide-review-prompt.md` | 〃 |
| `.claude/reviews/penpot-mcp-guide-review-v2-prompt.md` | 〃 |
| `.claude/reviews/penpot-mcp-guide-review-v3-prompt.md` | 〃 |
| `.claude/reviews/penpot-mcp-guide-review-v4-prompt.md` | 〃 |
| `.claude/reviews/pencil-to-penpot-review-prompt.md` | 〃 |
| `.claude/reviews/pencil-to-penpot-migration-plan.md` | 〃 |
| `.claude/prompts/penpot-guide-review-handoff.md` | 〃 |
| `.claude/prompts/penpot-design-execution.md` | 〃 |
| `.claude/prompts/penpot-api-investigation.md` | 〃 |

### Step 0.4 MCP設定確認

`.mcp.json` にPenpot MCPサーバー設定が残っていれば削除。Pencil MCPサーバーの設定を確認。

---

## Phase 1: Pencilデザインv2 作成

**ツール**: Pencil MCP（`.pen`ファイル）

### 完了基準

| 基準 | 確認内容 |
|------|---------|
| 3フレーム完成 | PC展開・PC折りたたみ・SPの3フレームがPencilで作成済み |
| デザインレビュー承認 | ユーザーがスクリーンショットを確認し、承認を得る |
| トークン整合性 | 使用色・影・角丸がセマンティックトークンと一致 |
| レイアウト仕様明確化 | 各要素のサイズ・間隔がピクセル値で明示されている |

**フィードバックループ**: デザインが実装と乖離した場合、Phase 2 開始前にデザインを修正する。Phase 2 以降で発見されたデザイン課題は Phase 1 にフィードバックし、必要に応じてフレームを更新する。

### 作成するフレーム

1. **`Scenarios / PC検索v2 - サイドバー展開`** (1440px)
2. **`Scenarios / PC検索v2 - サイドバー折りたたみ`** (1440px)
3. **`Scenarios / SP検索v2`** (375px)

### デザイントークン参照
- 背景: `bg.page` (#F5F7FA) / `bg.card` (white)
- 影: `subHeader.default`（上部バー）/ `card.default`（サイドバー）
- プライマリ: `primary.500` (#10B981)
- 入力: `bg: gray.100`, border無し, borderRadius: md

---

## Phase 2: アーキテクチャ変更 — ドラフト状態の導入

### Step 2.0 パーサー定義の統一（SSOT原則）

**目的**: `filterParsers`（useFilterState.ts）と `searchParamsParsers`（searchParams.ts）のフィールド不一致を解消し、Single Source of Truth を確立する。

**現状の問題**:

| フィールド | filterParsers | searchParamsParsers | 不一致 |
|-----------|:---:|:---:|:---:|
| systems | ✅ | ✅ | - |
| tags | ✅ | ✅ | - |
| minPlayer | ✅ | ✅ | - |
| maxPlayer | ✅ | ✅ | - |
| duration | ✅ | ❌ | ⚠️ |
| minPlaytime | ❌ | ✅ | ⚠️ |
| maxPlaytime | ❌ | ✅ | ⚠️ |
| q | ✅ | ✅ | - |
| sort | ❌ | ✅ | ⚠️ |

**対応方針**: `searchParams.ts` を唯一のパーサー定義ファイルとし、`useFilterState.ts` はそこからインポートする。

**変更1**: `src/app/(main)/scenarios/searchParams.ts`

パーサーを2層に分離して定義する:
- `filterParsers`: フィルターUI用（Client Component で `useQueryStates` に使用）
- `searchParamsParsers`: Server Component 用（`searchParamsCache` に使用、`filterParsers` を含む全フィールド）

```typescript
import {
  createSearchParamsCache,
  parseAsArrayOf,
  parseAsInteger,
  parseAsString,
  parseAsStringLiteral,
} from 'nuqs/server'

import type { SortOption } from './interface'

const sortOptions = ['newest', 'rating', 'playtime_asc', 'playtime_desc'] as const

// フィルターUI用パーサー（Client Component で useQueryStates に使用）
export const filterParsers = {
  systems: parseAsArrayOf(parseAsString, ',').withDefault([]),
  tags: parseAsArrayOf(parseAsString, ',').withDefault([]),
  minPlayer: parseAsInteger,
  maxPlayer: parseAsInteger,
  duration: parseAsString, // '~1h' | '1~3h' | '3~6h' | '6h~'
  q: parseAsString.withDefault(''),
}

export type FilterParams = {
  systems: string[]
  tags: string[]
  minPlayer: number | null
  maxPlayer: number | null
  duration: string | null
  q: string
}

// Server Component 用パーサー（filterParsers + sort）
export const searchParamsParsers = {
  ...filterParsers,
  sort: parseAsStringLiteral(sortOptions).withDefault('newest'),
}

export const searchParamsCache = createSearchParamsCache(searchParamsParsers)
```

**注**: `minPlaytime` / `maxPlaytime` は `searchParamsParsers` から削除する。`duration`（文字列ラベル）→ 数値範囲への変換は `buildApiQueryString` 関数（ScenariosContent.tsx 内）の責務として維持する。これにより、URLパラメータとして公開するのは `duration` のみに統一され、変換ロジックがAPIレイヤーに閉じる。

**⚠ 既存コードとの不整合（実装時に修正必須）**: 現在の `ScenariosContent.tsx:73-78` の `durationMap` は `'1h'`, `'1-3h'`, `'3-6h'`, `'6h+'` をキーとしているが、`DURATION_OPTIONS`（`interface.ts:33-37`）の `value` は `'~1h'`, `'1~3h'`, `'3~6h'`, `'6h~'` である。FilterPanel は `DURATION_OPTIONS` の `value` をそのまま `setDuration()` に渡すため、`buildApiQueryString` 内の `durationMap` キーも `DURATION_OPTIONS` と一致させる必要がある。上記 `DURATION_MAP` 定義はこの修正を反映済みだが、実装時に既存の `durationMap` を確実に置き換えること。

**変更2**: `src/components/blocks/FilterPanel/useFilterState.ts`

独自の `filterParsers` / `FilterParams` 定義を削除し、`searchParams.ts` からインポートする:

```typescript
'use client'

import { useCallback, useMemo, useRef, useTransition } from 'react'
import { useQueryStates } from 'nuqs'

import { filterParsers, type FilterParams } from '@/app/(main)/scenarios/searchParams'

// 以降の実装は変更なし（filterParsers / FilterParams のインポート元のみ変更）
```

**変更3**: `src/app/(main)/scenarios/searchParams.ts` の `toSearchParams` 関数を更新

`minPlaytime` / `maxPlaytime` を `duration` に変更し、変換ロジックを組み込む:

```typescript
const DURATION_MAP: Record<string, { min: number; max: number }> = {
  '~1h': { min: 0, max: 60 },
  '1~3h': { min: 60, max: 180 },
  '3~6h': { min: 180, max: 360 },
  '6h~': { min: 360, max: 9999 },
}

export const toSearchParams = (parsed: {
  systems: string[]
  tags: string[]
  minPlayer: number | null
  maxPlayer: number | null
  duration: string | null
  q: string
  sort: SortOption
}) => {
  const params: {
    systemIds?: string[]
    tagIds?: string[]
    playerCount?: { min: number; max: number }
    playtime?: { min: number; max: number }
    scenarioName?: string
  } = {}

  if (parsed.systems.length > 0) {
    params.systemIds = parsed.systems
  }

  if (parsed.tags.length > 0) {
    params.tagIds = parsed.tags
  }

  if (isNotNil(parsed.minPlayer) || isNotNil(parsed.maxPlayer)) {
    params.playerCount = {
      min: parsed.minPlayer ?? 1,
      max: parsed.maxPlayer ?? 20,
    }
  }

  if (isNotNil(parsed.duration)) {
    const range = DURATION_MAP[parsed.duration]
    if (range) {
      params.playtime = range
    }
  }

  if (parsed.q !== '') {
    params.scenarioName = parsed.q
  }

  return params
}
```

### Step 2.1 `useFilterDraft` フック新規作成

**新規**: `src/components/blocks/FilterPanel/useFilterDraft.ts`

**データフロー**:
```
ドラフト状態 (useState)    →  検索ボタン  →  確定状態 (nuqs/URL)  →  useEffect  →  API
         ↑                                        ↑
    ユーザー操作                            ブラウザ戻る/進む
    (即座にUI反映)                          (ドラフトにも同期)
```

**実装コード**:

```typescript
'use client'

import { useCallback, useEffect, useMemo, useState, useTransition } from 'react'
import { useQueryStates } from 'nuqs'

import { filterParsers, type FilterParams } from '@/app/(main)/scenarios/searchParams'

const DEFAULT_FILTER: FilterParams = {
  systems: [],
  tags: [],
  minPlayer: null,
  maxPlayer: null,
  duration: null,
  q: '',
}

/**
 * ドラフト式フィルター状態管理フック
 * - ユーザー操作はドラフト（ローカル state）に即座に反映
 * - 「検索」ボタンで commit() → URL に一括反映 → API 呼び出しトリガー
 * - ブラウザ戻る/進むで URL が変わった場合、ドラフトも同期
 */
export const useFilterDraft = () => {
  const [isPending, startTransition] = useTransition()

  // 確定状態（URL と同期）
  const [committed, setCommitted] = useQueryStates(filterParsers, {
    history: 'push',
    scroll: false,
    shallow: false,
    startTransition,
  })

  // ドラフト状態（ローカルのみ）
  const [draft, setDraft] = useState<FilterParams>({
    systems: committed.systems,
    tags: committed.tags,
    minPlayer: committed.minPlayer,
    maxPlayer: committed.maxPlayer,
    duration: committed.duration,
    q: committed.q,
  })

  // URL 変更時にドラフトを同期（ブラウザ戻る/進む対応）
  // committed の配列参照はnuqsの内部実装に依存するため、JSON.stringify で安定化
  const committedKey = JSON.stringify(committed)
  useEffect(() => {
    setDraft({
      systems: committed.systems,
      tags: committed.tags,
      minPlayer: committed.minPlayer,
      maxPlayer: committed.maxPlayer,
      duration: committed.duration,
      q: committed.q,
    })
    // biome-ignore lint/correctness/useExhaustiveDependencies: committedKey でオブジェクト全体の変更を検知
  }, [committedKey])

  // --- ドラフト操作（ローカルのみ） ---

  const toggleSystem = useCallback((systemId: string) => {
    setDraft((prev) => ({
      ...prev,
      systems: prev.systems.includes(systemId)
        ? prev.systems.filter((s) => s !== systemId)
        : [...prev.systems, systemId],
    }))
  }, [])

  const setSystems = useCallback((newSystems: string[]) => {
    setDraft((prev) => ({ ...prev, systems: newSystems }))
  }, [])

  const toggleTag = useCallback((tagId: string) => {
    setDraft((prev) => ({
      ...prev,
      tags: prev.tags.includes(tagId)
        ? prev.tags.filter((t) => t !== tagId)
        : [...prev.tags, tagId],
    }))
  }, [])

  const setPlayerRange = useCallback((min: number, max: number) => {
    setDraft((prev) => ({ ...prev, minPlayer: min, maxPlayer: max }))
  }, [])

  const setDuration = useCallback((duration: string | null) => {
    setDraft((prev) => ({ ...prev, duration }))
  }, [])

  const setKeyword = useCallback((q: string) => {
    setDraft((prev) => ({ ...prev, q }))
  }, [])

  const clearAll = useCallback(() => {
    setDraft({ ...DEFAULT_FILTER })
  }, [])

  // --- 確定操作 ---

  const commit = useCallback(() => {
    setCommitted({
      systems: draft.systems,
      tags: draft.tags,
      minPlayer: draft.minPlayer,
      maxPlayer: draft.maxPlayer,
      duration: draft.duration,
      q: draft.q,
    })
  }, [draft, setCommitted])

  // --- 算出値 ---

  const activeFilterCount = useMemo(() => {
    let count = 0
    if (draft.systems.length > 0) count += draft.systems.length
    if (draft.tags.length > 0) count += draft.tags.length
    if (draft.minPlayer !== null || draft.maxPlayer !== null) count += 1
    if (draft.duration !== null) count += 1
    return count
  }, [draft])

  const isDirty = useMemo(() => {
    return (
      JSON.stringify([...draft.systems].sort()) !== JSON.stringify([...committed.systems].sort()) ||
      JSON.stringify([...draft.tags].sort()) !== JSON.stringify([...committed.tags].sort()) ||
      draft.minPlayer !== committed.minPlayer ||
      draft.maxPlayer !== committed.maxPlayer ||
      draft.duration !== committed.duration ||
      draft.q !== committed.q
    )
  }, [draft, committed])

  return {
    // FilterPanel 互換インターフェース
    mode: 'draft' as const,
    params: draft,
    isPending,
    activeFilterCount,
    toggleSystem,
    setSystems,
    toggleTag,
    setPlayerRange,
    setDuration,
    setKeyword,
    clearAll,
    // ドラフト固有
    draft,
    committed,
    commit,
    isDirty,
  }
}

export type UseFilterDraftReturn = ReturnType<typeof useFilterDraft>
```

**重要な設計ポイント**:
- `params` プロパティを `draft` のエイリアスとして公開 → FilterPanel が `filterState.params` でアクセスする既存コードと互換
- `committed` を API 呼び出しの useEffect 依存配列で監視
- `isDirty` は配列を `sort()` してから `JSON.stringify` で比較（URL直接編集やブラウザ履歴復元時の順序差異に対応）

### Step 2.2 FilterPanel index.ts に useFilterDraft をエクスポート追加

**変更**: `src/components/blocks/FilterPanel/index.ts`

```typescript
export { FilterPanel } from './FilterPanel'
export { FilterSection } from './FilterSection'
export { useFilterState } from './useFilterState'
export { useFilterDraft } from './useFilterDraft'

export type {
  FilterPanelProps,
  FilterPanelVariant,
  FilterStateBase,
  SystemItem,
  TagItem,
} from './interface'
export type { FilterParams, UseFilterStateReturn } from './useFilterState'
export type { UseFilterDraftReturn } from './useFilterDraft'
```

### Step 2.3 `useFilterState` に判別プロパティ追加

**変更**: `src/components/blocks/FilterPanel/useFilterState.ts`

既存の return オブジェクトに `mode: 'immediate' as const` を追加し、`useFilterDraft` の `mode: 'draft'` と判別可能にする:

```typescript
return {
  mode: 'immediate' as const,
  params,
  isPending,
  // ... 既存のプロパティ
}
```

### Step 2.4 共通インターフェース抽出 + FilterPanel の `showSystems` prop 追加

**変更**: `src/components/blocks/FilterPanel/interface.ts`

`useFilterState` と `useFilterDraft` の共通メソッドを型レベルで保証するため、共通インターフェースを抽出する。これにより FilterPanel 内部でユニオン型のメソッド差異を気にする必要がなくなる。

```typescript
import type { FilterParams } from '@/app/(main)/scenarios/searchParams'

/**
 * FilterPanel が依存する共通インターフェース
 * useFilterState / useFilterDraft の両方がこの型を満たす
 */
export type FilterStateBase = {
  mode: 'immediate' | 'draft'
  params: FilterParams
  isPending: boolean
  activeFilterCount: number
  toggleSystem: (systemId: string) => void
  toggleTag: (tagId: string) => void
  setPlayerRange: (min: number, max: number) => void
  setDuration: (duration: string | null) => void
  setKeyword: (q: string) => void
  clearAll: () => void
  /** ドラフトモード時のみ存在。検索ボタン押下でURLに一括反映 */
  commit?: () => void
}

export type FilterPanelProps = {
  variant?: FilterPanelVariant
  systems: SystemItem[]
  tags: TagItem[]
  filterState: FilterStateBase
  onClose?: () => void
  /** システム選択セクションの表示制御（デフォルト: true） */
  showSystems?: boolean
}
```

**変更**: `src/components/blocks/FilterPanel/FilterPanel.tsx`

Props に `showSystems = true` を追加し、`false` の場合はシステム選択セクションをスキップ:

```typescript
export const FilterPanel = ({
  variant = 'sidebar',
  systems,
  tags,
  filterState,
  showSystems = true,  // ← 追加
}: FilterPanelProps) => {
  // ... 既存ロジック

  return (
    <div className={styles.filterPanel({ variant })}>
      {/* システム選択 - showSystems が false なら非表示 */}
      {showSystems && (
        <FilterSection label="システム" ...>
          {/* 既存のシステムチップ */}
        </FilterSection>
      )}

      {/* タグ選択 - 変更なし */}
      <FilterSection label="タグ" ...>
        {/* 既存のタグチップ */}
      </FilterSection>

      {/* プレイ人数 - 変更なし */}
      {/* プレイ時間 - 変更なし */}
      {/* クリアボタン - variant が bottomsheet の場合は非表示（FilterBottomSheet の3ボタンフッターと重複するため） */}
      {variant !== 'bottomsheet' && (
        // 既存のクリアボタン
      )}
    </div>
  )
}
```

### Step 2.4 FilterPanel styles.ts — sidebar バリアントのレイアウト責務分離

**変更**: `src/components/blocks/FilterPanel/styles.ts`

現在の `sidebar` バリアント:
```typescript
sidebar: {
  width: '[280px]',
  height: '[fit-content]',
  maxHeight: '[calc(100vh - 140px)]',
  overflowY: 'auto',
  position: 'sticky',
  top: '[140px]',
  bg: 'white',
  borderRadius: '2xl',
  padding: '5',
  gap: '6',
  shadow: 'card.default',
},
```

変更後（レイアウト責務を SearchSidebar に委譲、padding は SearchSidebar 側で一元管理）:
```typescript
sidebar: {
  width: 'full',
  gap: '5',
  // padding は SearchSidebar の cva で管理（累積を防止）
},
```

`sidebar` CSS 定数も同様に更新:
```typescript
export const sidebar = css({
  display: 'flex',
  flexDirection: 'column',
  width: 'full',
  gap: '5',
  // padding は SearchSidebar の cva で管理（累積を防止）
})
```

---

## Phase 3: コンポーネント実装

### Step 3.1 セマンティックトークン追加

**変更**: `src/styles/semanticTokens.ts`

`colors` セクション（`card` の後に追加）:
```typescript
// ========================================
// サイドバー
// ========================================
sidebar: {
  bg: { value: '{colors.white}' },
  toggleBg: { value: '{colors.gray.100}' },
  toggleBgHover: { value: '{colors.gray.200}' },
  toggleIcon: { value: '{colors.gray.500}' },
},
```

`shadows` セクション: サイドバーには既存の `card.default` を再利用する（不透明度・サイズがほぼ同等のため、トークン増殖を回避）。

### Step 3.2 styles.ts 全面更新

**変更**: `src/app/(main)/scenarios/_components/styles.ts`

#### 削除するスタイル（旧SearchPanel + タブレット + 互換性残し）

以下をすべて削除:
- L282-346: `searchPanel`, `searchPanelMainRow`, `searchPanelSystemField`, `searchPanelNameField`, `searchPanelButtons`, `clearButton`
- L348-373: `seachConditions`, `searchPanelRow`, `searchPanelField`
- L375-387: `searchPanelLabel`, `searchPanelChips`
- L388-401: `sliderField`, `tagField`
- L403-408: `detailedConditionsRow`
- L410-446: `systemSelectContainer`, `systemTag`, `systemTagRemove`
- L448-471: `searchInput`
- L473-553: `expandButton`, `expandButtonRow`, `detailedConditions`, `searchDivider`, `searchActions`
- L560-570: `rangeInput`, `rangeInputField`
- L668-689: `filterChipBarWrapper`, `filterChipBarContent`
- L778-801: `searchArea`, `searchAreaContent`, `resultsArea`, `resultsAreaContent`
- L803-814: `pageHeader`, `pageTitle`
- L866-936: `sortSelect`, `sortSelectText`, `sortSelectIcon`, `sortTabs`, `sortTabButton`

#### 更新するスタイル

**`keywordSearchBar`** — `lg` 以上で非表示（SearchTopBarに置換）:
```typescript
export const keywordSearchBar = css({
  bg: 'white',
  py: '4',
  px: '6',
  shadow: 'subHeader.default',
  lg: {
    display: 'none',
  },
})
```

**`mobileFilterRow`** — ブレークポイントを `md` → `lg` に変更:
```typescript
export const mobileFilterRow = css({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: '3',
  py: '3',
  px: '6',
  bg: 'white',
  borderBottomWidth: '1px',
  borderBottomStyle: 'solid',
  borderBottomColor: 'gray.100',
  lg: {
    display: 'none',
  },
})
```

**`sidebar`** — cva に変更し、expanded/collapsed バリアント:
```typescript
export const sidebar = cva({
  base: {
    display: 'none',
    lg: {
      display: 'flex',
      flexDirection: 'column',
      flexShrink: '0',
      position: 'sticky',
      top: '[132px]', // GlobalHeader(64px) + SearchTopBar(68px)
      height: '[calc(100vh - 132px)]',
      overflowY: 'auto',
      bg: 'sidebar.bg',
      borderRadius: 'xl',
      shadow: 'card.default',
      transitionProperty: '[width, opacity]',
      transitionDuration: 'normal',
      transitionTimingFunction: 'ease-in-out',
      scrollbarWidth: '[none]',
      '&::-webkit-scrollbar': {
        display: 'none',
      },
    },
  },
  variants: {
    collapsed: {
      true: {
        lg: {
          width: '[48px]',
          overflow: 'hidden',
          padding: '1',
          alignItems: 'center',
        },
      },
      false: {
        lg: {
          width: '[280px]',
          padding: '2',
        },
      },
    },
  },
  defaultVariants: {
    collapsed: false,
  },
})
```

**`mainContent`** — transition 追加:
```typescript
export const mainContent = css({
  display: 'flex',
  flex: '1',
  maxW: '[1400px]',
  mx: 'auto',
  px: '6',
  py: '6',
  gap: '8',
  transitionProperty: 'all',
  transitionDuration: 'normal',
  transitionTimingFunction: 'ease-in-out',
})
```

#### 追加するスタイル

> **注**: 新規コンポーネント（SearchTopBar, SearchSidebar, MobileSearchBar）のスタイルは
> 当面 `_components/styles.ts` に集約するが、styles.ts の肥大化が顕著な場合は
> `SearchTopBar/styles.ts` 等の個別スタイルファイルへの分割を検討する。

**SearchTopBar**:
```typescript
// PC 上部検索バー（lg 以上のみ表示）
export const searchTopBar = css({
  display: 'none',
  lg: {
    display: 'flex',
    alignItems: 'center',
    gap: '4',
    bg: 'white',
    px: '8',
    py: '4',
    shadow: 'subHeader.default',
    position: 'sticky',
    top: '[64px]', // GlobalHeader の高さ
    zIndex: 'sticky',
  },
})

export const searchTopBar_systemSelect = css({
  width: '[280px]',
  flexShrink: '0',
})

export const searchTopBar_keywordInput = css({
  flex: '1',
  height: '[44px]',
  px: '4',
  border: 'none',
  borderRadius: 'md',
  bg: 'gray.100',
  color: 'gray.800',
  fontSize: 'sm',
  outline: 'none',
  transitionProperty: 'common',
  transitionDuration: 'fast',
  _hover: {
    bg: 'gray.200',
  },
  _focus: {
    bg: 'gray.100',
    outline: '[2px solid]',
    outlineColor: 'primary.500',
  },
  _placeholder: {
    color: 'gray.400',
  },
})

export const searchTopBar_actions = css({
  display: 'flex',
  alignItems: 'center',
  gap: '3',
  flexShrink: '0',
})
```

**SearchSidebar**:
```typescript
// サイドバー内のフィルターコンテンツ（折りたたみ時はフェードアウト）
export const sidebarContent = cva({
  base: {
    display: 'flex',
    flexDirection: 'column',
    flex: '1',
    overflow: 'hidden',
    transitionProperty: '[opacity, visibility]',
    transitionDuration: 'fast',
    transitionTimingFunction: 'ease-in-out',
  },
  variants: {
    visible: {
      true: {
        opacity: '1',
        visibility: 'visible',
      },
      false: {
        opacity: '0',
        visibility: 'hidden',
      },
    },
  },
  defaultVariants: {
    visible: true,
  },
})

// サイドバー内の検索ボタン
export const sidebarSearchButton = css({
  mt: '4',
  px: '4',
  pb: '2',
})

// トグルボタン
export const sidebarToggle = css({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: '2',
  width: 'full',
  py: '2',
  px: '2',
  borderRadius: 'md',
  bg: 'sidebar.toggleBg',
  color: 'sidebar.toggleIcon',
  cursor: 'pointer',
  fontSize: 'xs',
  fontWeight: 'medium',
  transitionProperty: 'common',
  transitionDuration: 'fast',
  _hover: {
    bg: 'sidebar.toggleBgHover',
  },
})

// 折りたたみ時のフィルターバッジ
export const sidebarCollapsedBadge = css({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  minW: '[20px]',
  h: '[20px]',
  px: '1.5',
  borderRadius: 'full',
  bg: 'primary.500',
  color: 'white',
  fontSize: 'xs',
  fontWeight: 'semibold',
})
```

**結果エリア**:
```typescript
// 結果コンテンツ（ローディングオーバーレイの基準位置）
export const resultsContent = css({
  flex: '1',
  position: 'relative',
  minW: '0',
})

// 検索結果ローディングオーバーレイ（isPending 時に表示）
export const resultsLoadingOverlay = css({
  position: 'absolute',
  inset: '0',
  bg: 'overlay.light',
  zIndex: 'overlay',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  borderRadius: 'xl',
})
```

**共通ユーティリティ**:
```typescript
// インラインスタイル禁止のため、width: 100% はクラスで定義
export const fullWidthButton = css({
  width: 'full',
})
```

**MobileSearchBar**:
```typescript
// SP 検索バー（lg 未満のみ表示）
export const mobileSearchBar = css({
  display: 'flex',
  flexDirection: 'column',
  gap: '3',
  bg: 'white',
  px: '6',
  py: '4',
  shadow: 'subHeader.default',
  lg: {
    display: 'none',
  },
})

export const mobileSearchBar_row = css({
  display: 'flex',
  alignItems: 'center',
  gap: '3',
})

export const mobileSearchBar_systemSelect = css({
  flex: '1',
  minW: '0',
})
```

### Step 3.3 SearchTopBar 実装

**新規**: `src/app/(main)/scenarios/_components/SearchTopBar.tsx`

```typescript
'use client'

import { Search, X } from 'lucide-react'

import * as styles from './styles'

import { Button } from '@/components/elements/button/button'
import {
  Select,
  type SelectItem,
  type SelectValueChangeDetails,
} from '@/components/elements/select/select'

import type { SystemItem } from '@/components/blocks/FilterPanel'
import type { UseFilterDraftReturn } from '@/components/blocks/FilterPanel/useFilterDraft'

type SearchTopBarProps = {
  systems: SystemItem[]
  draftState: UseFilterDraftReturn
}

export const SearchTopBar = ({ systems, draftState }: SearchTopBarProps) => {
  const { draft, isDirty, setSystems, setKeyword, clearAll, commit } =
    draftState

  // Select 用のアイテム変換
  const systemSelectItems: SelectItem[] = systems.map((s) => ({
    value: s.systemId,
    label: s.name,
  }))

  const handleSystemChange = (details: SelectValueChangeDetails<SelectItem>) => {
    setSystems(details.value)
  }

  const handleClear = () => {
    clearAll()
    commit()
  }

  const handleSearch = () => {
    commit()
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      commit()
    }
  }

  return (
    <div className={styles.searchTopBar}>
      <div className={styles.searchTopBar_systemSelect}>
        <Select
          items={systemSelectItems}
          value={draft.systems}
          onValueChange={handleSystemChange}
          placeholder="システムを選択"
          multiple
        />
      </div>

      <input
        type="text"
        placeholder="シナリオを検索..."
        aria-label="シナリオ名で検索"
        className={styles.searchTopBar_keywordInput}
        value={draft.q}
        onChange={(e) => setKeyword(e.target.value)}
        onKeyDown={handleKeyDown}
      />

      <div className={styles.searchTopBar_actions}>
        <Button
          type="button"
          variant="outline"
          status="primary"
          onClick={handleClear}
        >
          <X size={16} />
          クリア
        </Button>

        <Button
          type="button"
          status="primary"
          onClick={handleSearch}
        >
          <Search size={16} />
          検索
        </Button>
      </div>
    </div>
  )
}
```

### Step 3.4 SearchSidebar 実装

**新規**: `src/app/(main)/scenarios/_components/SearchSidebar.tsx`

```typescript
'use client'

import { useEffect, useRef } from 'react'
import { Filter, PanelLeftClose, PanelLeftOpen, Search } from 'lucide-react'

import * as styles from './styles'

import { FilterPanel } from '@/components/blocks/FilterPanel'
import { Button } from '@/components/elements/button/button'

import type { SystemItem, TagItem } from '@/components/blocks/FilterPanel'
import type { UseFilterDraftReturn } from '@/components/blocks/FilterPanel/useFilterDraft'

type SearchSidebarProps = {
  isCollapsed: boolean
  onToggleCollapse: () => void
  systems: SystemItem[]
  tags: TagItem[]
  draftState: UseFilterDraftReturn
}

export const SearchSidebar = ({
  isCollapsed,
  onToggleCollapse,
  systems,
  tags,
  draftState,
}: SearchSidebarProps) => {
  const { activeFilterCount, commit } = draftState
  const toggleRef = useRef<HTMLButtonElement>(null)

  // 折りたたみ時にトグルボタンにフォーカスを移動
  useEffect(() => {
    if (isCollapsed) {
      toggleRef.current?.focus()
    }
  }, [isCollapsed])

  const handleSearch = () => {
    commit()
  }

  return (
    <aside className={styles.sidebar({ collapsed: isCollapsed })}>
      {isCollapsed ? (
        <>
          {/* 折りたたみ時: トグルボタン + バッジ */}
          <button
            ref={toggleRef}
            type="button"
            onClick={onToggleCollapse}
            className={styles.sidebarToggle}
            aria-label="フィルターを展開"
            aria-expanded={false}
          >
            <PanelLeftOpen size={18} />
          </button>
          {activeFilterCount > 0 && (
            <span className={styles.sidebarCollapsedBadge}>
              {activeFilterCount}
            </span>
          )}
        </>
      ) : (
        <>
          {/* 展開時: FilterPanel + 検索ボタン + トグル */}
          <div className={styles.sidebarContent({ visible: !isCollapsed })}>
            <FilterPanel
              variant="sidebar"
              systems={systems}
              tags={tags}
              filterState={draftState}
              showSystems={false}
            />
          </div>

          <div className={styles.sidebarSearchButton}>
            <Button
              type="button"
              status="primary"
              onClick={handleSearch}
              className={styles.fullWidthButton}
            >
              <Search size={16} />
              検索
            </Button>
          </div>

          <button
            type="button"
            onClick={onToggleCollapse}
            className={styles.sidebarToggle}
            aria-label="フィルターを閉じる"
            aria-expanded={true}
          >
            <PanelLeftClose size={16} />
            閉じる
          </button>
        </>
      )}
    </aside>
  )
}
```

### Step 3.5 MobileSearchBar 実装

**新規**: `src/app/(main)/scenarios/_components/MobileSearchBar.tsx`

```typescript
'use client'

import { Search } from 'lucide-react'

import * as styles from './styles'

import { Button } from '@/components/elements/button/button'
import {
  Select,
  type SelectItem,
  type SelectValueChangeDetails,
} from '@/components/elements/select/select'

import type { SystemItem } from '@/components/blocks/FilterPanel'
import type { UseFilterDraftReturn } from '@/components/blocks/FilterPanel/useFilterDraft'

type MobileSearchBarProps = {
  systems: SystemItem[]
  draftState: UseFilterDraftReturn
}

export const MobileSearchBar = ({
  systems,
  draftState,
}: MobileSearchBarProps) => {
  const { draft, setSystems, setKeyword, commit } = draftState

  const systemSelectItems: SelectItem[] = systems.map((s) => ({
    value: s.systemId,
    label: s.name,
  }))

  const handleSystemChange = (details: SelectValueChangeDetails<SelectItem>) => {
    setSystems(details.value)
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') commit()
  }

  return (
    <div className={styles.mobileSearchBar}>
      <input
        type="text"
        placeholder="シナリオを検索..."
        aria-label="シナリオ名で検索"
        className={styles.keywordSearchInput}
        value={draft.q}
        onChange={(e) => setKeyword(e.target.value)}
        onKeyDown={handleKeyDown}
      />

      <div className={styles.mobileSearchBar_row}>
        <div className={styles.mobileSearchBar_systemSelect}>
          <Select
            items={systemSelectItems}
            value={draft.systems}
            onValueChange={handleSystemChange}
            placeholder="システム"
            multiple
          />
        </div>
        <Button type="button" status="primary" onClick={commit}>
          <Search size={16} />
          検索
        </Button>
      </div>
    </div>
  )
}
```

### Step 3.6 ScenariosContent リファクタリング

**変更**: `src/app/(main)/scenarios/_components/ScenariosContent.tsx`

**変更の要約**:

1. **import 変更**:
   - `useFilterState` → `useFilterDraft` に差し替え
   - `FilterChipBar` import を削除
   - `SearchTopBar`, `SearchSidebar`, `MobileSearchBar` を追加
   - `useQueryState` を `nuqs` から追加
   - `parseAsStringLiteral` を `nuqs` から追加

2. **state 変更**:
   - `const filterState = useFilterState()` → `const draftState = useFilterDraft()`
   - `const [sort, setSort] = useState<SortOption>('newest')` → `const [sort, setSort] = useQueryState('sort', parseAsStringLiteral(sortOptions).withDefault('newest'))` に変更（URLと同期）
   - `const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false)` 追加
   - `_activeDropdown`, `setActiveDropdown` 削除
   - `handleOpenDropdown` 削除

3. **useEffect 変更**:
   - 依存配列を `params.*` → `draftState.committed.*` に変更
   - `buildApiQueryString` に渡す値も `draftState.committed` を使用

4. **JSX 変更**:

```tsx
return (
  <>
    {/* PC: 上部検索バー（lg 以上） */}
    <SearchTopBar systems={systemItems} draftState={draftState} />

    {/* SP: 検索バー（lg 未満） */}
    <MobileSearchBar systems={systemItems} draftState={draftState} />

    {/* SP: フィルターボタン + 結果件数（lg 未満） */}
    <div className={styles.mobileFilterRow}>
      <button
        type="button"
        className={styles.mobileFilterButton}
        onClick={() => setIsBottomSheetOpen(true)}
      >
        <Filter size={16} />
        フィルター
        {draftState.activeFilterCount > 0 && (
          <span className={styles.mobileFilterBadge}>
            {draftState.activeFilterCount}
          </span>
        )}
      </button>
      <span className={styles.mobileResultCount}>
        {searchResult.totalCount}件
      </span>
    </div>

    {/* メインコンテンツエリア */}
    <div className={styles.mainContent}>
      {/* PC: サイドバー（lg 以上） */}
      <SearchSidebar
        isCollapsed={isSidebarCollapsed}
        onToggleCollapse={() => setIsSidebarCollapsed((p) => !p)}
        systems={systemItems}
        tags={tagItems}
        draftState={draftState}
      />

      {/* 結果コンテンツ（isPending 時はローディングオーバーレイ表示） */}
      <div className={styles.resultsContent} aria-busy={draftState.isPending}>
        {draftState.isPending && (
          <div
            className={styles.resultsLoadingOverlay}
            role="status"
            aria-label="検索中"
          />
        )}
        <div className={styles.resultHeader}>
          <div className={styles.resultCount}>
            検索結果：{searchResult.totalCount}件
          </div>
          <div className={styles.sortArea}>
            <span className={styles.sortLabel}>並び替え：</span>
            <div className={styles.sortSelectWrapper}>
              <Select
                items={sortOptions}
                value={[sort]}
                onValueChange={handleSortChange}
                variant="minimal"
              />
            </div>
          </div>
        </div>

        <ScenarioList
          scenarios={searchResult.scenarios}
          isLoading={draftState.isPending}
          onReset={() => { draftState.clearAll(); draftState.commit() }}
        />

        {hasMore && (
          <div className={styles.loadMoreContainer}>
            <Button
              variant="outline"
              status="primary"
              onClick={handleLoadMore}
              className={styles.loadMoreButton}
            >
              <ChevronDown size={18} className={styles.loadMoreIcon} />
              もっと見る
            </Button>
          </div>
        )}
      </div>
    </div>

    {/* SP: フィルターボトムシート */}
    <FilterBottomSheet
      isOpen={isBottomSheetOpen}
      onClose={() => setIsBottomSheetOpen(false)}
      systems={systemItems}
      tags={tagItems}
      filterState={draftState}
    />
  </>
)
```

5. **useEffect の依存配列**（`committedKey` パターンで統一 — `useFilterDraft` 内の URL→ドラフト同期と一貫させる）:
```typescript
// committed の配列参照はnuqsの内部実装に依存するため、JSON.stringify で安定化
const committedKey = JSON.stringify(draftState.committed)

useEffect(() => {
  const fetchResults = async () => {
    const queryString = buildApiQueryString({
      systems: draftState.committed.systems,
      tags: draftState.committed.tags,
      minPlayer: draftState.committed.minPlayer,
      maxPlayer: draftState.committed.maxPlayer,
      duration: draftState.committed.duration,
      q: draftState.committed.q,
      sort,
    })
    // ... fetch
  }
  fetchResults()
  // biome-ignore lint/correctness/useExhaustiveDependencies: committedKey でオブジェクト全体の変更を検知
}, [committedKey, sort])
```

6. **handleLoadMore も committed を使用**:
```typescript
const handleLoadMore = useCallback(async () => {
  const queryString = buildApiQueryString({
    systems: draftState.committed.systems,
    tags: draftState.committed.tags,
    minPlayer: draftState.committed.minPlayer,
    maxPlayer: draftState.committed.maxPlayer,
    duration: draftState.committed.duration,
    q: draftState.committed.q,
    sort,
  })
  // ... fetch
}, [draftState.committed, sort, offset])
```

7. **削除する要素**:
   - `keywordSearchBar` セクション（SearchTopBar/MobileSearchBarに置換）
   - `filterChipBarWrapper` セクション（タブレット廃止）
   - `sidebarPanel` ラッパー（SearchSidebar内部で管理）
   - `selectedSystems` 計算 + `mobileFilterChips`（SP簡素化）

### Step 3.7 FilterBottomSheet 調整

**変更**: `src/components/blocks/FilterBottomSheet/FilterBottomSheet.tsx`

1. **Props 型変更**（`FilterStateBase` 共通インターフェースを使用）:
```typescript
import type { FilterStateBase } from '@/components/blocks/FilterPanel/interface'

type FilterBottomSheetProps = {
  isOpen: boolean
  onClose: () => void
  systems: SystemItem[]
  tags: TagItem[]
  filterState: FilterStateBase
```

2. **FilterPanel に `showSystems={false}` 追加**:
```tsx
<FilterPanel
  variant="bottomsheet"
  systems={systems}
  tags={tags}
  filterState={filterState}
  showSystems={false}  // ← 追加
/>
```

3. **フッターの「適用する」→「この条件で検索」**:
```tsx
const handleApply = () => {
  filterState.commit?.()
  onClose()
}
```

```tsx
<Button type="button" status="primary" onClick={handleApply} className={styles.fullWidthButton}>
  <Check size={16} />
  この条件で検索
</Button>
```

4. **「条件をリセット」はドラフトのみクリア、「すべてクリアして検索」はクリア＋commit**:
```tsx
const handleClear = () => {
  clearAll()
  // commit() は呼ばない — ドラフトのみクリア
}

const handleClearAndSearch = () => {
  clearAll()
  filterState.commit?.()
  onClose()
}
```

5. **フッター3ボタンレイアウトのJSX**:
```tsx
{/* フッター */}
<div className={bottomSheetStyles.footer}>
  <div className={bottomSheetStyles.footerActions}>
    <Button
      type="button"
      variant="ghost"
      status="neutral"
      onClick={handleClear}
    >
      <RotateCcw size={16} />
      条件をリセット
    </Button>

    <Button
      type="button"
      variant="outline"
      status="neutral"
      onClick={handleClearAndSearch}
    >
      <Trash2 size={16} />
      すべてクリアして検索
    </Button>
  </div>

  <Button
    type="button"
    status="primary"
    onClick={handleApply}
    className={styles.fullWidthButton}
  >
    <Search size={16} />
    この条件で検索
  </Button>
</div>
```

**フッタースタイル追加**（`src/components/blocks/FilterBottomSheet/styles.ts` に追加）:
```typescript
// フッターコンテナ
export const footer = css({
  display: 'flex',
  flexDirection: 'column',
  gap: '3',
  pt: '4',
  borderTopWidth: '1px',
  borderTopStyle: 'solid',
  borderTopColor: 'gray.100',
})

// クリア系ボタンの横並び
export const footerActions = css({
  display: 'flex',
  gap: '2',
  justifyContent: 'space-between',
})
```

**ポイント**: フッターは2段構成。上段に「クリア」（ghost）と「すべてクリアして検索」（outline）を横並び、下段に「この条件で検索」（primary、全幅）を配置。これにより、主要アクション（検索実行）が最も目立ち、補助アクション（クリア系）はコンパクトにまとまる。

---

## Phase 4: クリーンアップ

### Step 4.1 不要ファイル削除

| ファイル | 理由 |
|---------|------|
| `src/app/(main)/scenarios/_components/SearchPanel.tsx` | 旧実装、未使用 |
| `src/components/blocks/FilterChipBar/` ディレクトリ全体 | タブレット廃止 |

### Step 4.2 不要 import の確認

- `ScenariosContent.tsx` から `FilterChipBar` の import が残っていないか確認
- `interface.ts` の `SearchPanelProps` 型は SearchPanel.tsx 削除後に不要 → 削除
- `interface.ts` の `FilterPanelVariant` 型から `'inline'` バリアントを削除（タブレット廃止により未使用）
- `FilterPanel/styles.ts` の `inline` バリアント定義も同時に削除

### Step 4.3 styles.ts のファイル分割

現在の `styles.ts` は約937行あり、旧スタイル削除後でも800行超が見込まれる。保守性向上のため、コンポーネント単位でスタイルファイルを分割する。

**分割方針**:
| 分割先ファイル | 移動するスタイル |
|---------------|----------------|
| `SearchTopBar/styles.ts` | `searchTopBar`, `searchTopBar_*` |
| `SearchSidebar/styles.ts` | `sidebar`, `sidebarContent`, `sidebarToggle`, `sidebarCollapsedBadge`, `sidebarSearchButton` |
| `MobileSearchBar/styles.ts` | `mobileSearchBar`, `mobileSearchBar_*` |
| `_components/styles.ts`（残留） | `mainContent`, `resultsContent`, `resultsLoadingOverlay`, `mobileFilterRow`, `mobileFilterButton`, `mobileFilterBadge`, 結果ヘッダー系、ページ共通スタイル |

**実施条件**: Phase 3 完了後、ビルド・テスト通過を確認してから分割を実施する。分割はリファクタリングのみで、機能変更を含まない。

---

## Phase 5: テスト・検証

### Step 5.1 ビルド検証

```bash
pnpm check   # lint + format（Biome）
pnpm build   # Next.js ビルドエラーなし確認
```

### Step 5.2 動作テスト（ブラウザで手動確認）

| テスト項目 | 確認内容 |
|-----------|---------|
| PC上部バー | システム選択→ドラフト反映→検索ボタンでURL更新 |
| PCサイドバー | タグ/人数/時間の変更→ドラフト反映→検索ボタンでURL更新 |
| サイドバー折りたたみ | アニメーション、結果エリア拡大 |
| SPモバイル | キーワード+システム→検索ボタンで確定 |
| SPモーダル | 詳細フィルター→「この条件で検索」で確定＆閉じる |
| ブラウザ戻る/進む | URLからドラフト同期 |
| クリア | 全フィルタークリア→検索実行 |
| isDirty表示 | ドラフト≠確定時の視覚的フィードバック |
| ソート | 結果ヘッダーで変更→即時反映（ソートはドラフト対象外） |
| Enter キー | 検索バーで Enter → commit |
| レスポンシブ切り替え | 1024px前後でPC/SPレイアウトが正しく切り替わること |
| isPendingフィードバック | 検索実行中にローディングオーバーレイが表示されること |

### Step 5.3 Storybook（任意）

- `SearchTopBar.stories.tsx` — システム選択、キーワード入力、isDirty状態
- `SearchSidebar.stories.tsx` — 展開/折りたたみの2状態

---

## ファイル変更一覧

### Phase 0（Penpot → Pencil 統一）

| ファイル | 操作 | 概要 |
|---------|------|------|
| `.claude/commands/penpot-design.md` | リネーム → `pencil-design.md` | Pencil MCP対応に全面書き換え |
| `.claude/commands/redesign.md` | 変更 | Penpot→Pencil参照更新 |
| `.claude/commands/component-spec.md` | 変更 | Penpot→Pencil参照更新 |
| `.claude/rules/tdd-workflow.md` | 変更 | Penpot→Pencil参照更新 |
| `CLAUDE.md`（ルート） | 変更 | スキル参照更新 |
| `.serena/memories/ui-design-system.md` | 変更 | Penpot→Pencil参照更新 |
| `.serena/memories/penpot-mcp-guide.md` | 削除 | Penpot固有ガイド |
| `.claude/plans/penpot-*.md` (3ファイル) | 削除 | 歴史的計画文書 |
| `.claude/reviews/penpot-*.md` (5ファイル) | 削除 | 歴史的レビュー文書 |
| `.claude/reviews/pencil-to-penpot-*.md` (2ファイル) | 削除 | 歴史的移行文書 |
| `.claude/prompts/penpot-*.md` (3ファイル) | 削除 | 歴史的プロンプト文書 |

### Phase 2-4（検索UI実装）

| ファイル | 操作 | 概要 |
|---------|------|------|
| `src/app/(main)/scenarios/searchParams.ts` | 変更 | パーサー統一（SSOT）: `filterParsers` / `FilterParams` を定義し `searchParamsParsers` に統合、`toSearchParams` を `duration` ベースに更新 |
| `src/components/blocks/FilterPanel/useFilterDraft.ts` | **新規** | ドラフト状態管理フック |
| `src/components/blocks/FilterPanel/useFilterState.ts` | 変更 | `mode: 'immediate'` 判別プロパティ追加、独自 `filterParsers` / `FilterParams` 定義を削除し `searchParams.ts` からインポート |
| `src/app/(main)/scenarios/_components/SearchTopBar.tsx` | **新規** | PC上部検索バー |
| `src/app/(main)/scenarios/_components/SearchSidebar.tsx` | **新規** | PC折りたたみサイドバー |
| `src/app/(main)/scenarios/_components/MobileSearchBar.tsx` | **新規** | SP検索バー |
| `src/app/(main)/scenarios/_components/ScenariosContent.tsx` | 変更 | ドラフト導入、コンポーネント分解 |
| `src/app/(main)/scenarios/_components/styles.ts` | 変更 | 旧スタイル削除、新スタイル追加 |
| `src/components/blocks/FilterPanel/FilterPanel.tsx` | 変更 | showSystems prop追加 |
| `src/components/blocks/FilterPanel/interface.ts` | 変更 | Props型更新 |
| `src/components/blocks/FilterPanel/index.ts` | 変更 | useFilterDraft エクスポート追加 |
| `src/components/blocks/FilterPanel/styles.ts` | 変更 | sidebarバリアントのレイアウト責務分離 |
| `src/components/blocks/FilterBottomSheet/FilterBottomSheet.tsx` | 変更 | ボタンテキスト変更、commit対応、showSystems追加、3ボタンフッターJSX |
| `src/components/blocks/FilterBottomSheet/styles.ts` | 変更 | フッター3ボタンレイアウト用スタイル追加 |
| `src/styles/semanticTokens.ts` | 変更 | sidebar用トークン追加 |
| `src/app/(main)/scenarios/interface.ts` | 変更 | SearchPanelProps削除 |
| `src/app/(main)/scenarios/_components/SearchPanel.tsx` | **削除** | 旧実装 |
| `src/components/blocks/FilterChipBar/` | **削除** | タブレット廃止 |

### 推定影響

- Phase 0: 変更6ファイル + リネーム1ファイル + 削除14ファイル
- Phase 2-4: **新規4ファイル** + 変更11ファイル + 削除2ファイル+ディレクトリ
- **合計**: 新規4 + 変更17 + リネーム1 + 削除16ファイル
