# シナリオ一覧・詳細 UI リデザイン（2ペイン化 + PCサイドメニュー）

> 実装状況・再開順序・検証結果は [実装状況と再開計画](ui-redesign-scenarios-status.md) を参照。新しい表示部品は実装済みだが、実画面への主要な接続と2ペインルーティングは未着手。本書と部品の差異は同資料の「統合前に確定する仕様」で管理する。

## Context

ChatGPT Image 2 のモックと簡易要件（`docs/redegins/requirements.md`）をもとに、全体トーンの微修正とシナリオ一覧・詳細の左右2ペイン化を行う。
方針の詳細は `docs/redegins/design-direction.md` を参照。モック・ChatGPT要件は**レイアウト/トーンの参考**であり仕様書ではない。

**現状:**
- グローバルナビは上部 `GlobalHeader` ＋ モバイル `BottomNav` ＋ `SpeedDialFAB`（左サイドメニューなし）。
- `/scenarios` は「左フィルターレール（SearchSidebar）＋ 結果グリッド」の単一ペイン。`/scenarios/[id]` は独立フルページ（既にタブ無し・セクション縦並び）。
- トーン（背景・カード・影・角丸・プライマリ・ノッチ式システムラベル）は既存 `semanticTokens.ts` で既にモックと一致。

**ゴール:**
- PC のみ左 `SideMenu`、モバイルは現状維持（ハイブリッド）。
- `/scenarios/[id]` を PC で「一覧 | 詳細パネル」の2ペイン表示（Parallel + Intercepting Routes）。モバイルは詳細単独。
- 詳細は**タブ禁止・セクション縦並び＋目次**（モックのタブは不採用）。
- フィルターはペイン上部へインライン化（SearchSidebar 廃止）。

## 決定事項

| 項目 | 方針 | 理由 |
|------|------|------|
| グローバルナビ | PCのみ `SideMenu` 追加、モバイルは BottomNav/SpeedDialFAB 維持（ハイブリッド） | 「トーン微修正＋2ペイン」に対し全面移行は過剰。2ペインとの相性は確保 |
| コンポーネント名 | `SideMenu`（"サイドバー"/"LeftSidebar" は使わない） | 過去のユーザー指定 |
| ブランド名 | 既存「シナプレ管理くん」を踏襲 | モックの「シナリオノート」はChatGPTの創作で不採用 |
| ナビ項目 | 既存ルート準拠（ホーム/シナリオ/セッション/スケジュール/ユーザー/マイページ） | 未実装ルート（マイリスト等）を投機的に作らない |
| 詳細ルーティング | Parallel Routes (`@detail`) + Intercepting Routes (`(.)[id]`) | 一覧 state を保持しつつ詳細表示、直URLはフルページで動作 |
| 詳細レイアウト | タブ禁止・セクション縦並び＋目次（TOC） | 要件採用。モックのタブは不採用 |
| 目次の出し分け | 余裕あるPC=右固定 / 狭いパネル・タブレット=上部sticky横並び or FloatingButton+Drawer / モバイル=Drawer | 2ペインの詳細パネルは幅≈50%で右固定目次が窮屈 |
| フィルターUI | ペイン上部インライン化、SearchSidebar/SearchTopBar/MobileSearchBar 廃止 | 3カラム化により左フィルターレールは破綻 |
| タグ | カテゴリ別カラー導入を検討（配色は実装時 Pencil で確定） | 視覚情報量の向上。未確定なら現状グレー維持 |
| セッション | 本計画スコープ外（後続）。共通基盤（トークン/SideMenu/カード規約）は波及考慮 | ユーザー主目的はシナリオ2ペイン |

## 前提条件

- PandaCSS セマンティックトークンは `src/styles/semanticTokens.ts` 管理（変更後 `pnpm prepare` で再生成）。
- `scenarios/[id]/page.tsx` の既存フルページ詳細は**直URL/リロード用に保持**する。
- ブランチ: `develop` から `feature/ui-redesign-scenarios` を切って作業（大規模のため）。
- タグのカテゴリ別カラーを採用する場合、Batch 4 着手前に配色を Pencil/MCP で確定（未確定なら現状グレー維持で先送り可）。

## 段階リリース方針

Parallel + Intercepting Routes（Batch 5 以降）は App Router のルーティング挙動を変えるため、リスクの低いトーン修正と分けて段階リリースできるようにする。

- **先行マージ可能**: Batch 1〜4（トークン / `SideMenu` / フィルターインライン化 / カード）。ルーティングを変えず、単独で価値が出る。問題が出てもロールバック容易。
- **後続**: Batch 5（2ペイン基盤）→ Batch 6A/6B（詳細パネル）。Batch 5 で問題が出た場合、Batch 1〜4 は既にマージ済みのため**トーン刷新だけ本番反映した状態を維持**できる。
- Batch 5 の `scenarios/layout.tsx`（`@detail` スロット）導入はフィーチャーフラグ的に「`@detail` が常に null（=従来のフルページ遷移）」へ戻せる構成にしておくと切り戻しが安全。

## 実行戦略（コンポーネント先行・Storybook駆動）

**進め方の基本方針**: まず Storybook 化しやすい純粋コンポーネント単位で「実装＋Storybook」を作り、**Storybook 上でコンポーネント単位にブラッシュアップして確定**させてから、統合・配線を行う。下記 Batch（機能単位の詳細仕様）はそのまま"仕様の参照元"として使い、**実際の着手順序はこの2トラックに従う**。

**前提となる設計原則**:
- コンポーネントは **prop-driven**（内部で fetch しない）。データは props で受け、Storybook ではモックを渡す。
- Server Action を受ける場合は **action を props で受け取り**、Storybook の `args` でモック（送信中/成功/エラーを再現）。
- 各ユニットの完了定義 = `Component.tsx` + `styles.ts` + `index.ts` + `*.stories.tsx`（デフォルト/主要バリアント/インタラクション/エッジケースの各状態）+ Storybook 上でのブラッシュアップ確定。

### Track 1: Storybook 駆動で先行する純粋コンポーネント（依存順）

| 順 | ユニット | 対応 Step | Storybook の主な状態 |
|----|---------|----------|---------------------|
| 0 | トークン基盤（前提） | Batch 1 | （コンポーネントではない。先行必須） |
| 1 | 状態バッジ／カテゴリタグ | Batch 1(トークン)＋Batch 4 Step 4-1 | 募集中/参加予定/締切間近/終了、各カテゴリタグ、未選択/選択 |
| 2 | ScenarioCard | Batch 4 Step 4-2 | 通常/お気に入り済/長文/サムネ無/2ペイン縮小幅 |
| 3 | ScenarioFilters | Batch 3 Step 3-1 | 基本のみ/詳細展開/フィルター適用中/clear |
| 4 | SideMenu | Batch 2 Step 2-1 | 各ナビ active/未ログイン/ログイン済 |
| 5 | SectionToc | Batch 6A Step 6A-3 | セクション 0/1/多数、PC右固定/狭幅横並び、現在地ハイライト |
| 6 | ScenarioDetailPanel | Batch 6A Step 6A-2 | VM モックで full/最小（一部セクション欠）/お気に入り操作 |

### Track 2: 統合・配線（Storybook 化不可。Track 1 の該当部品が確定してから着手）

| 順 | 作業 | 対応 Step |
|----|------|----------|
| 1 | `layout.tsx` に SideMenu 組込・GlobalHeader lg 非表示・全画面余白棚卸し | Batch 2 Step 2-2〜2-4 |
| 2 | `ScenariosContent` に ScenarioFilters/ScenarioCard 配線・結果行・旧フィルター廃止 | Batch 3 Step 3-2〜3-4 |
| 3 | `viewModel` 抽出・`[id]/page.tsx` リファクタ | Batch 5 Step 5-3 |
| 4 | Parallel/Intercepting Routes 基盤（`layout`/`@detail`/仮UI）・state 保持検証 | Batch 5 Step 5-1,5-2,5-4,5-5 |
| 5 | `@detail` 実描画・フルページ整合・アニメ | Batch 6B Step 6B-1〜6B-3 |
| 6 | E2E/POM 更新 | Batch 3 Step 3-4 / Batch 6B Step 6B-4 |

> **コミット/レビュー単位**: Track 1 は「1コンポーネント＝1コミット」（Storybook 込み）。Track 2 は元の Batch の Review Checkpoint（`/review-diff` 閾値）に従う。

---

## Batch 1: トークン基盤

他バッチが参照するトークンを先行定義する。

### Step 1-1. `SideMenu` 用トークン追加

- 対象: `src/styles/semanticTokens.ts`
- 追加: `sideMenu.bg` / `sideMenu.activeItemBg` / `sideMenu.activeItemText` / `sideMenu.inactiveItemText` / `sideMenu.inactiveItemBgHover`
- 幅 240px は CSS 変数 or styles.ts の定数で管理（トークン外）。

### Step 1-2. 状態バッジトークン追加

- 対象: `src/styles/semanticTokens.ts`
- 追加: `badge.recruiting.{bg,dot,text}`（募集中=ピンク〜淡赤系）。`warning`(オレンジ=締切間近) と色で区別。
- 既存 `badge.success`(参加予定=緑) / `badge.neutral`(終了=グレー) は流用。

### Step 1-3.（任意）タグ カテゴリ別カラートークン

- 対象: `src/styles/semanticTokens.ts`
- 追加: `tag.{closed,setting,genre,style,warning,default}.{bg,text}`（配色確定後）。
- 未確定なら本ステップはスキップし、Batch 4 でグレー維持。

### Review Checkpoint: Batch 1
- [ ] `pnpm prepare`（PandaCSS再生成）→ `pnpm check`
- [ ] 見積: `semanticTokens.ts` 1ファイル・追加 ≈ 30〜60行（`plan-mode.md` 閾値 ≤5ファイル かつ ≤100行 に収まる）→ **`/review-diff` スキップ可**、コミット作成
- [ ] 実差分が 100 行を超えた場合は `/review-diff` を実施

---

## Batch 2: `SideMenu` + ハイブリッドレイアウト

### Step 2-1. `SideMenu` コンポーネント作成

- 新規: `src/components/blocks/SideMenu/{SideMenu.tsx,styles.ts,index.ts,SideMenu.stories.tsx}`
- 構成:
  - 上部: ロゴ（BookOpen + 「シナプレ管理くん」）。
  - 中部: ナビ（既存ルート準拠）。`usePathname()` でアクティブ判定、`aria-current="page"`。
  - 下部: 「＋ シナリオを登録」CTA（既存 `ScenarioRegisterDialog` 再利用）＋設定＋ユーザーアバター。
  - PC のみ表示: `display: { base: 'none', lg: 'flex' }`、`position: sticky; top: 0; height: 100dvh`。
- Storybook 必須（`react-rules.md`）: デフォルト/各アクティブ状態/未ログイン。

### Step 2-2. `(main)/layout.tsx` をハイブリッド構成へ

- 対象: `src/app/(main)/layout.tsx`
- 変更:
  - ルートを横並びに（`SideMenu` + `main`）。`SideMenu` は lg 以上で表示。
  - `main`: `flex: 1; minW: 0`。
  - `GlobalHeader` は lg 以上で非表示（`display: { base: 'flex', lg: 'none' }`）。モバイルのみ残す。
  - `BottomNav` / `SpeedDialFAB` は現状維持（モバイル）。
  - `SimpleFooter` の要否を確認（サイドメニュー構成での扱いを判断）。

### Step 2-3. 全メインページの横余白棚卸し

- 影響範囲: `SideMenu` は scenarios だけでなく **`(main)` 配下の全ページ**に表示される（`home / scenarios / sessions / schedules / users / feedback / profile` の 7 画面 + 各動的ルート）。
- 対象: 各ページの大きな横 padding を `SideMenu` 追加分を見込んで実測調整。「`scenarios` 等」ではなく**全ページを棚卸し**して一覧化し、過剰な左右余白・二重ガター・横スクロール発生がないか確認する。

### Step 2-4. GlobalHeader 機能の移植対応表

- 対象: `GlobalHeader` を lg 以上で非表示にすることで PC から失われる導線がないか確認する。
- 変更内容: `GlobalHeader` が担う機能（ロゴ/ナビ/シナリオ登録ボタン/ユーザーアバター/ログイン導線/通知 等）を洗い出し、**`SideMenu` への移植対応表**を作る。未移植の導線があれば `SideMenu` に追加してから lg 非表示化する。

### Review Checkpoint: Batch 2
- [ ] `pnpm check` / `pnpm build`
- [ ] `pnpm vitest`（GlobalHeader/BottomNav 関連テストの影響確認）
- [ ] **全 7 メインページの回帰**（PC）: 余白・スクロール・各ページ内の固定ヘッダー/パンくずが `SideMenu` と干渉しない／GlobalHeader 非表示で失われた導線がない
- [ ] モバイル: `SideMenu` 非表示・BottomNav/SpeedDialFAB が従来どおり動作
- [ ] `/review-diff`（ファイル数 > 5 or 100行超のため必須）
- [ ] 指摘修正 → コミット

---

## Batch 3: シナリオ一覧フィルターのインライン化

### Step 3-1. `ScenarioFilters` コンポーネント作成

- 新規: `src/app/(main)/scenarios/_components/ScenarioFilters/{ScenarioFilters.tsx,styles.ts}`
- 構成:
  - 基本（常時表示）: フリーワード / システム / カテゴリ。
  - 詳細（Accordion 展開）: プレイ時間 / 人数 / HO公開 / タグ。
  - 既存 `useFilterDraft`（`FilterPanel`）のドラフト/コミット機構を流用。
- Storybook 必須。

### Step 3-2. `ScenariosContent` 改修

- 対象: `src/app/(main)/scenarios/_components/ScenariosContent.tsx`
- 変更:
  - `SearchSidebar` / `SearchTopBar` 参照を `ScenarioFilters` に置換。
  - 検索結果行: 左=件数 / 右=並び順・表示形式（カード/リスト切替を追加）。
  - サイドバー折りたたみ state を削除。モバイルは `FilterBottomSheet` を継続利用。

### Step 3-3. 旧フィルターコンポーネント廃止

- 廃止: `_components/SearchSidebar/`, `_components/SearchTopBar/`（参照削除後にファイル削除）。
- `MobileSearchBar/` はモバイル基本検索として残すか `ScenarioFilters` に統合するか判断。

### Step 3-4. 既存 E2E / Page Object の更新

- フィルター UI のインライン化で破壊される E2E を更新する。
- 対象: `e2e/scenarios/filter.spec.ts`・`e2e/scenarios/search.spec.ts`、Page Object `e2e/pages/scenarios-page.ts`（`searchInput` / `sortTrigger` 等のセレクタ）。
- 方針（`testing-patterns.md` 準拠）: role + アクセシブル名で取り直す。PandaCSS クラス依存禁止。PC/モバイルで同名要素が重複する箇所は `.filter({ visible: true })` で可視要素に限定。

### Review Checkpoint: Batch 3
- [ ] `pnpm check` / `pnpm vitest`（scenarios 関連 UT）
- [ ] 更新した E2E が通過（`pnpm exec playwright test e2e/scenarios/filter.spec.ts e2e/scenarios/search.spec.ts`）
- [ ] `/review-diff` 実施 → 指摘修正 → コミット

---

## Batch 4: シナリオカードのトーン微修正

### Step 4-1.（任意）タグのカテゴリ別カラー

- 対象: タグ表示コンポーネント（`ScenarioCard` 内 or 共通 Tag）
- `cva` で Batch 1 のトークンをバリアント適用。配色未確定ならスキップ。

### Step 4-2. `ScenarioCard` 微調整

- 対象: `src/app/(main)/scenarios/_components/ScenarioCard.tsx`
- 変更: ノッチ式システムラベルは維持。2ペイン縮小幅でも崩れないようグリッド最小幅・余白を調整。状態バッジ（人気/新着）に Batch 1 トークンを適用。
- Storybook の各状態を更新。

### Review Checkpoint: Batch 4
- [ ] `pnpm check` / `pnpm vitest`
- [ ] 見積: タグ cva + カード調整 + Storybook 更新で **100 行を超える見込み** → `/review-diff` を**実施**（スキップしない）→ 指摘修正 → コミット
- [ ] タグ配色未確定でカラー化をスキップした場合は差分が小さくなるため、実差分で再判定

---

## Batch 5: 2ペイン基盤（Parallel + Intercepting Routes）

### Step 5-1. `scenarios/layout.tsx`（`@detail` スロット）

- 新規: `src/app/(main)/scenarios/layout.tsx`
- 構成: `children`（一覧）と `detail`（パネル）を横並び。
  - `detail` あり: 一覧を縮小（`lg: { maxW: '50%' }` 目安）、`detail` を `w: { base: '100%', lg: '50%' }; minW: { lg: '480px' }`。
  - `detail` なし（null）: 一覧フル幅。

### Step 5-2. `@detail/default.tsx`

- 新規: `src/app/(main)/scenarios/@detail/default.tsx` → `return null`。

### Step 5-3. 詳細取得・Server Action の共通抽出

- **目的**: フルページ `[id]/page.tsx` と intercept `@detail/(.)[id]/page.tsx` で取得・認証・お気に入りを**二重管理しない**。
- 新規: `src/app/(main)/scenarios/[id]/viewModel.ts` — `getScenarioDetailViewModel(id)` を定義。
  - 現状 `[id]/page.tsx` にインライン定義されている処理を移設する: 認証（`auth.getUser()` → `getUserByAuthUserId`）、詳細/レビュー/セッション/動画/preference の取得、`isFavorite/isPlayed/isLoggedIn` の算出。
  - **Cloudflare Workers 安定性のための直列取得（既存コメント）を維持**する。
  - 権限情報（per-user 状態）は**サーバー側で取得**したまま（クライアント出し分けで隠さない / 要件 6.4）。
- お気に入りの Server Action は既存 `[id]/actions.ts` の `toggleFavoriteAction` を**両ルートから共有**する（インラインの `'use server'` クロージャを各ルートに複製しない）。
- `[id]/page.tsx` を `getScenarioDetailViewModel` 利用に置き換える（リファクタのみ、表示は不変）。既存 E2E が通ることを確認。

### Step 5-4. インターセプトルート（UIは仮）

- 新規: `src/app/(main)/scenarios/@detail/(.)[id]/page.tsx`
- 内容: Step 5-3 の `getScenarioDetailViewModel` と共有 Server Action を使う。UI は仮プレースホルダーで**ルーティング動作確認を優先**。

### Step 5-5. 動作検証

- 一覧カードクリック → パネル描画 / 直URL `/scenarios/[id]` → フルページ / ブラウザバック → パネル閉じる、を確認。
- **一覧 state 保持の確認（必須）**: 現状の一覧は Client（`ScenariosContent`）の `useState` + `/api/scenarios/search` fetch で結果を保持している。intercept 遷移で `children`（一覧ツリー）が**アンマウント/再マウントされず**、以下が保持されることを確認:
  - 検索結果・適用中フィルター
  - スクロール位置
  - 「もっと見る」で追記済みの追加分
- 保持されない場合はレイアウト境界（`scenarios/layout.tsx` の `children` セグメント）の構成を見直す。

### Review Checkpoint: Batch 5
- [ ] `pnpm build`（並列・インターセプトの型/ビルド確認）
- [ ] Step 5-3 のリファクタ後、既存 `e2e/scenarios/detail.spec.ts`・`e2e/auth/scenario-detail-actions.spec.ts` が通過（表示不変の確認）
- [ ] `/review-diff` → 指摘修正 → コミット

---

## Batch 6A: 詳細パネル UI（パネル + 目次）

詳細表示の UI を先に固める（intercept への接続は Batch 6B）。

### Step 6A-1. セクション定義の単一ソース化

- 新規/対象: `src/app/(main)/scenarios/[id]/interface.ts`
- 内容: 詳細のセクション配列を**単一ソース**として定義する（要件 6.4 の ViewModel 思想を先取り）。
  - 型例: `type DetailSection = { id: string; label: string; present: boolean }`
  - `overview / info / ho / sessions / videos / comments / links` を VM の有無（`present`）から生成。
  - **目次（SectionToc）とコンテンツ（ScenarioDetailPanel）は同じ配列を参照**し、項目とアンカーの二重管理を防ぐ。

### Step 6A-2. `ScenarioDetailPanel` 作成

- 新規: `src/app/(main)/scenarios/_components/ScenarioDetailPanel/{ScenarioDetailPanel.tsx,styles.ts,index.ts,ScenarioDetailPanel.stories.tsx}`
- 構成:
  - ヘッダーバー: 「一覧に戻る」/ お気に入り / 「セッションを作成」/ メニュー。
  - ファーストビュー: 既存 `ScenarioHeader`/`ScenarioInfo` を再利用。
  - 本体: **全セクションを縦に常時描画**。各セクションに Step 6A-1 の `id` をアンカーとして付与。既存 `SessionSection`/`VideoSection`/`ReviewSection` を再利用。
- **フォーカス管理**（a11y）:
  - パネル open 時（カードクリック）にパネル先頭（ヘッダーバーの「一覧に戻る」or パネル見出し）へフォーカスを移動。
  - 「一覧に戻る」/ パネルクローズ時は**発火元のカード**へフォーカスを復帰させる（発火元 ref or `data-` キーで特定）。

### Step 6A-3. 目次（TOC）コンポーネント

- 新規: `_components/ScenarioDetailPanel/SectionToc.tsx`
- 仕様:
  - **アンカースクロール**（コンテンツ差し替えではない）。`IntersectionObserver` で現在地ハイライト。
  - 入力は Step 6A-1 のセクション配列。**存在するセクションのみ**を項目化。
  - **タブに見せないマークアップ**（a11y）:
    - コンテナは `<nav aria-label="目次">`。
    - 項目は `<a href="#id">`（リンク主体）。
    - 現在地は `aria-current="location"`。
    - **`role="tablist"` / `role="tab"` は使わない**（タブ誤認・スクリーンリーダー齟齬を防ぐ）。
  - 出し分け: 余裕あるPC=右固定 / 狭いパネル・タブレット=上部sticky横並び or FloatingButton+Drawer / モバイル=Drawer。
  - **`IntersectionObserver` のエッジケース**: 末尾セクションが短くハイライトが当たらない問題は `rootMargin` を調整（例: 下端を負マージン）。セクション 0〜1 個時のフォールバック（目次自体を非表示 or 単一ハイライト固定）と初期表示時のハイライトを実装メモに残す。
- Storybook 必須（セクション 0/1/多数、PC右固定・狭幅横並びの各状態）。

### Review Checkpoint: Batch 6A
- [ ] `pnpm check` / `pnpm vitest`
- [ ] Storybook で目次の各状態・タブに見えないことを目視
- [ ] `/review-diff`（ファイル数 > 5 or 100行超のため必須）→ 指摘修正 → コミット

## Batch 6B: intercept 実描画・フルページ整合・E2E

### Step 6B-1. `@detail` ページを実描画に差し替え

- 対象: `scenarios/@detail/(.)[id]/page.tsx` → Batch 5 の仮 UI を `ScenarioDetailPanel` の実描画に置き換え。

### Step 6B-2. フルページ版 `[id]/page.tsx` 整合

- 対象: `src/app/(main)/scenarios/[id]/page.tsx`
- 変更: Step 5-3 の `getScenarioDetailViewModel` を引き続き使い、フルページレイアウトで再利用。目次は「余裕あるPC=右固定」モードで表示。タブが無いことを維持。
- **フルページと2ペインで共有する具体コンポーネント**を列挙して二重実装を防ぐ:
  - `ScenarioDetailPanel`（本体・目次・セクション）
  - VM: `getScenarioDetailViewModel`
  - Server Action: `[id]/actions.ts` の `toggleFavoriteAction`
  - セクション配列: `[id]/interface.ts`
  - 差分は「外枠（パネル枠 vs フルページ枠）」と「目次の表示モード」のみに限定する。

### Step 6B-3.（任意）パネルのスライドイン

- `styles.ts` に `@keyframes slideInFromRight` を定義しパネルへ適用。`prefers-reduced-motion` 配慮。

### Step 6B-4. 詳細系 E2E / Page Object の更新

- 2ペインのヘッダーバー再設計・「一覧に戻る」挙動・パネル DOM 化で破壊される E2E を更新する。
- 対象: `e2e/scenarios/detail.spec.ts`（`backLink`＝「戻る」リンク、`/scenarios$` への復帰、`article h1` 等）、Page Object `e2e/pages/scenario-detail-page.ts`、`e2e/auth/scenario-detail-actions.spec.ts`。
- 方針: PC=パネル / モバイル=単独ページで同名要素が重複するため `.filter({ visible: true })` で可視要素に限定（`testing-patterns.md`）。`beforeEach` の「一覧→カードクリック→詳細」が2ペイン遷移後もパネル DOM 内で解決できるか確認。

### Review Checkpoint: Batch 6B（最終）
- [ ] `pnpm check` / `pnpm build` / `pnpm vitest`
- [ ] 詳細系 E2E が通過（`pnpm exec playwright test e2e/scenarios/detail.spec.ts e2e/auth/scenario-detail-actions.spec.ts`）
- [ ] `/review-diff`（最終Batchのため必須）→ 指摘修正 → コミット
- [ ] 手動テスト（下記）

---

## ファイル一覧

### 新規ファイル

| ファイル | 用途 | Batch |
|---------|------|-------|
| `src/components/blocks/SideMenu/SideMenu.tsx` | PCサイドメニュー | 2 |
| `src/components/blocks/SideMenu/styles.ts` | スタイル | 2 |
| `src/components/blocks/SideMenu/index.ts` | エクスポート | 2 |
| `src/components/blocks/SideMenu/SideMenu.stories.tsx` | Storybook | 2 |
| `src/app/(main)/scenarios/_components/ScenarioFilters/ScenarioFilters.tsx` | インラインフィルター | 3 |
| `src/app/(main)/scenarios/_components/ScenarioFilters/styles.ts` | スタイル | 3 |
| `src/app/(main)/scenarios/_components/ScenarioFilters/index.ts` | エクスポート | 3 |
| `src/app/(main)/scenarios/_components/ScenarioFilters/ScenarioFilters.stories.tsx` | Storybook | 3 |
| `src/app/(main)/scenarios/layout.tsx` | `@detail` スロット付きレイアウト | 5 |
| `src/app/(main)/scenarios/@detail/default.tsx` | パネルなし時 null | 5 |
| `src/app/(main)/scenarios/@detail/(.)[id]/page.tsx` | インターセプト詳細（5で仮UI、6Bで実描画） | 5/6B |
| `src/app/(main)/scenarios/[id]/viewModel.ts` | 詳細取得 VM（フルページ/intercept 共有） | 5 |
| `src/app/(main)/scenarios/_components/ScenarioDetailPanel/ScenarioDetailPanel.tsx` | 詳細パネル本体 | 6A |
| `src/app/(main)/scenarios/_components/ScenarioDetailPanel/styles.ts` | スタイル | 6A |
| `src/app/(main)/scenarios/_components/ScenarioDetailPanel/index.ts` | エクスポート | 6A |
| `src/app/(main)/scenarios/_components/ScenarioDetailPanel/ScenarioDetailPanel.stories.tsx` | Storybook | 6A |
| `src/app/(main)/scenarios/_components/ScenarioDetailPanel/SectionToc.tsx` | 目次（タブ不使用） | 6A |

### 変更ファイル

| ファイル | 変更内容 | Batch |
|---------|---------|-------|
| `src/styles/semanticTokens.ts` | sideMenu/badge.recruiting/(tag) トークン追加 | 1 |
| `src/app/(main)/layout.tsx` | SideMenu 組み込み・GlobalHeader を lg で非表示 | 2 |
| `src/app/(main)/scenarios/_components/ScenariosContent.tsx` | ScenarioFilters 統合・結果行に表示形式追加 | 3 |
| `src/app/(main)/scenarios/_components/ScenarioCard.tsx` | バッジ/タグ微修正・縮小幅対応 | 4 |
| `src/app/(main)/scenarios/[id]/page.tsx` | VM 利用へリファクタ(5)・共通セクション再利用/右固定目次(6B) | 5/6B |
| `src/app/(main)/scenarios/[id]/interface.ts` | 詳細セクション配列の単一ソース定義（目次/本体で共有） | 6A |
| `e2e/pages/scenarios-page.ts` | フィルターインライン化に伴うセレクタ更新 | 3 |
| `e2e/scenarios/filter.spec.ts` / `search.spec.ts` | フィルター/検索 UI 変更に追従 | 3 |
| `e2e/pages/scenario-detail-page.ts` | 2ペイン化・戻る挙動変更に伴うセレクタ更新 | 6B |
| `e2e/scenarios/detail.spec.ts` / `e2e/auth/scenario-detail-actions.spec.ts` | 2ペイン遷移・パネル DOM に追従 | 6B |

### 廃止候補

| ファイル | タイミング |
|---------|-----------|
| `_components/SearchSidebar/` | Batch 3 完了後 |
| `_components/SearchTopBar/` | Batch 3 完了後 |
| `src/components/blocks/GlobalHeader/` | モバイル動作確認後に判断（当面は lg 非表示で残す） |

## 検証方法

### 自動テスト

```bash
pnpm check
pnpm vitest run
pnpm build
# 既存 E2E / Page Object は本リデザインで破壊されるため Batch 3/5/6 で更新する
#   POM: e2e/pages/scenarios-page.ts, e2e/pages/scenario-detail-page.ts
#   spec: e2e/scenarios/{search,filter,detail}.spec.ts, e2e/auth/scenario-detail-actions.spec.ts
pnpm exec playwright test e2e/scenarios
```

> **既存 E2E 破壊への対応（必須）**: SearchSidebar/SearchTopBar 廃止・2ペイン化・「戻る」挙動変更で上記 spec/POM が stale 化する。`testing-patterns.md` のセレクタ鉄則（role + アクセシブル名 / PandaCSS クラス禁止 / PC=パネル・モバイル=単独で重複する要素は `.filter({ visible: true })`）に従って更新する。

### 手動テスト

- [ ] PC: `SideMenu` 表示・アクティブ項目ハイライト・「＋シナリオを登録」動作
- [ ] PC: 全 7 メインページ（home/scenarios/sessions/schedules/users/feedback/profile）で余白・スクロール・固定ヘッダーが SideMenu と干渉しない
- [ ] PC: 一覧カードクリック → 右にパネル、一覧が縮小
- [ ] PC: パネル表示後も一覧の検索結果・フィルター・スクロール位置・「もっと見る」追加分が保持される
- [ ] PC: 「一覧に戻る」/ ブラウザバック → パネルが閉じフル幅へ
- [ ] 直URL `/scenarios/[id]` / リロード → フルページ詳細
- [ ] モバイル: `SideMenu` 非表示・BottomNav/SpeedDialFAB 動作・詳細は単独ページ
- [ ] 詳細に**タブが存在しない**／全セクションが縦に並ぶ
- [ ] 目次: クリックでアンカースクロール・現在地ハイライト・存在セクションのみ表示
- [ ] 狭い詳細パネルで目次が窮屈にならない（上部sticky or Drawer に切替）
- [ ] フィルター: 基本3常時表示・詳細展開・お気に入り楽観的更新が一覧/パネル両方で動作
- [ ] a11y（axe）: select-name / aria 系違反なし（`testing-patterns.md` 参照）
