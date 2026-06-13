# コード差分レビュー

> **反映ステータス**: 反映済み（2026-02-23）
> **反映内容**: 必須 3件 + 推奨 8件 + 検討 5件（うち getSystemsAction 削除1件を含む）

> **レビュー日時**: 2026-02-23
> **対象範囲**: HEAD からの未コミット変更（staged + unstaged + untracked）
> **変更ファイル数**: 43 files (+368/-1781 lines)
> **総合評価**: D
> **レビューモード**: パラレル（3エージェント）

## 変更サマリー

セッション作成フォーム（`SessionForm`）を大規模リファクタリング。フォームをセクション単位（BasicInfo / Participants / Scenario / Schedule）に分離し、`FormProvider` + `useFormContext` パターンを導入。シナリオ検索モーダルにスマートフィルタ機能（PLが未プレイ、GMが回せる、メンバーが保有）を追加。共通コンポーネント（Button, Modal）に prefix/suffix, size バリアントを拡張。

### 変更ファイル

| ファイル | 追加 | 削除 | 種別 |
|----------|------|------|------|
| `.claude/requirements/requirements-session-flow.md` | +16 | -16 | 変更 |
| `src/app/(main)/sessions/_components/UpcomingTab.tsx` | +1 | -3 | 変更 |
| `src/app/(main)/sessions/new/_components/MemberListItem.stories.tsx` | - | -58 | 削除 |
| `src/app/(main)/sessions/new/_components/MemberListItem.tsx` | - | -74 | 削除 |
| `src/app/(main)/sessions/new/_components/MemberSearchInput.stories.tsx` | - | -45 | 削除 |
| `src/app/(main)/sessions/new/_components/MemberSearchInput.test.tsx` | - | -154 | 削除 |
| `src/app/(main)/sessions/new/_components/MemberSearchInput.tsx` | - | -144 | 削除 |
| `src/app/(main)/sessions/new/_components/ScenarioSearchModal.stories.tsx` | - | -46 | 削除 |
| `src/app/(main)/sessions/new/_components/ScenarioSearchModal.test.tsx` | - | -174 | 削除 |
| `src/app/(main)/sessions/new/_components/ScenarioSearchModal.tsx` | - | -235 | 削除 |
| `src/app/(main)/sessions/new/_components/ScenarioSelectedCard.stories.tsx` | - | -79 | 削除 |
| `src/app/(main)/sessions/new/_components/ScenarioSelectedCard.tsx` | - | -82 | 削除 |
| `src/app/(main)/sessions/new/_components/SessionForm.stories.tsx` | +6 | - | 変更 |
| `src/app/(main)/sessions/new/_components/SessionForm.test.tsx` | +4 | -6 | 変更 |
| `src/app/(main)/sessions/new/_components/SessionForm.tsx` | +45 | -336 | 変更 |
| `src/app/(main)/sessions/new/_components/memberStyles.ts` | - | -124 | 削除 |
| `src/app/(main)/sessions/new/_components/scenarioCardStyles.ts` | - | -74 | 削除 |
| `src/app/(main)/sessions/new/_components/scenarioSearchStyles.ts` | - | -97 | 削除 |
| `src/app/(main)/sessions/new/_components/styles.ts` | +62 | -4 | 変更 |
| `src/app/(main)/sessions/new/actions.ts` | +190 | -8 | 変更 |
| `src/app/(main)/sessions/new/schema.ts` | +1 | -1 | 変更 |
| `src/components/elements/button/button.tsx` | +14 | -8 | 変更 |
| `src/components/elements/modal/modal.tsx` | +3 | -1 | 変更 |
| `src/components/elements/modal/styles.ts` | +24 | -16 | 変更 |
| `src/styles/tokens/zIndex.ts` | +1 | -1 | 変更 |
| `src/.../sections/basic-info/BasicInfoSection.tsx` | 新規 | - | 新規 |
| `src/.../sections/participants/MemberListItem.stories.tsx` | 新規 | - | 新規 |
| `src/.../sections/participants/MemberListItem.tsx` | 新規 | - | 新規 |
| `src/.../sections/participants/MemberSearchInput.stories.tsx` | 新規 | - | 新規 |
| `src/.../sections/participants/MemberSearchInput.test.tsx` | 新規 | - | 新規 |
| `src/.../sections/participants/MemberSearchInput.tsx` | 新規 | - | 新規 |
| `src/.../sections/participants/ParticipantsSection.tsx` | 新規 | - | 新規 |
| `src/.../sections/participants/memberStyles.ts` | 新規 | - | 新規 |
| `src/.../sections/scenario/ScenarioSearchModal.stories.tsx` | 新規 | - | 新規 |
| `src/.../sections/scenario/ScenarioSearchModal.test.tsx` | 新規 | - | 新規 |
| `src/.../sections/scenario/ScenarioSearchModal.tsx` | 新規 | - | 新規 |
| `src/.../sections/scenario/ScenarioSelectSection.tsx` | 新規 | - | 新規 |
| `src/.../sections/scenario/ScenarioSelectedCard.stories.tsx` | 新規 | - | 新規 |
| `src/.../sections/scenario/ScenarioSelectedCard.tsx` | 新規 | - | 新規 |
| `src/.../sections/scenario/scenarioCardStyles.ts` | 新規 | - | 新規 |
| `src/.../sections/scenario/scenarioSearchStyles.ts` | 新規 | - | 新規 |
| `src/.../sections/schedule/ScheduleSection.tsx` | 新規 | - | 新規 |

## 評価詳細

### 1. コーディング規約準拠 WARN

全体的に規約準拠度は高いが、`ScenarioSelectSection.tsx` で `interface` 使用（プロジェクトは `type` 基本）、`dynamic()` 呼び出しが import 文の途中に配置される import 順序の問題が検出された。スタイルファイルではハードコード値（`zIndex: '[10]'`、`bg: 'primary.50'`）がセマンティックトークンの代わりに使用されている箇所あり。

### 2. 設計・保守性 OK

FormProvider によるフォーム状態の一元管理、セクション単位のディレクトリ分割（basic-info/participants/scenario/schedule）により責務が明確に分離されている。Zod スキーマの `z.input`/`z.infer` 使い分け、Result 型パターンの使用も適切。`formatPlayerCount`/`formatPlaytime` の2ファイル重複が改善点。

### 3. セキュリティ WARN

Server Actions での `supabase.auth.getUser()` による JWT 検証、クエリのメタ文字エスケープ、最低クエリ長チェックなどセキュリティ意識が高い。ただし `getSystemsAction` のみ `getSession()` を使用しており、JWT サーバーサイド検証がスキップされている。

### 4. パフォーマンス WARN

`ScenarioSearchModal` の `dynamic()` レイジーロード、検索デバウンス、スマートフィルタの1回クエリ集約は適切。ただし `doSearch` の `useCallback` deps に `invitedMembers`（`useWatch` 由来の不安定参照）が含まれ、不要な再実行リスクあり。

### 5. UX・アクセシビリティ WARN

ARIA 属性、キーボードナビゲーション、フォーカスリングは全体的に丁寧に実装。ただし文字数カウンターの `aria-live="polite"` が削除されるアクセシビリティ退行、シナリオリストのキーボード選択時の自動スクロール欠如が検出された。

### 6. バグ・ロジックエラー WARN

`ScenarioSelectSection` の `onOpenChange` に `toggleSearchModalOpen` を渡す型不整合（トグル動作による意図しない再オープンリスク）、`setValue` で `null` の代わりに `undefined` が設定される問題が検出された。

## 指摘一覧

### 必須（マージ前に修正すべき）

| # | 観点 | ファイル:行 | 指摘事項 | 推奨対応 |
|---|------|------------|---------|---------|
| 1 | UX・アクセシビリティ | `sections/basic-info/BasicInfoSection.tsx:55` | 文字数カウンターの `<p>` から `aria-live="polite"` が削除されており、スクリーンリーダーが文字数変化を通知できない（WCAG 4.1.3） | `<p className={styles.form_charCount} aria-live="polite">` に戻す |
| 2 | コーディング規約準拠 | `sections/scenario/ScenarioSelectSection.tsx:11-16` | `dynamic()` の呼び出しが import 文の途中に挟まっており、その後にさらに静的 import が続いている。Import 順序の一貫性を欠く | `dynamic()` の呼び出しを全 import 文の後に移動する |
| 3 | コーディング規約準拠 | `sections/scenario/ScenarioSelectSection.tsx:24` | `interface` を使用しているが、プロジェクト規約は `type` を基本とし `interface` は継承が必要な場合のみ許可 | `interface ScenarioSelectSectionProps` を `type ScenarioSelectSectionProps =` に変更 |

### 推奨（対応が望ましい）

| # | 観点 | ファイル:行 | 指摘事項 | 推奨対応 |
|---|------|------------|---------|---------|
| 4 | セキュリティ | `sessions/new/actions.ts:371` | `getSystemsAction` で `supabase.auth.getSession()` を使用しており、JWT のサーバーサイド検証が行われない。他の Server Action は `getUser()` を使用 | `getSession()` を `getUser()` に変更し、`user` の存在チェックを行う |
| 5 | UX・アクセシビリティ | `sections/participants/MemberSearchInput.tsx:181` | `div[role="option"]` の `onKeyDown={() => {}}` が空実装。アイテムがフォーカスを受け取る時のキーボード操作が無効（WCAG 2.1.1） | `onKeyDown` で Enter/Space を検出し `handleSelect(user)` を呼ぶ。または `<button type="button" role="option">` に変更 |
| 6 | パフォーマンス | `sections/scenario/ScenarioSearchModal.tsx:100-153` | `doSearch` の `useCallback` deps に `invitedMembers`（`useWatch` 由来の不安定参照）が含まれ、フォーム更新のたびに再生成・`useEffect` 再実行のリスク | `invitedMembers` を `useRef` で保持するか、`useEffect` の deps から `doSearch` を除外してリファクタ |
| 7 | UX・アクセシビリティ | `sections/scenario/ScenarioSearchModal.tsx:215-228` | ArrowUp/Down でシナリオ選択時、スクロールコンテナ（maxH: 420px）内で選択アイテムへの自動スクロールがなく、画面外に出る | 各アイテムに ref を付与し、selectedId 変更時に `element.scrollIntoView({ block: 'nearest' })` を実行 |
| 8 | バグ・ロジックエラー | `sections/scenario/ScenarioSelectSection.tsx:76` | `onOpenChange` は `(details: { open: boolean }) => void` を要求するが、`toggleSearchModalOpen`（`() => void`）を渡しており、閉鎖時にトグルで意図せず再オープンするリスク | `onOpenChange={(details) => { if (!details.open) setFalse(); }}` に変更 |
| 9 | コーディング規約準拠 | `sections/participants/memberStyles.ts:36` | `zIndex: '[10]'` はハードコード。プロジェクトはセマンティックトークンを使用 | `zIndex: 'dropdown'` または適切なトークンに変更 |
| 10 | コーディング規約準拠 | `sections/scenario/scenarioSearchStyles.ts:216,218` | `bg: 'primary.50'` はカラーパレット直参照。セマンティックトークン `primary.subtleHover` が同値 | `bg: 'primary.subtleHover'` に変更 |
| 11 | 設計・保守性 | `ScenarioSelectedCard.tsx:18-35` / `ScenarioSearchModal.tsx:43-60` | `formatPlayerCount` と `formatPlaytime` の同じ実装が2ファイルに重複 | 共通ユーティリティ `formatters.ts` に抽出 |

### 検討（余裕があれば）

| # | 観点 | ファイル:行 | 指摘事項 | 推奨対応 |
|---|------|------------|---------|---------|
| 12 | バグ・ロジックエラー | `SessionForm.tsx:65` | `setValue('scenarioId', scenario?.scenarioId)` で `scenario` が `null` のとき `undefined` が設定される。意図は `null` の明示設定 | `setValue('scenarioId', scenario?.scenarioId ?? null)` に変更 |
| 13 | UX・アクセシビリティ | `sections/schedule/ScheduleSection.tsx:45` | `<FormField label="開催日時">` が `id` なしで呼ばれており、ラベルとRadioGroupの関連付けが不明確（WCAG 1.3.1） | `FormField` に `id` を渡すか、RadioGroup に `aria-labelledby` を付与 |
| 14 | コーディング規約準拠 | `sections/scenario/ScenarioSelectSection.tsx:68` | `<MagnifyingGlassIcon size="18" />` の `size` に文字列。他ファイルでは数値使用 | `size={18}` に変更 |
| 15 | バグ・ロジックエラー | `sessions/new/actions.ts:322-331` | `unplayedByPlayers` フィルタで preference レコード未登録ユーザーを「未プレイ」と見なす設計だが、コメント未記載 | コードコメントで設計意図を明記 |
| 16 | パフォーマンス | `src/styles/tokens/zIndex.ts:9` | `dropdown: 1350` が `modal: 1300` より高い。意図的な変更だがドキュメント不足 | JSDoc コメントに意図を記載 |

## 良い点

- `FormProvider` + `useFormContext` パターンにより Prop Drilling を解消し、コンポーネント間の結合度を適切に低減
- `sessionFormSchema` で `z.input` / `z.infer` を適切に使い分け、Single Source of Truth を徹底
- `ScenarioSearchModal` を `dynamic()` でレイジーロードし、初期バンドルサイズを最小化
- Server Actions で `supabase.auth.getUser()` による JWT 検証を正しく実装（`getSystemsAction` を除く）
- `searchUsersAction` でクエリのメタ文字エスケープとユーザー列挙攻撃対策を実施
- `applySmartFilters` が1回の IN 句クエリに集約され、N+1 クエリが発生しない
- 検索入力のデバウンス（300ms / 500ms）で Server Action 呼び出し頻度を適切に抑制
- スマートフィルタチップに `aria-pressed` を正しく付与し、トグルボタンの状態をスクリーンリーダーに明示
- `MemberSearchInput` が WAI-ARIA Combobox パターンに沿った ARIA 属性セットを正しく実装
- 全アイコンに `aria-hidden="true"` が付与され、装飾的アイコンの不要な読み上げを防止
- `createSessionAndRedirect` が `Promise<Result<void>>` に変更され、エラーをクライアントに正しく返せるよう改善
- セクション単位のディレクトリ分割で各セクションの責務が明確に分離
- DB クエリ失敗時のフォールバック処理でスマートフィルタ障害時の機能継続性を確保
- スタイルを `styles.ts` に分離し、コンポーネント内にインラインスタイルなし
- LogTape を使用し `console.log` / `console.error` を一切使用していない

## 総合所見

セッション作成フォームの大規模リファクタリングとして、設計品質は全体的に良好。FormProvider パターンの導入、セクション単位のコンポーネント分離、スマートフィルタ機能の追加など、アーキテクチャの改善が明確に見て取れる。

ただし、必須指摘が3件あり（aria-live 削除によるアクセシビリティ退行、import 順序・interface 使用の規約違反）、マージ前にこれらの修正が必要。推奨指摘のうち、`getSystemsAction` の認証メソッド不整合（#4）と `onOpenChange` の型不整合（#8）は潜在的なバグリスクがあり、優先的な対応を推奨する。

`formatPlayerCount`/`formatPlaytime` の重複排除（#11）と `doSearch` の deps 安定化（#6）は、保守性とパフォーマンスの両面で対応が望ましい。
