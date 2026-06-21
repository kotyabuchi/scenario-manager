# シナリオ一覧・詳細 UI リデザイン（2ペイン化 + PCサイドメニュー） レビューレポート

> **レビュー日時**: 2026-06-19
> **対象ファイル**: `docs/plans/ui-redesign-scenarios.md`
> **総合評価**: B
> **反映ステータス**: 反映済み（2026-06-20）
> **反映内容**: 必須 4件 + 推奨 6件 + 検討 3件（全件反映）

## サマリー

方針（`design-direction.md`）と要件の取捨選択（タブ禁止・目次方式、ハイブリッドナビ、シナリオ先行）は技術的に妥当で、Batch 分割・トークン先行・既存コンポーネント再利用の方針も良い。一方、(1) Parallel + Intercepting Routes と現状の「クライアント fetch + useState」一覧の相互作用、(2) `(main)/layout.tsx` 変更が**全メインページに波及**する影響範囲、(3) **既存 E2E / Page Object の破壊**が計画に明記されていない、という3点に実装前の対処が必要。これらを潰せばそのまま実行可能。

## 評価詳細

### 1. 技術的妥当性 WARN

- **Parallel + Intercepting Routes の選定自体は適切**。一覧 state を保持しつつ詳細をパネル表示し、直 URL はフルページという要件に合致する標準パターン。
- **ただし「一覧 state を保持」の前提が現状実装と噛み合っていない可能性がある**。現状 `/scenarios` の検索は Server Component のデータではなく、`ScenariosContent`（Client）が `/api/scenarios/search` を `fetch` し `useState` に保持している（`ScenariosContent.tsx` L96-222）。Parallel Routes で `@detail` を表示する際、`children`（= `ScenariosContent` を含むツリー）がアンマウントされなければ state は保持されるが、**Intercepting Route 遷移時にレイアウト境界で `children` セグメントが再レンダリング/再マウントされないこと**を Batch 5 の動作検証で**明示的に確認項目に含める**べき（「カードクリック→パネル描画後も検索結果・スクロール位置・もっと見るで読み込んだ追加分が保持される」）。計画の Step 5-4 は「パネル描画/直URL/ブラウザバック」のみで、state 保持の確認が抜けている。
- **詳細データ取得の二重定義リスク**。`[id]/page.tsx` はデータ取得を「Cloudflare Workers 環境では順次実行で安定性を確保」とコメントし**意図的に直列**化（L51-55）、かつ `toggleFavoriteAction` を**インラインの `'use server'` クロージャ**で渡している（L83-87）。Intercepted route（`@detail/(.)[id]/page.tsx`）に同じ取得・認証・Server Action を**コピーすると二重管理**になる。共通の取得関数（例: `getScenarioDetailViewModel(id, userId)`）へ**抽出してから両ルートで共有**する方針を計画に追記すべき（要件 6.5 の query/mutation 分離の思想とも整合）。

### 2. 網羅性・考慮漏れ NG

- **既存 E2E の破壊が計画に書かれていない（最重要）**。以下は確実に影響を受ける:
  - `e2e/scenarios/search.spec.ts`: `searchInput` / `sortTrigger` が `SearchSidebar`/`SearchTopBar` 由来なら、Batch 3 の廃止で Page Object (`scenarios-page.ts`) のセレクタが stale 化する。「シナリオカードをクリックすると詳細ページに遷移」も 2ペイン化で URL 遷移挙動が変わる可能性。
  - `e2e/scenarios/detail.spec.ts`: `backLink = getByRole('link', { name: '戻る' })` と「戻るリンクで `/scenarios$` に戻る」（L34-37）は、2ペインの「一覧に戻る」挙動（Step 6-1 のヘッダーバー再設計）と競合し得る。`detail.spec.ts` は `beforeEach` で**一覧→カードクリック→詳細**を経由するため、2ペイン遷移時に `article h1` 等のセレクタがパネル DOM 内で解決できるか要確認。
  - `e2e/scenarios/filter.spec.ts`: フィルター UI のインライン化で全面的に影響。
  - **対応**: 計画の「検証方法 > 自動テスト」に「**既存 E2E / Page Object（`scenarios-page.ts`, `scenario-detail-page.ts`）の更新**」を Batch 3・5・6 の Review Checkpoint へ明示的に組み込む。`testing-patterns.md` の「セレクタ鉄則」（role + アクセシブル名、PandaCSS クラス禁止、可視要素限定）に従い、2ペイン特有の「PC=パネル / モバイル=単独ページ」で同名要素が重複する点を `.filter({ visible: true })` で捌く方針を明記。
- **`(main)/layout.tsx` 変更の波及範囲が過小評価**。`SideMenu` は scenarios だけでなく `home / sessions / schedules / users / feedback / profile` の**全メインページに表示される**（`(main)/*/page.tsx` 7画面）。計画の手動テストは scenarios 中心で、**他ページの横余白・スクロール・GlobalHeader 非表示時の影響**（特に各ページ内の固定ヘッダー/パンくず）への回帰確認が抜けている。Step 2-3「ページ横余白の調整」が `scenarios 等` と曖昧。全画面の回帰チェックリストを追加すべき。
- **`GlobalHeader` を lg で非表示にする副作用**。`GlobalHeader` が担っている機能（検索・通知・ユーザーメニュー・ログイン導線等）が `SideMenu` に**全て移植されているか**の対応表がない。lg で隠した結果、PC で失われる導線がないか Batch 2 で要確認。
- **ロールバック手順の記載なし**。`feature/ui-redesign-scenarios` ブランチ運用は明記されているが、Parallel Routes 導入は App Router のルーティング挙動を変えるため、段階リリース（Batch 5 で問題が出たら 1-4 のトーン修正だけ先行マージ可能か）の判断材料があると良い。

### 3. セキュリティ NG ではないが WARN

- **認可の二重化に注意**。詳細データ取得を共通化する際、`[id]/page.tsx` の認証フロー（`auth.getUser()` → `getUserByAuthUserId`）を intercepted route でも**同等に再実装**する必要がある。クライアント側の出し分けだけで権限情報を隠さないこと（要件 6.4 の原則）。本計画スコープのシナリオ詳細は公開情報主体だが、お気に入り/プレイ済み等の per-user 状態は**サーバー側で取得**する現状を維持すること。
- 新規入力経路の追加はなく（フィルターは既存スキーマ流用）、入力バリデーション面の新規リスクは小さい。

### 4. UX・アクセシビリティ WARN

- **目次がタブに見えないための具体策が文章止まり**。Step 6-2 は「ピル/リンク主体」「タブに見せない」と要件を正しく反映しているが、a11y 実装の具体（目次を `<nav aria-label="目次">` でマークアップ、現在地は `aria-current="location"`、tablist/tab role を**使わない**こと）を明記すると Red/実装での解釈ブレを防げる。
- **`IntersectionObserver` のエッジケース**。最終セクションが短い/ビューポート末尾でハイライトが当たらない、セクション 0〜1 個時の挙動、初期表示時のハイライトなどの考慮が必要。「存在するセクションのみ項目化」は良い。
- **2ペイン時のフォーカス管理**が未記載。カードクリックでパネルが開いた際のフォーカス移動、「一覧に戻る」時の**フォーカス復帰**（開いたカードへ戻す）は WCAG 観点で重要。
- **スライドイン（Step 6-5）の `prefers-reduced-motion` 配慮**は明記済みで良い。`testing-patterns.md` の axe（select-name / aria-valid-attr-value）チェックも検証項目に入っており妥当。

### 5. 保守性・拡張性 OK

- トークン先行（Batch 1）→ 共通基盤 → 機能の順序、既存コンポーネント（`ScenarioInfo/SessionSection/VideoSection/ReviewSection`）の再利用、`semanticTokens.ts` への色集約は `styling-rules.md` に準拠し保守性が高い。
- セッションを明示的にスコープ外としつつ「共通基盤は波及考慮」とした判断は適切。`SideMenu` 命名規約（"サイドバー"不使用）も踏襲。
- 改善余地: 詳細セクションの ViewModel 化（要件 6.4 の思想）を**シナリオ詳細にも先取り**しておくと、後続のセッション詳細と設計が揃う。少なくとも「セクション配列（id/label/存在フラグ）」を `interface.ts` に定義し、目次とコンテンツで単一ソース化する設計を Step 6-1/6-2 に追記推奨。

### 6. プロジェクト整合性 OK

- ファイル配置（`_components/`, 同階層 `styles.ts`, `index.ts`）、Storybook 必須、`@phosphor-icons/react/ssr`、楽観的更新、nuqs、Result 型などの規約参照は CLAUDE.md / rules と整合。
- `useFilterDraft`（`@/components/blocks/FilterPanel`）/ `FilterBottomSheet` の流用前提は実コードで確認でき正確。
- 軽微: `ScenarioFilters` 新規作成時も `react-rules.md` の「1ファイル1コンポーネント」「`index.ts` エクスポート」を満たすこと（計画のファイル一覧に `ScenarioFilters/index.ts` が無い。`SideMenu` には有る）。

### 7. 実行可能性 WARN

- **Batch 粒度はおおむね良好**だが偏りがある:
  - Batch 6 が突出して重い: 新規3＋変更2＋既存セクション再利用＋目次（IntersectionObserver）＋フルページ整合＋アニメ＝**5 Step・実質ファイル 7+**。`plan-mode.md` の上限（8 Step / 15ファイル / 500行）内だが理想（2-5 Step / 3-8ファイル）を超える。**Step 6-1/6-2（パネル+目次）と Step 6-3/6-4（intercept 実描画+フルページ整合）で 2 Batch に分割**を推奨。
  - Batch 5 と Batch 6 は密結合（5 で仮 UI、6 で実描画）。`@detail/(.)[id]/page.tsx` がファイル一覧で「Batch 5/6」と跨いでおり、どちらでどこまで作るかの境界が曖昧。
- **Review Checkpoint のフォーマット差異**。スキル/テンプレートは `### Review Checkpoint: Batch N`（見出し）を期待するが、本計画は `### Review Checkpoint: Batch N` 見出し自体は存在する（OK）。ただし Batch 1/4 で「レビュースキップ可」としており、`plan-mode.md` の閾値（≤5ファイル かつ ≤100行）に**合致するかの行数見積もりが未記載**。Batch 4 はタグ cva + カード調整 + Storybook 更新で 100 行を超える可能性があり、スキップ可否を行数確定後に判断と明記すべき。
- **未確定事項への依存**。Batch 4 のタグ配色が「Pencil で確定」依存で、未確定ならスキップ＝計画が条件分岐。前提条件に書かれているが、**Batch 4 着手のブロッカー**として Review Checkpoint かタスク管理に紐付けると進行が安定する。
- 検証コマンド（`pnpm check` / `pnpm vitest run` / `pnpm build` / `pnpm exec playwright test e2e/scenarios`）は具体的で実行可能。`testing-patterns.md` の E2E ポート運用（3100）との整合も問題なし。

## 改善提案

### 必須（実装前に対処すべき）

| # | 視点 | 指摘事項 | 推奨対応 |
|---|------|---------|---------|
| 1 | 網羅性 | 既存 E2E（`search/detail/filter.spec.ts`）と Page Object（`scenarios-page.ts`, `scenario-detail-page.ts`）の破壊が計画に無い | 検証方法と Batch 3/5/6 の Review Checkpoint に「既存 E2E / POM 更新」を明示。`testing-patterns.md` のセレクタ鉄則・可視要素限定を適用 |
| 2 | 網羅性 | `(main)/layout.tsx` 変更が全メインページ（home/sessions/schedules/users/feedback/profile）に波及するが回帰確認が scenarios 偏重 | Batch 2 の手動テストに全7画面の余白・スクロール・GlobalHeader 非表示時の導線欠落チェックを追加。Step 2-3 を「全ページの横 padding 棚卸し」に拡張 |
| 3 | 技術的妥当性 | 詳細データ取得・認証・お気に入り Server Action が `[id]/page.tsx` にインライン定義（直列＋クロージャ）。intercept 側にコピーすると二重管理 | 共通取得関数（query）と Server Action（mutation）を抽出し両ルートで共有する手順を Batch 5/6 に追記 |
| 4 | 技術的妥当性 | 「一覧 state 保持」が現状の Client fetch + useState 実装で本当に保たれるか未検証 | Step 5-4 に「パネル表示後も検索結果・スクロール位置・もっと見る追加分・フィルターが保持される」確認を追加 |

### 推奨（対応が望ましい）

| # | 視点 | 指摘事項 | 推奨対応 |
|---|------|---------|---------|
| 1 | 実行可能性 | Batch 6 が過大（パネル+目次+intercept実描画+フルページ整合+アニメ） | 6A(パネル/目次)・6B(intercept実描画/フルページ整合) に分割。`@detail/(.)[id]/page.tsx` の Batch 帰属を一本化 |
| 2 | UX/a11y | 2ペイン開閉時のフォーカス管理が未記載 | パネル open 時のフォーカス移動・「一覧に戻る」時の発火元カードへの復帰を Step 6-1 に追記 |
| 3 | UX/a11y | 目次を「タブに見せない」具体マークアップが未定義 | `<nav aria-label>`・`aria-current="location"`・tablist/tab role 不使用を Step 6-2 に明記 |
| 4 | 保守性 | 目次とコンテンツのセクション定義が二重化しやすい | セクション配列（id/label/存在フラグ）を `interface.ts` で単一ソース化（要件 6.4 の ViewModel 思想を先取り） |
| 5 | プロジェクト整合性 | `ScenarioFilters/index.ts` がファイル一覧に欠落 | `index.ts` エクスポートと Storybook を追加（`SideMenu` と揃える） |
| 6 | 実行可能性 | Batch 1/4 の「レビュースキップ可」が行数未確定 | 各 Batch の変更行数を見積もり、`plan-mode.md` 閾値で可否を確定 |

### 検討（余裕があれば）

| # | 視点 | 指摘事項 | 推奨対応 |
|---|------|---------|---------|
| 1 | UX | `IntersectionObserver` の末尾セクション/少数セクション時のハイライト挙動 | rootMargin 調整・セクション0-1個時のフォールバックを実装メモに |
| 2 | 網羅性 | 段階リリースの可否 | Batch 1-4（トーン修正）のみ先行マージ可能か、Parallel Routes 部分を後続にできるかを検討材料として明記 |
| 3 | 技術的妥当性 | 直 URL/リロード時のフルページと 2ペインで詳細 UI を共通化する際の重複防止 | Step 6-4 の「共通セクション再利用」を具体コンポーネント単位で列挙 |

## 総合所見

要件・モックを鵜呑みにせず「不採用・読み替え」を明示した方針書ベースで、技術選定（Parallel + Intercepting Routes、ハイブリッドナビ、タブ禁止目次）はいずれも妥当。トークン先行・既存資産の再利用・Batch 間レビュー運用も `plan-mode.md` に忠実で、計画書としての完成度は高い。

実装前に潰すべきは「テスト破壊（E2E/POM）」「layout 変更の全画面波及」「詳細取得ロジックの二重管理回避」「一覧 state 保持の実証」の4点。いずれも追記・確認レベルで対処可能であり、根本的な設計変更は不要。Batch 6 の分割とフォーカス管理・目次 a11y の具体化を加えれば、A 相当の計画になる。
