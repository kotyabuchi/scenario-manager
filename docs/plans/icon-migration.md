# アイコンライブラリ統一: lucide-react + react-icons → @phosphor-icons/react

## Context

プロジェクトで `lucide-react`（60ファイル）と `react-icons/io5`（1ファイル）の2つのアイコンライブラリが混在している。Fill アイコンにも対応し、一貫した weight バリアント（regular/fill/bold 等）を持つ `@phosphor-icons/react` に統一する。

## 決定事項

| 項目 | 方針 | 理由 |
|------|------|------|
| ライブラリ | `@phosphor-icons/react` | Fill 対応、6種 weight バリアント、tree-shaking 対応 |
| size デフォルト差異 | 下記「size デフォルト差異の対処方針」参照 | Phosphor デフォルト `"1em"` vs lucide `24px` |
| fill/stroke 変換 | `fill="currentColor"` → `weight="fill"`、`fill="none"` → `weight="regular"` | Phosphor の weight API が同等表現を提供 |
| strokeWidth | 削除。`strokeWidth={3}` → `weight="bold"` | Phosphor に strokeWidth prop なし |
| IconType (react-icons) | `Icon` (from `@phosphor-icons/react`) に変更 | 型の互換性確保 |
| PanelLeftClose/Open 統合 | 同一の SidebarSimple アイコンを使用（CSS 反転なし） | 開閉状態は aria-label とテキスト「閉じる」で伝達済み。視覚的区別は不要 |
| コミット粒度 | Batch 単位でコミット | Step 単位だとコミット数が多すぎる。Batch 単位なら bisect にも十分な粒度 |

## size デフォルト差異の対処方針

lucide-react はデフォルト `24px`（固定）、Phosphor は `"1em"`（親の font-size に追従）。以下の3パターンで対処する。

**1. `size={}` prop 明示済み（大多数）** — 変更不要。そのまま移行。

**2. CSS `w`/`h` でサイズ制御** — `size` prop 不要。CSS が SVG サイズを上書き。
| ファイル | CSS プロパティ |
|---------|--------------|
| `ScenarioCard.tsx` | `w: '8', h: '8'`（ImageOff）、`w: '4', h: '4'`（Star）、`w: '3.5', h: '3.5'`（Users, Clock） |
| `ScenarioList.tsx` | `w: '9', h: '9'`（SearchX） |
| `spinner.tsx` | PandaCSS recipe でサイズ制御 |

**3. CSS `fontSize` でサイズ制御（挙動変化あり）** — lucide は `fontSize` を無視して固定 24px だが、Phosphor は `"1em"` で font-size に追従し表示サイズが変わる（24px → 約30px、`fontSize: '3xl'` = 1.875rem に追従、約25%拡大）。空状態の装飾アイコンなので `fontSize` 追従が望ましい。各 Step で `size={24}` は付与しない。Storybook で適切なサイズ感を視覚確認する。
| ファイル | CSS プロパティ |
|---------|--------------|
| `NewScenarios.tsx` | `fontSize: '3xl'`（BookOpen） |
| `UpcomingSessions.tsx` | `fontSize: '3xl'`（Calendar） |
| `EmptyState.tsx`（sessions） | `fontSize: '3xl'`（CalendarX, History, SearchX） |

**4. `size={}` 未指定かつ CSS 制御なし** — `size={24}` を明示追加。
| ファイル | アイコン |
|---------|---------|
| `icon-button.stories.tsx` | `<Heart />` |

## 前提条件

なし

## アイコン名マッピング（全アイコンの export 確認済み）

| lucide-react | @phosphor-icons/react |
|---|---|
| ChevronRight/Left/Down/Up | CaretRight/Left/Down/Up |
| Calendar, CalendarX, Clock | Calendar, CalendarX, Clock |
| BookOpen, Star, Heart | BookOpen, Star, Heart |
| Check, CheckCircle | Check, CheckCircle |
| X, Plus, User, Users | X, Plus, User, Users |
| Copy | Copy |
| Search | MagnifyingGlass |
| SearchX | MagnifyingGlassMinus |
| Pencil | PencilSimple |
| PenLine | PencilLine |
| Trash2 | Trash |
| AlertTriangle / TriangleAlert | Warning |
| CircleAlert | WarningCircle |
| Info | Info |
| Link2 | Link |
| ExternalLink | ArrowSquareOut |
| Share2 | ShareNetwork |
| Play, PlayCircle, Video | Play, PlayCircle, FilmSlate |
| Eye, EyeOff | Eye, EyeSlash |
| ArrowLeft, ArrowRight | ArrowLeft, ArrowRight |
| Filter | Funnel |
| Settings | GearSix |
| LogIn, LogOut | SignIn, SignOut |
| Loader | SpinnerGap |
| Upload | UploadSimple |
| File, FileText | File, FileText |
| Camera, Lightbulb, Send | Camera, Lightbulb, PaperPlaneTilt |
| RotateCcw | ArrowCounterClockwise |
| History | ClockCounterClockwise |
| ImageOff | ImageBroken |
| Lock, Shield | Lock, Shield |
| HelpCircle | Question |
| Sparkles | Sparkle |
| Dices | DiceFive |
| MessageSquarePlus | ChatText |
| MoreVertical | DotsThreeVertical |
| Menu | List |
| LayoutGrid | SquaresFour |
| Table | Table |
| List (toggle 用) | ListBullets |
| PanelLeftClose/Open | SidebarSimple |
| Timer | Timer |

**react-icons/io5 → Phosphor:**
IoBookmark→BookmarkSimple, IoCheckmarkCircle→CheckCircle, IoCreate→PencilSimple, IoPersonAdd→UserPlus

## Batch 1: 設定・依存関係

### Step 1-1. パッケージ更新

```bash
pnpm add @phosphor-icons/react
```

この時点では lucide-react と react-icons はまだ削除しない（段階的移行のため共存）。

- 対象ファイル: `package.json`

### Step 1-2. next.config.ts に optimizePackageImports 追加

`next.config.ts` の `experimental.optimizePackageImports` に `@phosphor-icons/react` を追加。Phosphor は 6000+ アイコンの barrel export を持つため、この設定なしではバンドルサイズが膨れる。

- 対象ファイル: `next.config.ts`

### Step 1-3. `.claude/rules/icons.md` と `CLAUDE.md` を Phosphor Icons 用に更新

- `.claude/rules/icons.md`: `lucide-react` → `@phosphor-icons/react` に全面変更
- weight バリアント（regular/fill/bold/light/thin/duotone）の説明を追加
- よく使うアイコンのマッピング表を更新
- `CLAUDE.md`: Key Patterns テーブル「lucide-react を使用」→「@phosphor-icons/react を使用」、Rules Reference テーブル「lucide-react使用規約」→「@phosphor-icons/react 使用規約」に変更
- 対象ファイル: `.claude/rules/icons.md`, `CLAUDE.md`

## Batch 2: 基本コンポーネント（elements）— 20ファイル

### Step 2-1. 単純置換（12ファイル）

import 元と一部アイコン名の変更のみ:
- `checkbox.tsx`, `Chip.tsx`, `modal.tsx`, `tags-input.tsx`, `avatar.tsx`: import 元のみ変更
- `date-picker.tsx`, `dropdown.tsx`, `select.tsx`, `combobox.tsx`, `number-input.tsx`, `pagination.tsx`: Chevron→Caret 名変更
- `file-upload.tsx`: Trash2→Trash, Upload→UploadSimple

### Step 2-2. 特殊変換（3ファイル）

- **`toast.tsx`** (`src/components/elements/toast/toast.tsx`): AlertTriangle → Warning
- **`alert.tsx`** (`src/components/elements/alert/alert.tsx`): CheckIcon→Check, CircleAlert→WarningCircle, InfoIcon→Info, TriangleAlert→Warning。`ark.svg asChild` パターンは Phosphor の SVG 出力と互換性あり（両方とも `<svg>` 要素を返すため）
- **`spinner.tsx`** (`src/components/elements/spinner/spinner.tsx`): Loader→SpinnerGap, `strokeWidth={3}` 削除 → `weight="bold"` 追加。PandaCSS spinner レシピで CSS サイズ制御されているため `"1em"` デフォルトで問題なし

### Step 2-3. fill/stroke 変換（1ファイル）

- **`rating.tsx`** (`src/components/elements/rating/rating.tsx`):
  - `fill={isFilled ? styles.colors.filled : 'none'}` + `stroke={...}` + `strokeWidth={2}` → `weight={isFilled ? 'fill' : 'regular'}` + `color={isFilled ? styles.colors.filled : styles.colors.empty}`

### Step 2-4. Stories（4ファイル）

- `icon-button.stories.tsx`: Heart（size={24} 明示追加。CSS でサイズ未制御のため）
- `tooltip.stories.tsx`: HelpCircle → Question
- `toggle-group.stories.tsx`: LayoutGrid→SquaresFour, List→ListBullets, Menu→List, Table→Table
- `menu.stories.tsx`: 8アイコン一括変換（Copy, Link, SignOut, PencilSimple, Plus, GearSix, Trash, User）

## Batch 3: ブロックコンポーネント（blocks）— 10ファイル

### Step 3-1. 全ファイル置換

| ファイル | 主な変更 |
|---------|---------|
| `FilterBottomSheet.tsx` | RotateCcw→ArrowCounterClockwise, Search→MagnifyingGlass |
| `GlobalHeader/index.tsx` | LogIn→SignIn |
| `FeedbackButton.tsx` | MessageSquarePlus→ChatText |
| `FilterSection.tsx` | Chevron→Caret |
| `FilterPanel.tsx` | import 元のみ |
| `PageHeader.tsx` | import 元のみ |
| `SignupModal.tsx` | import 元のみ |
| `ScenarioRegisterDialog.tsx` | Link2→Link, PenLine→PencilLine |
| `ProfileCard.tsx` | Settings→GearSix |
| `FeedbackModal.tsx` | Send→PaperPlaneTilt |

## Batch 4: ページコンポーネント — 31ファイル

### Step 4-1. ランディング・認証（2ファイル）
- `app/page.tsx`: Search→MagnifyingGlass
- `DiscordLoginButton.tsx`: LogIn→SignIn

### Step 4-2. ホーム画面（5ファイル）
- `HeroSection.tsx`: import 元のみ
- `UpcomingSessions.tsx`: ChevronRight→CaretRight（空状態 Calendar は CSS `fontSize` で制御、`size` 不要）
- `NewScenarios.tsx`: ChevronRight→CaretRight（空状態 BookOpen は CSS `fontSize` で制御、`size` 不要）
- `MiniCalendar.tsx`: Chevron→Caret
- **`ActivityTimeline.tsx`**: react-icons/io5 → Phosphor 全面変更。`import type { IconType } from 'react-icons'` → `import type { Icon } from '@phosphor-icons/react'`。IoBookmark→BookmarkSimple, IoCheckmarkCircle→CheckCircle, IoCreate→PencilSimple, IoPersonAdd→UserPlus

### Step 4-3. シナリオ一覧（6ファイル）
- `ScenariosContent.tsx`: ChevronDown→CaretDown, Filter→Funnel
- `ScenarioList.tsx`: RotateCcw→ArrowCounterClockwise, SearchX→MagnifyingGlassMinus
- `ScenarioCard.tsx`: ImageOff→ImageBroken
- `MobileSearchBar.tsx`, `SearchTopBar.tsx`: Search→MagnifyingGlass
- **`SearchSidebar.tsx`** (`src/app/(main)/scenarios/_components/SearchSidebar/SearchSidebar.tsx`): PanelLeftClose → SidebarSimple, PanelLeftOpen → SidebarSimple。同一アイコンで対応（開閉のコンテキストは aria-label とテキスト「閉じる」で提供済み）。サイズは現行を維持（展開ボタン `size={18}`、折りたたみボタン `size={16}`）

### Step 4-4. シナリオ登録・インポート（4ファイル）
- `scenarios/new/page.tsx`, `UrlInputStep.tsx`: Link2→Link
- `ScenarioForm.tsx`: import 元のみ
- `ImportScenarioForm.tsx`: ExternalLink→ArrowSquareOut

### Step 4-5. シナリオ詳細（6ファイル）— fill/stroke 変換を含む
- **`ScenarioHeader.tsx`** (`src/app/(main)/scenarios/[id]/_components/ScenarioHeader.tsx`): `fill={optimisticFavorite ? 'currentColor' : 'none'}` → `weight={optimisticFavorite ? 'fill' : 'regular'}`
- `ScenarioInfo.tsx`: ExternalLink→ArrowSquareOut, Link2→Link, Star fill→weight 変換, Timer はそのまま（Phosphor にも Timer あり）
- `ReviewSection.tsx`: Sparkles→Sparkle, Star fill→weight 変換
- `ScenarioFAB.tsx`: Menu→List, Pencil→PencilSimple, Share2→ShareNetwork
- `SessionSection.tsx`: Dices→DiceFive（TRPG アプリのためダイスアイコンが適切。GameController は汎用的すぎる）
- `VideoSection.tsx`: EyeOff→EyeSlash, PlayCircle→PlayCircle, Video→FilmSlate

### Step 4-6. プロフィール・セッション（8ファイル）
- `profile/page.tsx`: ExternalLink→ArrowSquareOut
- `SessionCard.tsx`: Video→FilmSlate
- `SearchPanel.tsx` (`sessions/_components/`): Search→MagnifyingGlass
- `HistoryTab.tsx`, `PublicTab.tsx`: ChevronDown→CaretDown
- `UpcomingTab.tsx`: ChevronDown→CaretDown, List→ListBullets
- `CalendarView.tsx`: Chevron→Caret
- `EmptyState.tsx`: CalendarX→CalendarX, History→ClockCounterClockwise, SearchX→MagnifyingGlassMinus

## Batch 5: クリーンアップ

### Step 5-1. 旧パッケージ削除

```bash
pnpm remove lucide-react react-icons
```

### Step 5-2. 残存参照チェック

`lucide-react` / `react-icons` の参照が src/ 全体に残っていないことを Grep で確認。

### Step 5-3. Serena メモリ更新

`.serena/memories/` 内の lucide-react 言及を `@phosphor-icons/react` に更新。

## ファイル一覧

### 新規ファイル

なし

### 変更ファイル（64ファイル）

| カテゴリ | ファイル数 | 主なファイル |
|---------|----------|------------|
| 設定 | 3 | `package.json`, `next.config.ts`, `.claude/rules/icons.md` |
| Elements | 20 | `rating.tsx`, `spinner.tsx`, `alert.tsx`, `toast.tsx` 等 |
| Blocks | 10 | `GlobalHeader/index.tsx`, `FeedbackModal.tsx` 等 |
| Pages | 31 | `ActivityTimeline.tsx`, `ScenarioHeader.tsx`, `SearchSidebar.tsx` 等 |

## 検証方法

### 自動テスト

```bash
pnpm check          # Biome lint/format
pnpm vitest run     # 全ユニットテスト
pnpm build          # プロダクションビルド（型エラー検出）
```

### E2E テスト

アイコン固有のセレクタ（data-testid, aria-label 等）は使用していないため、Playwright E2E テストへの影響なし。移行後に `pnpm playwright test` で回帰確認のみ実施。

### Storybook ビジュアル確認

```bash
pnpm storybook
```

重点確認ストーリー:
- Rating（fill/empty 切替）
- Spinner（アニメーションと太さ）
- Toast/Alert（ステータスアイコン）
- Menu/ToggleGroup（全アイコン）
- Dashboard/Page（全セクション）

### 手動テスト

- [ ] ランディングページ `/` の全アイコン
- [ ] GlobalHeader のロゴ・認証ボタン
- [ ] ホーム画面 `/home` の Hero、カレンダー、タイムライン
- [ ] シナリオ一覧 `/scenarios` のカード、検索バー、フィルター
- [ ] シナリオ詳細 `/scenarios/[id]` の Star 評価（fill/empty 切替）、FAB
- [ ] セッション一覧 `/sessions` のタブ、カード、空状態
- [ ] SearchSidebar の開閉パネルアイコン
- [ ] バンドルサイズが増加していないこと（Batch 1 実行前に `pnpm build` を実行し First Load JS を記録。移行完了後に再度 `pnpm build` して比較）
- [ ] Storybook スナップショットテストがある場合は全更新（`pnpm vitest run -u`）
