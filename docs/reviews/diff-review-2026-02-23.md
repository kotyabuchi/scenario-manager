# コード差分レビュー

> **レビュー日時**: 2026-02-23
> **対象範囲**: HEAD からの未コミット変更（staged + unstaged + untracked）
> **変更ファイル数**: 49 files (+436/-1836 lines)
> **総合評価**: D
> **レビューモード**: パラレル（3エージェント）

## 変更サマリー

セッション募集フォーム（SessionForm）を大規模リファクタリングし、フォームをセクション単位（BasicInfoSection, ParticipantsSection, ScenarioSelectSection, ScheduleSection）に分割。`_components/sections/` ディレクトリへ再配置し、`FormProvider` + `useFormContext` パターンでコンテキストを共有。toggle-group, button, modal の共通コンポーネント改善と、`actions.ts` への新規 Server Actions 追加も含む。

### 変更ファイル

| ファイル | 追加 | 削除 | 種別 |
|----------|------|------|------|
| `.claude/requirements/requirements-session-flow.md` | +16 | -16 | 変更 |
| `package.json` | +1 | -1 | 変更 |
| `src/app/(main)/sessions/_components/UpcomingTab.tsx` | +6 | -5 | 変更 |
| `src/app/(main)/sessions/new/_components/SessionForm.tsx` | +30 | -351 | 変更 |
| `src/app/(main)/sessions/new/_components/SessionForm.test.tsx` | +5 | -5 | 変更 |
| `src/app/(main)/sessions/new/_components/SessionForm.stories.tsx` | +6 | +0 | 変更 |
| `src/app/(main)/sessions/new/_components/styles.ts` | +50 | -16 | 変更 |
| `src/app/(main)/sessions/new/actions.ts` | +165 | -10 | 変更 |
| `src/app/(main)/sessions/new/schema.ts` | +1 | -1 | 変更 |
| `src/components/elements/button/button.tsx` | +14 | -8 | 変更 |
| `src/components/elements/modal/modal.tsx` | +2 | -2 | 変更 |
| `src/components/elements/modal/styles.ts` | +21 | -16 | 変更 |
| `src/components/elements/toggle-group/*` | +68 | -68 | 変更 |
| `src/styles/tokens/zIndex.ts` | +1 | -1 | 変更 |
| `src/.../sections/basic-info/BasicInfoSection.tsx` | 新規 | - | 新規 |
| `src/.../sections/participants/*.tsx` | 新規 | - | 新規 |
| `src/.../sections/scenario/*.tsx` | 新規 | - | 新規 |
| `src/.../sections/schedule/ScheduleSection.tsx` | 新規 | - | 新規 |
| `src/.../new/_components/MemberListItem.tsx` 等7ファイル | - | 全削除 | 削除 |
| `AGENTS.md` | 新規 | - | 新規 |

## 評価詳細

### 1. コーディング規約準拠 WARN

全体的に命名規則、import順序、スタイル分離、Result型パターンなどは適切に適用されている。ただし `@phosphor-icons/react/dist/ssr` の誤ったimportパス（正しくは `@phosphor-icons/react/ssr`）、toggle-groupスタイルのハードコードされたboxShadow値、`interface` の使用（`type` を使うべき）が確認された。

### 2. 設計・保守性 WARN

セクション分割の設計方針は正しく、FormProvider + useFormContext による props バケツリレー回避も適切。ただし `formatPlayerCount`/`formatPlaytime` の2ファイル重複定義、セクションコンポーネントの `'use client'` ディレクティブ欠如、リファクタリング後の未使用スタイル残留が確認された。

### 3. セキュリティ WARN

主要 Server Action は認証チェック + Zod バリデーション + Supabase クライアント経由のクエリで安全性を確保。LIKE クエリのワイルドカードエスケープも実装済み。ただし `getSystemsAction` のみ認証チェックが欠如しており、他アクションとの一貫性に問題がある。

### 4. パフォーマンス WARN

DB クエリは N+1 問題なく効率的。デバウンスも適切に実装。ただし `excludeUserIds` の毎レンダリング新規配列生成、`onOpenChange` のメモ化不足など、不要な再レンダリングのリスクが確認された。

### 5. UX・アクセシビリティ WARN

ARIA 属性、キーボードナビゲーション、`aria-live` によるスクリーンリーダー通知など、多くのアクセシビリティ対応が実装されている。ただし toggle-group と modal の閉じるボタンにフォーカスリング（`_focusVisible`）が未定義で WCAG 2.4.7 違反。

### 6. バグ・ロジックエラー WARN

全体的にエッジケースのガード処理は適切。ただし `SCENARIO_ID_REGEX` の `/i` フラグによる大文字小文字不整合、toggle-group の single mode での `undefined as string` リスク、`setValue` での null/undefined 不整合が確認された。

## 指摘一覧

### 必須（マージ前に修正すべき）

| # | 観点 | ファイル:行 | 指摘事項 | 推奨対応 |
|---|------|------------|---------|---------|
| 1 | コーディング規約準拠 / UX・アクセシビリティ | `sections/scenario/ScenarioSelectSection.tsx:3-5` | `@phosphor-icons/react/dist/ssr` からインポートしている。正しいパスは `@phosphor-icons/react/ssr`。パッケージ内部パスへの直接参照は破損リスクあり | `from '@phosphor-icons/react/ssr'` に変更 |
| 2 | コーディング規約準拠 | `src/components/elements/toggle-group/styles.ts:35` | `boxShadow: '[0 1px 2px rgba(0, 0, 0, 0.05)]'` がハードコード。`semanticTokens.ts` にトークン定義が必須 | セマンティックトークン（例: `shadow.toggleItem`）を定義し参照する |
| 3 | UX・アクセシビリティ | `src/components/elements/toggle-group/styles.ts:18` | `toggleGroupItem` に `_focusVisible` が未定義。WCAG 2.4.7 Focus Visible 違反 | `_focusVisible: { outline: 'focusRing' }` を追加 |
| 4 | UX・アクセシビリティ | `src/components/elements/modal/styles.ts:71` | `closeButton` に `_focusVisible` スタイルが未定義。キーボード操作時にフォーカスリングが表示されない | `_focusVisible: { outline: 'focusRing' }` を追加 |

### 推奨（対応が望ましい）

| # | 観点 | ファイル:行 | 指摘事項 | 推奨対応 |
|---|------|------------|---------|---------|
| 5 | バグ・ロジックエラー | `sections/scenario/ScenarioSearchModal.tsx:39` | `SCENARIO_ID_REGEX` の `/i` フラグで小文字ULIDを抽出可能だが、サーバー側 `ulidPattern` は大文字のみ。小文字ID入力時にシナリオ選択が無視される | `/i` フラグを除去するか、抽出後に `.toUpperCase()` で正規化 |
| 6 | バグ・ロジックエラー | `src/components/elements/toggle-group/toggle-group.tsx:78` | single mode で `details.value[0] as string` 使用。全選択解除時に `undefined as string` となり不正な型が伝播する | `details.value[0] ?? ''` またはガード処理を追加 |
| 7 | バグ・ロジックエラー | `src/app/(main)/sessions/new/_components/SessionForm.tsx:65` | `setValue('scenarioId', scenario?.scenarioId)` で `scenario` が null 時に undefined をセット。defaultValues の null と不整合 | `setValue('scenarioId', scenario?.scenarioId ?? null)` に変更 |
| 8 | 設計・保守性 / パフォーマンス | `BasicInfoSection.tsx:1`, `ParticipantsSection.tsx:1`, `ScheduleSection.tsx:1`, `ScenarioSelectSection.tsx:1` | Client Component のフック使用しているが `'use client'` ディレクティブがない。ツリーシェイキングの意図が不明瞭 | 各ファイル先頭に `'use client'` を追加 |
| 9 | コーディング規約準拠 | `sections/scenario/ScenarioSelectSection.tsx:18` | `interface` を使用している。TypeScriptルールでは継承不要な場合は `type` を使用 | `type ScenarioSelectSectionProps = { ... }` に変更 |
| 10 | 設計・保守性 | `ScenarioSearchModal.tsx:43-60`, `ScenarioSelectedCard.tsx:18-35` | `formatPlayerCount` と `formatPlaytime` が2ファイルに重複定義 | `sections/scenario/` 配下にユーティリティファイルを作成し共通化 |
| 11 | 設計・保守性 | `src/app/(main)/sessions/new/_components/styles.ts:88-170` | リファクタリング後に未使用スタイル定義が残留している可能性 | 各スタイルの使用状況を確認し、未使用は削除 |
| 12 | セキュリティ | `src/app/(main)/sessions/new/actions.ts:365` | `getSystemsAction` に認証チェックが欠如。他の全アクションと一貫性がない | 認証チェックを追加するか、意図的な公開APIならJSDocに明記 |
| 13 | パフォーマンス | `sections/participants/ParticipantsSection.tsx:56` | `excludeUserIds={fields.map((f) => f.userId)}` が毎レンダリング新配列を生成し、`handleSearch` の useCallback を毎回無効化 | `useMemo` でメモ化して渡す |
| 14 | UX・アクセシビリティ | `sections/scenario/ScenarioSearchModal.tsx:268` | ID/URLクリアボタンが `isIdMode=false` 時も表示されるが何もしない。非活性の視覚フィードバックなし | `isIdMode` に応じて `disabled` または条件表示にする |
| 15 | UX・アクセシビリティ | `sections/participants/MemberSearchInput.tsx:129` | `aria-selected={false}` がハードコード。`role="option"` のセマンティクスと乖離 | `role="menuitem"` に変更するか、Ark UI Combobox に移行 |
| 16 | パフォーマンス | `sections/scenario/ScenarioSearchModal.tsx:249` | `onOpenChange` prop に毎レンダリング新アロー関数が渡される | `useCallback` でメモ化 |

### 検討（余裕があれば）

| # | 観点 | ファイル:行 | 指摘事項 | 推奨対応 |
|---|------|------------|---------|---------|
| 17 | セキュリティ | `src/app/(main)/sessions/new/actions.ts:90` | `createSessionAndRedirect` がエラー時にサイレントフェイル。返り値 `void` でエラーが失われる | `Result<void>` を返すか、throw でエラーバウンダリに委譲 |
| 18 | コーディング規約準拠 | `src/components/elements/toggle-group/index.ts:3-5` | `MultipleToggleGroupProps` を `ToggleGroupProps` としてre-export。シングル用の型が公開されない | 両方の型を正確な名前でエクスポート |
| 19 | 設計・保守性 | `src/app/(main)/sessions/new/actions.ts:229-354` | `applySmartFilters` が非エクスポートで単体テスト困難 | ドメインロジックとして別ファイルに分離 |
| 20 | 設計・保守性 | `src/app/(main)/sessions/_components/UpcomingTab.tsx:51` | `currentView` が `useState` で管理。ページ更新で状態喪失 | `nuqs` でURL同期を検討 |
| 21 | UX・アクセシビリティ | `sections/schedule/ScheduleSection.tsx:45` | `scheduleType` 等の FormField に `id` prop なし。ラベルと入力の関連付けが不完全になりうる | FormField 実装を確認し、必要なら `id` を追加 |

## 良い点

- `sessionFormSchema` で `z.input` と `z.infer` を正しく使い分け、フォーム入力型とパース後の型を明確に分離している
- `actions.ts` で Result型パターン（`ok`/`err`）と `isNil` が一貫して使用されている
- `FormProvider` + `useFormContext` による props バケツリレー回避の設計が適切
- `MemberSearchInput` で `role="combobox"`, `aria-expanded`, `aria-controls` 等の ARIA パターンが正しく実装されている
- `ScenarioSearchModal` でキーボードナビゲーション（↑↓Enter）が適切に実装されている
- `searchUsersAction` で LIKE クエリのワイルドカードエスケープ処理が実装されている
- `applySmartFilters` で `user_scenario_preferences` を `.in()` で一括取得し N+1 問題を回避
- Supabase クライアント経由の全クエリで SQL インジェクションリスクが根本的に低い
- フィルタチップに `aria-pressed`、文字数カウンターに `aria-live="polite"` が設定されている
- デバウンス（300ms/500ms）と最小入力文字数による適切な API リクエスト制限
- `preferenceUserIds` を Set で重複排除してからクエリ実行
- アイコンに `aria-hidden="true"` が一貫して設定されている
- セクション分割により各ファイルの責務が明確化され保守性が向上

## 総合所見

セッション募集フォームのセクション分割リファクタリングは設計方針として正しく、コード品質も全体的に高い。特に ARIA 属性やキーボードナビゲーションなどアクセシビリティへの配慮が丁寧に実装されている点は評価できる。

ただし、**必須指摘が4件**あり（フォーカスリング未定義×2、アイコンimportパス誤り、ハードコードされた影の値）、いずれもWCAG準拠やプロジェクト規約に直接関わるため、マージ前に修正が必要。いずれも修正は小規模（各1-3行程度）で、コードの根本設計に影響しない。

推奨指摘では、`SCENARIO_ID_REGEX` の大文字小文字不整合によるシナリオ選択バグのリスク（#5）と、`toggle-group` の全選択解除時の型安全性問題（#6）が特に重要度が高い。
