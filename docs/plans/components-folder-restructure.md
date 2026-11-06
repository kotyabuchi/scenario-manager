# _components/ フォルダ構成の刷新

## Context

ページ固有コンポーネントの `_components/` ディレクトリが、フラットファイル + 共有 `styles.ts` の構成になっている。PandaCSS ではスタイルを別ファイルに分離するため、共有 `styles.ts` が肥大化（最大1056行）し、どのスタイルがどのコンポーネントに属するか判別困難になっている。

一方、共有コンポーネント（`elements/`, `blocks/`）は既にフォルダ・パー・コンポーネント構成で、各コンポーネントが専用の `styles.ts` を持つ。この成功パターンを `_components/` にも適用し、プロジェクト全体で構成を統一する。

**Before** (現状):
```
scenarios/[id]/_components/
├── ReviewSection.tsx
├── ScenarioHeader.tsx
├── ScenarioInfo.tsx
├── styles.ts              ← 864行、全コンポーネントのスタイル混在
└── index.ts
```

**After** (目標):
```
scenarios/[id]/_components/
├── ReviewSection/
│   ├── ReviewSection.tsx
│   ├── styles.ts           ← ReviewSection 専用
│   └── index.ts
├── ScenarioHeader/
│   ├── ScenarioHeader.tsx
│   ├── styles.ts
│   └── index.ts
├── _shared/
│   └── styles.ts           ← 複数コンポーネントが使う共通スタイル
└── index.ts                ← バレルエクスポート（パス更新）
```

## 決定事項

| 項目 | 方針 | 理由 |
|------|------|------|
| フォルダ命名 | PascalCase | `blocks/` と同じ複合コンポーネントの性質。`elements/` の kebab-case はArkUI慣習 |
| 共有ユーティリティの配置 | `_components/` ルートに維持 | `schema.ts`, `_mocks.ts`, `slotWarning.ts` は複数コンポーネントから参照される |
| 複数コンポーネントが使う共通スタイル | `_components/_shared/styles.ts` に分離 | `section_*`, `divider` 等の共通パーツ。重複は避ける。肥大化時は `_shared/` 内でカテゴリ別に分割可能 |
| page.tsx が使うスタイル | ページレベルの `styles.ts` に移動 | `pageContainer` 等はコンポーネントではなくページの責務 |
| スタイル名の簡略化 | フォルダスコープ内でプレフィックス削除 | `reviewCard_header` → `card_header`。`blocks/PageHeader` と同じ慣習 |
| styles.ts を持つ全ディレクトリ | 変更する | 単一コンポーネントでも styles.ts がある場合は統一性のためフォルダ化する |
| スタイルなしのディレクトリ | 変更しない | `src/app/_components/`, `profile/_components/` 等 |
| stories/test ファイル | コンポーネントフォルダ内に移動 | コロケーション原則に従う |

## 前提条件

- 各 Batch は独立した git commit として管理する。問題発生時は `git checkout -- .` でロールバック可能

---

## Batch 1: scenarios/[id]/_components/（5コンポーネント、864行）

最も価値が高く、境界が明確なターゲット。既にバレルエクスポート(`index.ts`)があるため、page.tsx の変更不要。

### Step 1-1. フォルダ作成とスタイル分割

5コンポーネントそれぞれにフォルダを作成し、共有 `styles.ts` からスタイルを分離する。

**スタイル所有権マッピング:**

| フォルダ | 抽出するスタイル | 推定行数 |
|---------|-----------------|---------|
| `ScenarioHeader/` | `subHeader_favBtn`, `subHeader_favIcon` → `favBtn`, `favIcon` | ~25 |
| `ScenarioInfo/` | `firstView*`, `scenarioInfo_*` → `firstView*`, `top`, `system`, `title` 等 | ~180 |
| `SessionSection/` | `sessionCard*`, `sessionList` → `card`, `card_date`, `list` 等 | ~45 |
| `VideoSection/` | `videoCard_*`, `video_*`, `videoGrid`, `spoilerToggle` → `card*`, `grid`, `spoilerToggle` | ~100 |
| `ReviewSection/` | `reviews*`, `reviewFilter*`, `reviewList`, `reviewCard_*`, `review_avatarImage`, `loadMore` → `header`, `filter*`, `card*`, `avatarImage`, `loadMore` | ~310 |
| `_shared/` | `section*`, `horizontalSection`, `horizontalScroll*`, `divider` | ~200 |

- 対象ファイル:
  - 新規: `_shared/styles.ts`, 各 `{Component}/styles.ts`, 各 `{Component}/index.ts`
  - 移動: 各 `.tsx` と `.stories.tsx` をフォルダ内へ
  - 更新: `_components/index.ts`（パス更新）
  - 削除: `_components/styles.ts`

### Step 1-2. コンポーネントファイルの import 更新

各コンポーネントの import を更新:
```typescript
// Before（共有 styles.ts から全スタイルを import）
import * as styles from './styles'
// styles.section, styles.reviewCard_header 等すべてここから

// After（自分専用スタイルのみ使うコンポーネント — パス変更なし）
import * as styles from './styles'

// After（共通スタイルも使うコンポーネント — _shared を追加 import）
import * as styles from './styles'
import * as shared from '../_shared/styles'
// styles.card_header（固有）, shared.section（共通）のように使い分け
```

### Step 1-3. バレルエクスポートとストーリーの更新

- `_components/index.ts`: フォルダからの再エクスポートに更新（export 文自体は同じ）
- stories: フォルダ内に移動し、相対 import パスを修正（`../interface` → `../../interface` 等）

### Step 1-4. 検証

```bash
pnpm check && pnpm vitest && pnpm build
```

---

## Batch 2: feedback/[id]/_components/（4コンポーネント）

小規模で境界明確。全コンポーネントに stories あり、検証容易。

### Step 2-1. フォルダ作成とスタイル分割

| フォルダ | 抽出するスタイル |
|---------|-----------------|
| `FeedbackDetailContent/` | `detailArticle*`, `detailHeader*`, `voteSection*`, `mergedInfo*` |
| `CommentSection/` | `commentSection*`, `commentForm*`, `commentCard*`, `commentList`, `emptyComments` |
| `AdminSection/` | `adminSection*` |
| `ActionSection/` | `actionSection`, `deleteConfirm_message` |
| `_shared/` | `divider` |

- 対象ファイル:
  - 新規: `_shared/styles.ts`, 各 `{Component}/styles.ts`, 各 `{Component}/index.ts`
  - 移動: 各 `.tsx` と `.stories.tsx` をフォルダ内へ
  - 削除: `_components/styles.ts`

### Step 2-2. import 更新と検証

- page.tsx: 現在 `'./_components/ActionSection'` 等で直接 import → フォルダの `index.ts` に解決されるため変更不要
- stories の相対パス修正

```bash
pnpm check && pnpm vitest && pnpm build
```

---

## Batch 3: feedback/_components/（5コンポーネント）

### Step 3-1. フォルダ作成とスタイル分割

| フォルダ | 抽出するスタイル |
|---------|-----------------|
| `FeedbackContent/` | `contentHeader`, `categoryChips`, `chipDivider`, `categoryChip`, `searchInputWrapper` 等 |
| `FeedbackList/` | `listContainer`, `listEmpty*` |
| `FeedbackCard/` | `card`, `card_*` |
| `VoteButton/` | `voteArea`, `voteButton*` |
| `NewFeedbackButton/` | スタイルなし（`index.ts` のみ） |

- 共有ファイル: `_mocks.ts` は `_components/` ルートに維持
- 削除: `_components/styles.ts`

### Step 3-2. import 更新と検証

- `_mocks.ts` の import パス: stories から `../_mocks` に変更
- page.tsx の import パス更新

```bash
pnpm check && pnpm vitest && pnpm build
```

---

## Batch 4: sessions/_components/（10コンポーネント、1056行）— 最複雑

page.tsx が `_components/styles` を直接 import している特殊ケース。ページレベルのスタイル分離が必要。

### Step 4-1. ページレベルスタイルの分離

`sessions/styles.ts`（新規）を作成し、page.tsx 専用のスタイルを移動:
- `pageContainer`, `pageLayout`, `tabBar`, `tabContainer`, `tabButton`

`sessions/page.tsx` の import を更新:
```typescript
// Before
import * as styles from './_components/styles'
// After
import * as styles from './styles'
```

### Step 4-2. 共通スタイルの整理

`_components/_shared/styles.ts` に複数タブが使う共通スタイルを配置:
- `resultHeader*`, `contentArea_*`, `moreButtonArea`, `emptyState_*`, `divider`
- フォーム入力共通: `selectInput`, `dateInput`, `textInput`, `chip`

### Step 4-3. 10コンポーネントのフォルダ化

| フォルダ | 固有スタイル | 備考 |
|---------|-------------|------|
| `SearchPanel/` | `searchPanel*` | |
| `FilterPanel/` | `filterPanel*` | |
| `SessionCard/` | `publicCard*`, `sessionCard_*` | `slotWarning` を `../slotWarning` から import |
| `CalendarView/` | `calendar*`, `calendar_sessionDots` | |
| `EmptyState/` | `emptyState_*` | 共通と固有の振り分けに注意 |
| `SessionList/` | `publicCardsGrid`, `mySessionListContainer` | |
| `UpcomingTab/` | `viewContainer*`, `listPanel`, `calendarPanel`, `viewToggle*` | |
| `HistoryTab/` | 固有スタイルなし | `_shared/styles` のみ使用 |
| `PublicTab/` | 固有スタイルなし | `_shared/styles` のみ使用 |
| `LoginPrompt/` | 固有スタイルなし | ページレベルの `loginPrompt*` を使用 |

- 共有ファイル: `schema.ts`, `slotWarning.ts` は `_components/` ルートに維持
- 削除: `_components/styles.ts`

### Step 4-4. import 更新と検証

```bash
pnpm check && pnpm vitest && pnpm build
```

---

## Batch 5: sessions/new/_components/（2コンポーネント、186行）

小規模で明確な境界。SessionForm と SessionFormContainer の2コンポーネント構成。テスト・ストーリーファイルも存在。

### Step 5-1. フォルダ作成とスタイル分割

| フォルダ | 抽出するスタイル |
|---------|-----------------|
| `SessionForm/` | フォーム関連スタイル（`form_*` 系） |
| `SessionFormContainer/` | コンテナスタイル（存在する場合） |

- 対象ファイル:
  - 新規: 各 `{Component}/styles.ts`, 各 `{Component}/index.ts`
  - 移動: `SessionForm.tsx`, `SessionFormContainer.tsx`, `SessionForm.stories.tsx`, `SessionForm.test.tsx` をフォルダ内へ
  - 削除: `_components/styles.ts`

### Step 5-2. 検証

```bash
pnpm check && pnpm vitest && pnpm build
```

---

## Batch 6: scenarios/_components/（4フラット + 3既存フォルダ）

既に `SearchSidebar/`, `MobileSearchBar/`, `SearchTopBar/` がフォルダ化済み。残り4つのフラットコンポーネントをフォルダ化。

### Step 6-1. ページレベルスタイルの分離

`scenarios/styles.ts`（新規）を作成し、page.tsx が使う `pageContainer` 等を移動。

`scenarios/page.tsx` の import を更新:
```typescript
// Before
import * as styles from './_components/styles'
// After
import * as styles from './styles'
```

### Step 6-2. 残り4コンポーネントのフォルダ化

| フォルダ | 抽出するスタイル |
|---------|-----------------|
| `ScenarioCard/` | `scenarioCard`, `cardThumbnail*`, `cardContent`, `cardTitle` 等 |
| `ScenarioCardSkeleton/` | スタイルなし（`index.ts` のみ） |
| `ScenarioList/` | `scenarioListContainer`, `scenarioListEmpty*` |
| `ScenariosContent/` | `mainContent`, `resultsContent`, `mobileFilter*`, `resultHeader` 等 |

### Step 6-3. 既存フォルダの共通スタイル参照更新

`SearchSidebar/SearchSidebar.tsx` が `../styles` から `fullWidthButton` を import している箇所を `../_shared/styles` に変更。

- 共有ファイル: `schema.ts` は `_components/` ルートに維持
- 削除: `_components/styles.ts`

### Step 6-4. 検証

```bash
pnpm check && pnpm vitest && pnpm build
```

---

## Batch 7: home/_components/（6コンポーネント、親 styles.ts から分離）— 高リスク

特殊ケース: コンポーネントが `../styles`（ページレベル）からスタイルを import している。ページレベル styles.ts のトリミングが他 Batch より複雑なため、問題が早期に検出されるよう注意して着手すること。

### Step 7-1. ページレベル styles.ts のトリミング

`home/styles.ts`（732行）からコンポーネント固有スタイルを抽出:

| フォルダ | 抽出するプレフィックス |
|---------|---------------------|
| `HeroSection/` | `hero_*` (~125行) |
| `UpcomingSessions/` | `sessions_*` (~180行) |
| `ActivityTimeline/` | `activity_*` (~100行) |
| `MiniCalendar/` | `calendar_*` (~90行) |
| `SystemNotice/` | `notice_*` (~30行) |
| `NewScenarios/` | `scenarioGrid` (~5行) |

`home/styles.ts` に残すもの:
- ページレイアウト: `pageContainer`, `pageGrid`, `mainColumn`, `sidebarColumn`
- サイドバー: `sidebarCard`, `sidebarDivider`
- ローディング: `loading_*`（`loading.tsx` が使用、27個。将来的に `loading-styles.ts` への分離を検討）

`_components/_shared/styles.ts` に移動:
- セクション共通: `sectionHeader`, `sectionTitle`, `sectionAccentBar`, `sectionLink`
- 空状態: `emptyState*`

### Step 7-2. コンポーネントフォルダ作成

6コンポーネントそれぞれにフォルダを作成。import を `../styles` から `./styles` + `../_shared/styles` に変更。

- 共有ファイル: `_mocks.ts`, `Dashboard.stories.tsx` は `_components/` ルートに維持
- `home/styles.ts` は削除せず、トリミングして維持

### Step 7-3. 検証

```bash
pnpm check && pnpm vitest && pnpm build
```

---

## Batch 8: scenarios/import/_components/（3コンポーネント）

### Step 8-1. フォルダ作成とスタイル分割

| フォルダ | 抽出するスタイル |
|---------|-----------------|
| `ImportPageContent/` | オーケストレーター（スタイル少） |
| `ImportScenarioForm/` | `form_*` |
| `UrlInputStep/` | `urlStep_*` |

- 共有ファイル: `schema.ts` は `_components/` ルートに維持
- 更新: `_components/index.ts`（パス更新）
- 削除: `_components/styles.ts`

### Step 8-2. 検証

```bash
pnpm check && pnpm vitest && pnpm build
```

---

## Batch 9: scenarios/new/_components/（1コンポーネント、284行）

単一コンポーネントだが、284行の styles.ts を持つため統一性のために対象に含める。

### Step 9-1. フォルダ作成とスタイル分割

| フォルダ | 抽出するスタイル |
|---------|-----------------|
| `ScenarioForm/` | `form_*` 系スタイル（全スタイル） |

- 対象ファイル:
  - 新規: `ScenarioForm/styles.ts`, `ScenarioForm/index.ts`
  - 移動: `ScenarioForm.tsx` をフォルダ内へ
  - 更新: `_components/index.ts`（パス更新）
  - 削除: `_components/styles.ts`
- 共有ファイル: `schema.ts` は `_components/` ルートに維持

### Step 9-2. 検証

```bash
pnpm check && pnpm vitest && pnpm build
```

---

## Batch 10: コーディング規約の更新

### Step 10-1. CLAUDE.md とルールファイルの更新

- `.claude/rules/coding-standards.md`: ディレクトリ構造セクションに `_components/` のフォルダ・パー・コンポーネント規約を追記
- `.claude/rules/styling-rules.md`: CSS関数命名規則にフォルダスコープ時のプレフィックス省略ルールを追記
- `.claude/rules/react-rules.md`: `_components/` のディレクトリ構造テンプレートを更新

### Step 10-2. 検証

```bash
pnpm check
```

---

## ファイル一覧

### 新規ファイル

| ファイル | 用途 |
|---------|------|
| 各 `_components/{Component}/index.ts` | バレルエクスポート（約35個） |
| 各 `_components/{Component}/styles.ts` | コンポーネント固有スタイル（約30個） |
| 各 `_components/_shared/styles.ts` | 共通スタイル（7ディレクトリ分） |
| `sessions/styles.ts` | ページレベルスタイル |
| `scenarios/styles.ts` | ページレベルスタイル |

### 変更ファイル

| ファイル | 変更内容 |
|---------|---------|
| 各コンポーネント `.tsx` | フォルダ内に移動、import パス更新 |
| 各 `.stories.tsx` | フォルダ内に移動、相対パス更新 |
| 各 `_components/index.ts` | フォルダからの再エクスポートにパス更新 |
| `sessions/page.tsx` | styles import を `./styles` に変更 |
| `scenarios/page.tsx` | styles import を `./styles` に変更 |
| `home/styles.ts` | コンポーネント固有スタイルを抽出してトリミング |
| `.claude/rules/coding-standards.md` | `_components/` 構成規約追記 |
| `.claude/rules/styling-rules.md` | 命名規則の補足追記 |
| `.claude/rules/react-rules.md` | ディレクトリ構造テンプレート更新 |

### 削除ファイル

| ファイル | 理由 |
|---------|------|
| `scenarios/[id]/_components/styles.ts` | コンポーネント別 + _shared に分割 |
| `feedback/[id]/_components/styles.ts` | 同上 |
| `feedback/_components/styles.ts` | 同上 |
| `sessions/_components/styles.ts` | ページレベル + コンポーネント別 + _shared に分割 |
| `scenarios/_components/styles.ts` | 同上 |
| `sessions/new/_components/styles.ts` | コンポーネント別に分割 |
| `scenarios/import/_components/styles.ts` | コンポーネント別に分割 |
| `scenarios/new/_components/styles.ts` | コンポーネント別に分割 |

## 検証方法

### 自動テスト

```bash
# 各 Batch 完了後に実行
pnpm check          # lint + format
pnpm build          # ビルド（import エラー検出）
pnpm vitest         # 全テスト実行
```

### 手動テスト

- [ ] 各ページがブラウザで正常に表示される
- [ ] Storybook で stories が正常にレンダリングされる
- [ ] スタイルの欠落・重複がないことを目視確認
- [ ] git diff で分割が正確に行われていることを確認
