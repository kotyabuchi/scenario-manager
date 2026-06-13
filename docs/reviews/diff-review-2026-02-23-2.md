# コード差分レビュー

> **反映ステータス**: 反映済み（2026-02-23）
> **反映内容**: 必須 7件 + 推奨 7件 + 検討 2件（全件対応）

> **レビュー日時**: 2026-02-23
> **対象範囲**: HEAD (2973aaa) からの未コミット変更（staged + unstaged + untracked）
> **変更ファイル数**: 44 files (+354/-1782 lines)
> **総合評価**: C
> **レビューモード**: パラレル（3エージェント）

## 変更サマリー

セッション募集フォーム（SessionForm）の大規模リファクタリング。コンポーネントを `_components/` フラット構造から `_components/sections/` のセクション別構造（BasicInfoSection, ParticipantsSection, ScenarioSelectSection, ScheduleSection）に再編成し、SessionForm.tsx を約330行から130行以下にスリム化。`FormProvider` + `useFormContext` パターンの導入により props バケツリレーを解消。actions.ts にスマートフィルタ（`applySmartFilters`）等のサーバーサイドロジックを追加。

### 変更ファイル

| ファイル | 追加 | 削除 | 種別 |
|----------|------|------|------|
| `.claude/requirements/requirements-session-flow.md` | +16 | -16 | 変更 |
| `package.json` | +1 | -1 | 変更 |
| `src/app/(main)/sessions/_components/UpcomingTab.tsx` | +6 | -5 | 変更 |
| `src/app/(main)/sessions/new/_components/MemberListItem.stories.tsx` | +0 | -58 | 削除 |
| `src/app/(main)/sessions/new/_components/MemberListItem.tsx` | +0 | -74 | 削除 |
| `src/app/(main)/sessions/new/_components/MemberSearchInput.stories.tsx` | +0 | -45 | 削除 |
| `src/app/(main)/sessions/new/_components/MemberSearchInput.test.tsx` | +0 | -154 | 削除 |
| `src/app/(main)/sessions/new/_components/MemberSearchInput.tsx` | +0 | -144 | 削除 |
| `src/app/(main)/sessions/new/_components/ScenarioSearchModal.stories.tsx` | +0 | -46 | 削除 |
| `src/app/(main)/sessions/new/_components/ScenarioSearchModal.test.tsx` | +0 | -174 | 削除 |
| `src/app/(main)/sessions/new/_components/ScenarioSearchModal.tsx` | +0 | -235 | 削除 |
| `src/app/(main)/sessions/new/_components/ScenarioSelectedCard.stories.tsx` | +0 | -79 | 削除 |
| `src/app/(main)/sessions/new/_components/ScenarioSelectedCard.tsx` | +0 | -82 | 削除 |
| `src/app/(main)/sessions/new/_components/SessionForm.stories.tsx` | +6 | -0 | 変更 |
| `src/app/(main)/sessions/new/_components/SessionForm.test.tsx` | +5 | -5 | 変更 |
| `src/app/(main)/sessions/new/_components/SessionForm.tsx` | +42 | -339 | 変更 |
| `src/app/(main)/sessions/new/_components/memberStyles.ts` | +0 | -124 | 削除 |
| `src/app/(main)/sessions/new/_components/scenarioCardStyles.ts` | +0 | -74 | 削除 |
| `src/app/(main)/sessions/new/_components/scenarioSearchStyles.ts` | +0 | -97 | 削除 |
| `src/app/(main)/sessions/new/_components/styles.ts` | +54 | -12 | 変更 |
| `src/app/(main)/sessions/new/actions.ts` | +172 | -3 | 変更 |
| `src/app/(main)/sessions/new/schema.ts` | +1 | -1 | 変更 |
| `src/components/elements/button/button.tsx` | +16 | -6 | 変更 |
| `src/components/elements/modal/modal.tsx` | +2 | -2 | 変更 |
| `src/components/elements/modal/styles.ts` | +28 | -9 | 変更 |
| `src/styles/tokens/zIndex.ts` | +1 | -1 | 変更 |
| `sections/basic-info/BasicInfoSection.tsx` | 新規 | - | 新規 |
| `sections/participants/MemberListItem.stories.tsx` | 新規 | - | 新規 |
| `sections/participants/MemberListItem.tsx` | 新規 | - | 新規 |
| `sections/participants/MemberSearchInput.stories.tsx` | 新規 | - | 新規 |
| `sections/participants/MemberSearchInput.test.tsx` | 新規 | - | 新規 |
| `sections/participants/MemberSearchInput.tsx` | 新規 | - | 新規 |
| `sections/participants/ParticipantsSection.tsx` | 新規 | - | 新規 |
| `sections/participants/memberStyles.ts` | 新規 | - | 新規 |
| `sections/scenario/ScenarioSearchModal.stories.tsx` | 新規 | - | 新規 |
| `sections/scenario/ScenarioSearchModal.test.tsx` | 新規 | - | 新規 |
| `sections/scenario/ScenarioSearchModal.tsx` | 新規 | - | 新規 |
| `sections/scenario/ScenarioSelectSection.tsx` | 新規 | - | 新規 |
| `sections/scenario/ScenarioSelectedCard.stories.tsx` | 新規 | - | 新規 |
| `sections/scenario/ScenarioSelectedCard.tsx` | 新規 | - | 新規 |
| `sections/scenario/scenarioCardStyles.ts` | 新規 | - | 新規 |
| `sections/scenario/scenarioSearchStyles.ts` | 新規 | - | 新規 |
| `sections/schedule/ScheduleSection.tsx` | 新規 | - | 新規 |

## 評価詳細

### 1. コーディング規約準拠 WARN

全体的に規約準拠度は高いが、`ScenarioSelectSection.tsx` でアイコンのインポートパスが `@phosphor-icons/react/dist/ssr`（内部パス）になっている点が `icons.md` の規約違反。同ファイルで Props 型に `interface` を使用している点も `typescript-rules.md` の `type` 優先規約に反する。`package.json` の `check` スクリプト名変更が `CLAUDE.md` と乖離。

### 2. 設計・保守性 OK

`SessionForm.tsx` のスリム化と `sections/` ディレクトリによる機能別分離は単一責任原則に沿った優れた設計。`FormProvider` + `useFormContext` パターンにより props バケツリレーを解消。`Result` 型パターン・`isNil` の使用も適切。1ファイル1コンポーネント原則も遵守。軽微な型重複（`participantType` リテラルユニオン）のみ指摘。

### 3. セキュリティ WARN

主要 Server Action はすべて `auth.getUser()` 認証 + Zod バリデーションを実施しており堅牢。ただし `getSystemsAction` のみ認証チェックがなく、他の Action との一貫性が欠ける。ILIKE エスケープ、ULID パターン検証等の防御実装は適切。

### 4. パフォーマンス WARN

N+1 クエリは発見されず、Supabase クエリ効率は良好。ただし `ScenarioSearchModal`（446行）がスタティックインポートで常にバンドルに含まれる点、モーダル初回表示時に debounce 経由で 500ms の遅延が発生する点が改善余地。

### 5. UX・アクセシビリティ NG

`MemberSearchInput` のドロップダウンで複数の WCAG 違反を確認。`<button role="option">` の無効な ARIA パターン、`aria-selected` の固定値、キーボードナビゲーション未実装（ArrowUp/ArrowDown）。モーダル閉じるボタンのフォーカスリング未定義、`ScheduleSection` の日時入力に可視ラベル欠如も問題。

### 6. バグ・ロジックエラー WARN

`ScenarioSearchModal.tsx` の `onDoubleClick` ハンドラでステールクロージャの問題があり、ダブルクリックによるシナリオ確定が機能しない（required）。`createSessionAndRedirect` のサイレントフェイルも懸念。その他のロジック（`applySmartFilters`、`useFieldArray` 同期、スキーマバリデーション）は正しく実装されている。

## 指摘一覧

### 必須（マージ前に修正すべき）

| # | 観点 | ファイル:行 | 指摘事項 | 推奨対応 |
|---|------|------------|---------|---------|
| 1 | バグ・ロジックエラー | `sections/scenario/ScenarioSearchModal.tsx:393-396` | `onDoubleClick` で `setSelectedId()` 直後に `handleConfirm()` を呼ぶが、React の state 更新は非同期のため `handleConfirm` 内の `selectedId` は更新前の値を参照。ダブルクリック確定が機能しない。 | state を介さず `onDoubleClick={() => { onSelect(scenario); handleClose(); }}` のように直接 `onSelect` を呼び出す |
| 2 | コーディング規約準拠 / パフォーマンス | `sections/scenario/ScenarioSelectSection.tsx:3-5` | `@phosphor-icons/react/dist/ssr`（内部パス）を使用。`icons.md` では `@phosphor-icons/react/ssr` が必須。将来のパッケージ更新で動作しなくなるリスクあり。 | `from '@phosphor-icons/react/ssr'` に修正 |
| 3 | UX・アクセシビリティ | `src/components/elements/modal/styles.ts:71` | モーダル閉じるボタン(`closeButton`)に `_focusVisible` スタイルが未定義。WCAG 2.4.7「フォーカスの可視化」違反。 | `_focusVisible: { outline: 'focusRing' }` を追加 |
| 4 | UX・アクセシビリティ | `sections/participants/MemberSearchInput.tsx:88` | コンボボックスドロップダウンに ArrowUp/ArrowDown キーナビゲーションが未実装。WCAG 2.1.1「キーボード操作」違反。 | `onKeyDown` ハンドラで ArrowDown/ArrowUp/Enter/Escape キーによる候補ナビゲーションを実装 |
| 5 | UX・アクセシビリティ | `sections/participants/MemberSearchInput.tsx:125` | `<button role="option">` は無効な ARIA パターン。WCAG 4.1.2 違反。 | Ark UI の `Combobox` を使用するか `<li role="option" tabIndex={0}>` に変更 |
| 6 | UX・アクセシビリティ | `sections/participants/MemberSearchInput.tsx:129` | `aria-selected={false}` がすべての候補に固定。選択状態がスクリーンリーダーに伝わらない。WCAG 4.1.2 違反。 | フォーカス中の項目に `aria-selected={true}` を設定し、キーボードナビゲーション状態と連動 |
| 7 | UX・アクセシビリティ | `sections/schedule/ScheduleSection.tsx:63` | `scheduleType === 'specify'` 時の日時入力に `<label>` 要素がなく可視ラベル欠如。WCAG 1.3.1 違反。 | `<FormField id="scheduledAt" label="開催日時">` でラップ |

### 推奨（対応が望ましい）

| # | 観点 | ファイル:行 | 指摘事項 | 推奨対応 |
|---|------|------------|---------|---------|
| 8 | セキュリティ | `src/app/(main)/sessions/new/actions.ts:365-378` | `getSystemsAction` に認証チェックがなく、他の全 Server Action との一貫性が欠ける。 | 意図的に公開なら JSDoc で明記。認証要なら `auth.getUser()` を追加。 |
| 9 | バグ・ロジックエラー | `src/app/(main)/sessions/new/actions.ts:90-100` | `createSessionAndRedirect` はエラー時にサイレントフェイル。エラーが呼び出し元に伝播されない。 | シグネチャを `Promise<Result<void>>` に変更するか、エラー握りつぶしの設計意図を文書化 |
| 10 | コーディング規約準拠 | `sections/scenario/ScenarioSelectSection.tsx:18` | Props 型に `interface` を使用。`typescript-rules.md` では `type` が規定。 | `type ScenarioSelectSectionProps = { ... }` に変更 |
| 11 | コーディング規約準拠 | `package.json:18` | `check` スクリプトが `biome:check` に変更。`CLAUDE.md` の記述と乖離。 | `check` に戻すか、`CLAUDE.md` を更新 |
| 12 | パフォーマンス | `sections/scenario/ScenarioSearchModal.tsx:1` | 446 行の大型コンポーネントが常にバンドルに含まれる。 | `next/dynamic` で `{ ssr: false }` を使い遅延ロード |
| 13 | UX・アクセシビリティ | `sections/participants/MemberSearchInput.tsx:107` | 検索中のローディング状態がスクリーンリーダーに通知されない。 | `aria-busy={isPending}` を付与するか、`<span role="status" aria-live="polite">` を追加 |
| 14 | パフォーマンス | `sections/scenario/ScenarioSearchModal.tsx:148` | 初回表示時も debounce(500ms) 経由で結果取得。ユーザーに遅延が認知される。 | 初回ロードは debounce をスキップ |

### 検討（余裕があれば）

| # | 観点 | ファイル:行 | 指摘事項 | 推奨対応 |
|---|------|------------|---------|---------|
| 15 | 設計・保守性 | `src/app/(main)/sessions/new/actions.ts:147-159` | `participantType` リテラルユニオンが複数箇所でインライン定義。型の重複管理。 | `schema.ts` から `z.infer` で導出するか `interface.ts` に共通型を定義 |
| 16 | UX・アクセシビリティ | `sections/basic-info/BasicInfoSection.tsx:55` | `aria-live="polite"` の文字カウンターがキーストロークごとに読み上げられ冗長になる可能性。 | debounce 処理を検討、または `aria-live` を外してツールチップで補足 |

## 良い点

- `SessionForm.tsx` が約330行から130行以下にスリム化され、可読性が大幅に向上
- `FormProvider` + `useFormContext` による props バケツリレー解消で保守性の高い設計
- `sections/` ディレクトリでスタイルファイルがコンポーネントと同階層に配置され、`styling-rules.md` に準拠
- `applySmartFilters` が独立関数に分離され、N+1 を回避した単一バッチクエリで実装
- `actions.ts` で `Result` 型・`isNil`・`ok`/`err` ヘルパーが一貫して使用され、`error-handling.md` に完全準拠
- `searchUsersAction` の 2 文字未満クエリ即時空返し（列挙攻撃対策）と ILIKE エスケープが適切
- `scenarioId` に ULID パターンの Zod バリデーションが適用され、不正 ID を防御
- `ScenarioSearchModal` で ArrowUp/ArrowDown/Enter のキーボードナビゲーションが正しく実装
- スマートフィルタチップが `aria-pressed` で状態をスクリーンリーダーに伝達
- `MemberListItem` の削除ボタンが `aria-label="${user.nickname}を削除"` で個別識別可能
- `schema.ts` での `z.input` / `z.infer` 使い分けが Single Source of Truth 原則に適切に準拠
- `Modal` コンポーネントの `size` prop が `cva` バリアント拡張で実装され、スタイル管理が一元化

## 総合所見

リファクタリングの設計方針は優れており、`SessionForm` の分割と `FormProvider` パターンの導入は保守性を大幅に向上させている。Server Action のセキュリティ実装やエラーハンドリングも概ね堅牢。

ただし、**MemberSearchInput のアクセシビリティ**が最大の課題。キーボードナビゲーション未実装と無効な ARIA パターンは WCAG 2.1 AA の複数項目に違反しており、マージ前に修正が必要。Ark UI の `Combobox` コンポーネントを活用すればこれらの問題を一括で解決できる。

また、`ScenarioSearchModal` の `onDoubleClick` のステールクロージャバグは確実に修正すべき。
