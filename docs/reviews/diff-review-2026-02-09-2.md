# コード差分レビュー

> **反映ステータス**: 反映済み（2026-02-09）
> **反映内容**: 必須 0件 + 推奨 1件 + 検討 2件（検討3はスキップ）

> **レビュー日時**: 2026-02-09
> **対象範囲**: HEAD (`b0955cf`) からの未コミット変更（staged + unstaged + untracked）
> **変更ファイル数**: 82 files（うち.agents/削除51ファイル）
> **総合評価**: B

## 変更サマリー

大きく3つの改善が含まれる変更: (1) SystemMessage の Alert コンポーネント統合と Jotai ストアのリファクタリング（`error` → `danger` レベル統一、個別atom → 統合dispatch atom）、(2) シナリオ検索UIの改善（スケルトン表示、サイドバーレイアウト修正、不要UIの削除、ページネーション安定性向上）、(3) `.agents/` ディレクトリの一括削除と DevTools コンポーネントの分離。

### 変更ファイル

| ファイル | 追加 | 削除 | 種別 |
|----------|------|------|------|
| `.agents/fleet/**` (17 files) | +0 | -1470 | 削除 |
| `.agents/skills/**` (34 files) | +0 | -1555 | 削除 |
| `src/store/systemMessage.ts` | +35 | -33 | 変更 |
| `src/hooks/useSystemMessage.ts` | +22 | -40 | 変更 |
| `src/components/blocks/SystemMessage/SystemMessage.tsx` | +10 | -35 | 変更 |
| `src/components/blocks/SystemMessage/styles.ts` | +0 | -67 | 変更 |
| `src/components/blocks/SystemMessage/SystemMessage.stories.tsx` | +151 | +0 | 新規 |
| `src/components/elements/alert/alert.tsx` | +10 | -5 | 変更 |
| `src/styles/recipes/alert.ts` | +5 | -6 | 変更 |
| `src/components/elements/alert/alert.stories.tsx` | +2 | -2 | 変更 |
| `src/app/(main)/scenarios/_components/ScenariosContent.tsx` | +3 | -14 | 変更 |
| `src/app/(main)/scenarios/_components/styles.ts` | +3 | -33 | 変更 |
| `src/app/(main)/scenarios/_components/SearchSidebar/SearchSidebar.tsx` | +12 | -12 | 変更 |
| `src/app/(main)/scenarios/_components/SearchSidebar/styles.ts` | +17 | -8 | 変更 |
| `src/app/(main)/scenarios/_components/SearchTopBar/styles.ts` | +1 | -1 | 変更 |
| `src/app/(main)/scenarios/_components/ScenarioList.tsx` | +2 | -5 | 変更 |
| `src/app/(main)/scenarios/_components/ScenarioCardSkeleton.tsx` | +56 | +0 | 新規 |
| `src/app/(main)/scenarios/adapter.ts` | +2 | -1 | 変更 |
| `src/components/blocks/FilterBottomSheet/FilterBottomSheet.tsx` | +1 | -14 | 変更 |
| `src/components/blocks/FilterBottomSheet/styles.ts` | +2 | -2 | 変更 |
| `src/components/blocks/FilterPanel/FilterPanel.tsx` | +2 | -10 | 変更 |
| `src/components/blocks/FilterPanel/styles.ts` | +1 | -1 | 変更 |
| `src/app/(main)/_components/SignupModalWrapper.tsx` | +5 | -5 | 変更 |
| `src/app/(main)/scenarios/new/_components/ScenarioForm.tsx` | +8 | -5 | 変更 |
| `src/app/(main)/sessions/new/_components/SessionFormContainer.tsx` | +3 | -3 | 変更 |
| `src/hooks/useDiscordAuth.ts` | +8 | -8 | 変更 |
| `src/app/layout.tsx` | +2 | +0 | 変更 |
| `src/app/_components/DevTools.tsx` | +13 | +0 | 新規 |
| `package.json` | +1 | +0 | 変更 |

## 評価詳細

### 1. コーディング規約準拠 OK

- 命名規則、Import順序は適切
- スタイル定義は `styles.ts` に分離されている
- `any` や `!` の不正使用なし
- PandaCSS トークン使用（`zIndex: 'overlay'`, `zIndex: 'modal'`）に統一 — 良い改善
- `export const` パターンを正しく使用

### 2. 設計・保守性 WARN

- **SystemMessage リファクタリングは適切**: 個別の atom（add/remove/clear）を統合 dispatch パターンに変更し、`useSystemMessage` フックの API も簡潔になった
- **`error` → `danger` の命名統一**: Alert コンポーネントの `AlertStatus` と一致させた良い判断
- **ただし**: `useSystemMessage` が `messages`（読み取り）と操作（書き込み）を同一フックで返すため、`messages` を必要としない呼び出し元（`SignupModalWrapper`, `ScenarioForm`, `SessionFormContainer`, `useDiscordAuth`）でも `systemMessagesAtom` を購読してしまう。これらのコンポーネントはメッセージ変更のたびに不要な再レンダリングが発生する可能性がある

### 3. セキュリティ OK

- 入力バリデーションに変更なし
- 機密情報のハードコードなし
- DevTools コンポーネントは `process.env.NODE_ENV !== 'development'` で適切にガード

### 4. パフォーマンス WARN

- **不要な再レンダリング**: 上記 2. で指摘した通り、`useSystemMessage` フック内で `useAtomValue(systemMessagesAtom)` を呼び出すため、メッセージを追加するだけのコンポーネント（書き込み専用）でもメッセージ状態の変更に反応して再レンダリングされる
- **スケルトン20個の固定レンダリング**: `SKELETON_COUNT = 20` は妥当だが、実際の limit と合わせるか定数共有が望ましい
- **ページネーション安定性向上**: `adapter.ts` に `scenario_id` をタイブレーカーとして追加。ソート順の安定性が保証されるようになった — 良い改善

### 5. UX・アクセシビリティ OK

- スケルトンに `role="status"`, `aria-busy="true"`, `aria-label="検索中"` を適切に設定
- スケルトン内の個別要素に `aria-hidden="true"` を設定
- サイドバーの `aria-label`, `aria-expanded` は適切
- Alert コンポーネントの `role="alert"`, `aria-live="polite"` は適切
- FilterBottomSheet の z-index がセマンティックトークンに統一された

### 6. バグ・ロジックエラー WARN

- **`buildApiQueryString` の空クエリ処理**: パラメータが一つもない場合 `?` のみが返される（`return \`?\${qs}\``）。空文字の場合は `?` なしか、フィルタなし専用の処理がベター。ただし現状 `&limit=20&offset=0` が後置されるため実害はない
- **`setOffset(0)` の位置変更**: useEffect 内で `setOffset(0)` を fetchResults の前に移動。React の state バッチ処理により、setOffset と setSearchResult が同一レンダーサイクルで処理されるが、fetchResults 内のクエリは `offset=0` をハードコードしているため実害なし

## 指摘一覧

### 必須（マージ前に修正すべき）

なし

### 推奨（対応が望ましい）

| # | 観点 | ファイル:行 | 指摘事項 | 推奨対応 |
|---|------|------------|---------|---------|
| 1 | パフォーマンス | `src/hooks/useSystemMessage.ts:14` | `useAtomValue(systemMessagesAtom)` がすべての呼び出し元でメッセージ状態を購読する。書き込み専用のコンポーネント（5箇所）で不要な再レンダリングが発生 | メッセージ読み取り用フック（`useSystemMessages`）と操作用フック（`useSystemMessageActions`）を分離するか、呼び出し元で必要に応じて使い分けられるようにする |

### 検討（余裕があれば）

| # | 観点 | ファイル:行 | 指摘事項 | 推奨対応 |
|---|------|------------|---------|---------|
| 1 | 設計 | `src/app/(main)/scenarios/_components/ScenariosContent.tsx:93` | `buildApiQueryString` がパラメータ空の場合 `?` のみを返す | `qs === '' ? '' : \`?\${qs}\`` のようにして、URL の美観を保つ（現状は後置パラメータがあるため実害なし） |
| 2 | 保守性 | `src/app/(main)/scenarios/_components/ScenarioCardSkeleton.tsx:38` | `SKELETON_COUNT = 20` がコンポーネント内でハードコード。検索 limit との関連が暗黙的 | 検索 limit と定数を共有するか、コメントで関連を明記 |
| 3 | 規約 | `src/components/elements/alert/alert.stories.tsx:41` | `console.log('close')` がストーリーに残っている | `fn()` (Storybook の action) に置き換えるか、削除 |

## 良い点

- **SystemMessage → Alert 統合**: 独自実装のメッセージ表示を共通 Alert コンポーネントに統一し、コード重複を大幅に削減
- **Jotai ストアの統合 dispatch パターン**: 3つの書き込み atom を 1つの `SystemMessageAction` 型で統合し、型安全な dispatch パターンを実現
- **`error` → `danger` の命名一貫性**: Alert コンポーネントの `AlertStatus` 型と完全に一致させることで、レイヤー間の型マッピングが不要に
- **ページネーション安定性**: `scenario_id` をタイブレーカーに追加し、同一 `created_at` での順序不安定問題を解消
- **z-index のセマンティックトークン化**: ハードコード値（`[40]`, `[50]`）をトークン（`overlay`, `modal`）に統一
- **スケルトンローディング**: テキストベースの「読み込み中...」から視覚的なスケルトンUIに改善、UX向上
- **不要コードの削除**: `.agents/` ディレクトリ（3,025行）、ローディングオーバーレイ、重複フィルターボタンの整理

## 総合所見

全体的にコード品質を向上させる良いリファクタリング。SystemMessage の Alert 統合と Jotai ストアの簡素化は設計品質を高めている。検索UIの改善（スケルトン、ページネーション安定性、z-index 統一）も適切。主要な懸念点は `useSystemMessage` フックの読み書き一体化による不要な再レンダリングだが、現時点ではパフォーマンス上の実害は限定的と思われる。必須の修正なしでマージ可能だが、推奨事項のフック分離は将来の保守性のために検討を推奨する。
