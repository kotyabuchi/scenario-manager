# コード差分レビュー

> **反映ステータス**: 反映済み（2026-02-18）
> **反映内容**: 必須 4件 + 推奨 10件 + 検討 6件（計20件反映、#15はスキップ）

> **レビュー日時**: 2026-02-18
> **対象範囲**: HEAD (`91e112a`) からの未コミット変更（staged + unstaged + untracked）
> **変更ファイル数**: 85 files (+2140/-911 lines)
> **総合評価**: C
> **レビューモード**: パラレル（3エージェント）

## 変更サマリー

セッション詳細画面（`sessions/[id]/`）の大規模な新規実装。セッション詳細表示、参加申請管理、日程調整・回答・集計の各機能を含む。ページコンポーネント、Server Actions、DB アダプター、Zod スキーマ、テストファイルが一式追加されている。既存の `sessions/adapter.ts`、`participantAdapter.ts`、`interface.ts` にも大幅な変更が加えられ、DB スキーマのマイグレーション（`0004_session_flow_schema.sql`）で新テーブル・RLS・RPC 関数が追加されている。

### 変更ファイル

| ファイル | 追加 | 削除 | 種別 |
|----------|------|------|------|
| `src/app/(main)/sessions/[id]/page.tsx` | +55 | -0 | 変更 |
| `src/app/(main)/sessions/[id]/adapter.ts` | - | - | 新規 |
| `src/app/(main)/sessions/[id]/actions.ts` | - | - | 新規 |
| `src/app/(main)/sessions/[id]/schema.ts` | - | - | 新規 |
| `src/app/(main)/sessions/[id]/styles.ts` | - | - | 新規 |
| `src/app/(main)/sessions/[id]/_components/*.tsx` | - | - | 新規(14ファイル) |
| `src/app/(main)/sessions/[id]/applications/**` | - | - | 新規(7ファイル) |
| `src/app/(main)/sessions/[id]/schedule/**` | - | - | 新規(15ファイル) |
| `src/app/(main)/sessions/adapter.ts` | +69 | -0 | 変更 |
| `src/app/(main)/sessions/participantAdapter.ts` | +202 | -0 | 変更 |
| `src/app/(main)/sessions/interface.ts` | +58 | -0 | 変更 |
| `src/db/enum.ts` | +19 | -0 | 変更 |
| `src/db/helpers.ts` | +6 | -0 | 変更 |
| `src/db/types.ts` | +95 | -0 | 変更 |
| `src/lib/supabase/transform.ts` | +18 | -0 | 変更 |
| `src/styles/semanticTokens.ts` | +4 | -0 | 変更 |
| `supabase/migrations/0004_session_flow_schema.sql` | - | - | 新規 |
| `src/components/blocks/ScheduleCalendar/**` | - | - | 新規(3ファイル) |
| テストファイル（`__tests__/`） | - | - | 新規/変更(複数) |
| `vitest.setup.ts` | - | - | 新規 |

## 評価詳細

### 1. コーディング規約準拠 WARN

全体的に規約への準拠度は高い。命名規則、`export const` パターン、LogTape ログ出力、`@phosphor-icons/react/ssr` インポート、`isNil` チェックは規約に沿っている。ただし、`participantAdapter.ts` でマジックストリングの使用（`'CONFIRMED'` を定数化せず直接使用）、`adapter.ts` の `_userId` 未使用パラメータの扱い、`camelCaseKeys` 後の `as` 型アサーション多用が確認された。

### 2. 設計・保守性 WARN

ディレクトリ構造（page/adapter/interface/schema/actions/styles/_components）が適切に守られ、Result 型パターンと Supabase 生成型からの型導出（`CamelCaseKeys`）が一貫している。しかし、`completeSessionAction` / `updateSessionPhaseAction` がアダプター層をスキップして直接 DB アクセスしている点、`ParticipantResult` 型の手動定義、`styles.ts` へのロジック関数混在が設計原則に反する。

### 3. セキュリティ WARN

Server Actions 全体で認証・認可チェックが徹底され、IDOR防止・Zod入力バリデーション・URLスキーム制限が適切に実装されている。ただし、`schedule_candidates` の SELECT RLS ポリシーで辞退済み参加者の除外が欠如、`submitResponseAction` で未承認（PENDING）参加者も日程回答可能な点が指摘された。

### 4. パフォーマンス WARN

`getSessionDetail` が単一クエリで全関連テーブルを結合取得しN+1回避、`buildSessionTimeline` が純粋変換で追加クエリを排除するなど、全体的にパフォーマンス設計は良好。ただし、`applications/page.tsx` で独立した2クエリが逐次実行されている点、`getScheduleResponses` の2回DB往復が改善可能。

### 5. UX・アクセシビリティ WARN

Ark UI Modal によるフォーカストラップ、外部リンクの `aria-label`、フェーズバッジのアイコン+テキスト表示、可用性ボタンの `aria-label`/`aria-pressed` など多くの点で WCAG 準拠が確認された。しかし、参加タイプラジオカードのフォーカスリング不表示（WCAG 2.4.7違反）、タブUIの矢印キーナビゲーション未実装が重要な問題として検出された。

### 6. バグ・ロジックエラー WARN

Result型パターンと `isNil` チェックが一貫使用され、楽観的ロックによる同時更新保護も実装されている。ただし、`approveApplication` の権限チェック順序の不整合（情報漏洩リスク）、`withdrawFromSession` のスケジュール回答削除エラー無視が指摘された。

## 指摘一覧

### 必須（マージ前に修正すべき）

| # | 観点 | ファイル:行 | 指摘事項 | 推奨対応 |
|---|------|------------|---------|---------|
| 1 | コーディング規約準拠 | `src/app/(main)/sessions/participantAdapter.ts:268` | `participant.participant_status === 'CONFIRMED'` とマジックストリングを使用。同ファイル内の `ParticipantStatuses.CONFIRMED.value` を使用していない | `ParticipantStatuses.CONFIRMED.value` に置換 |
| 2 | 設計・保守性 | `src/app/(main)/sessions/[id]/actions.ts:414,502` | `completeSessionAction` と `updateSessionPhaseAction` が `adapter.ts` を経由せず直接 `createDbClient()` でDBアクセスしており責務分離原則に反する | DB操作を `adapter.ts` の関数に切り出す |
| 3 | UX・アクセシビリティ | `src/app/(main)/sessions/[id]/_components/ParticipationRequestDialog.tsx:179-204` | 参加タイプラジオカードで `sr-only` の `<input>` にフォーカスが当たるため、`<label>` の `_focusVisible` フォーカスリングがキーボード操作時に表示されない（WCAG 2.4.7 Focus Visible 違反） | `_focusWithin` を使用して親 `<label>` にフォーカスリングを表示するか、Ark UI の RadioGroup を使用 |
| 4 | UX・アクセシビリティ | `src/app/(main)/sessions/[id]/applications/_components/ApplicationApprovalContent.tsx:138-193` | タブUI（`role="tablist"`/`role="tab"`）でキーボードの矢印キーによるタブ間ナビゲーションが未実装（ARIA Authoring Practices Guide 違反） | ArrowLeft/ArrowRight のキーダウンハンドラを追加するか、Ark UI の Tabs コンポーネントに置き換え |

### 推奨（対応が望ましい）

| # | 観点 | ファイル:行 | 指摘事項 | 推奨対応 |
|---|------|------------|---------|---------|
| 5 | セキュリティ | `supabase/migrations/0004_session_flow_schema.sql:91-106` | `schedule_candidates` の SELECT RLS ポリシーで `participant_status != 'WITHDRAWN'` チェックが欠如。辞退済み参加者も日程候補を閲覧可能 | RLSサブクエリに `AND sp.participant_status != 'WITHDRAWN'` を追加 |
| 6 | セキュリティ | `src/app/(main)/sessions/[id]/schedule/actions.ts:86-97` | `submitResponseAction` で PENDING（未承認）の参加者も日程回答が可能。承認された参加者のみが回答すべき | `participant_status === ParticipantStatuses.CONFIRMED.value` チェックに変更 |
| 7 | バグ・ロジックエラー | `src/app/(main)/sessions/participantAdapter.ts:178-213` | `approveApplication` でGM権限チェック（L199）より先に参加申請データを取得（L187）。非GMが申請ステータスを確認できる情報漏洩リスク。`rejectApplication` は正しい順序で実装されており矛盾 | 権限チェック（`isSessionManager`）を参加申請取得より先に実施 |
| 8 | バグ・ロジックエラー | `src/app/(main)/sessions/participantAdapter.ts:354-366` | `withdrawFromSession` で辞退後の `schedule_responses` 削除エラーが無視される。データ不整合が検知されない | 削除エラー時にロギングを追加し、best-effort であることを明示コメント |
| 9 | 設計・保守性 | `src/app/(main)/sessions/participantAdapter.ts:43-49` | `ParticipantResult` 型が手動定義されており、Supabase 生成型から導出されていない | `Database['public']['Tables']['session_participants']['Row']` から `Pick` + `CamelCaseKeys` で導出 |
| 10 | 設計・保守性 | `src/app/(main)/sessions/[id]/adapter.ts:155` | `} as SessionDetail` による型アサーションで型安全性が低下 | 明示的なオブジェクト構築または型ガード関数を使用 |
| 11 | UX・アクセシビリティ | `src/app/(main)/sessions/[id]/_components/CancelApplicationDialog.tsx:101-105` | `role="alert"` 内の `<WarningCircle>` に `aria-hidden="true"` がなく、スクリーンリーダーがSVGを読み上げる可能性 | `aria-hidden="true"` を追加 |
| 12 | UX・アクセシビリティ | `src/app/(main)/sessions/[id]/_components/CancelSessionDialog.tsx:128-131` | 同上：`<WarningCircle>` に `aria-hidden="true"` がない | `aria-hidden="true"` を追加 |
| 13 | UX・アクセシビリティ | `src/app/(main)/sessions/[id]/_components/WithdrawDialog.tsx:106-110` | サーバーエラー表示に `<WarningCircle>` アイコンがなく、他ダイアログと不一致。色とテキストのみでエラーを伝達 | 他ダイアログと同様に `<WarningCircle>` アイコンを追加 |
| 14 | 設計・保守性 | `src/app/(main)/sessions/[id]/_components/styles.ts:193-211` | `styles.ts` に `cx` 呼び出しのロジック関数が含まれており、スタイル定義ファイルの責務を超えている | ヘルパー関数をコンポーネント側に移動し、`styles.ts` はCSS値定義のみに絞る |
| 15 | パフォーマンス | `src/app/(main)/sessions/[id]/applications/page.tsx` | `getApplications` と `getSessionBasicInfo` が逐次実行（独立クエリ） | `Promise.all` で並列化 |
| 16 | UX・アクセシビリティ | `src/app/(main)/sessions/[id]/loading.tsx` | ローディングスケルトンにスクリーンリーダー向け通知がない | `aria-busy="true"` + `aria-label="読み込み中"` を追加 |
| 17 | 設計・保守性 | `src/app/(main)/sessions/[id]/schedule/adapter.ts:193-195` | `as unknown as ScheduleResponse` 二重型アサーション | 各プロパティを明示的にマッピングして型安全性を確保 |
| 18 | 設計・保守性 | `src/app/(main)/sessions/[id]/schedule/adapter.ts:237-241` | `getScheduleSummary` が `getScheduleCandidates` の単純な委譲のみで独自処理がなく、不要な抽象化 | 削除して呼び出し元で直接 `getScheduleCandidates` を使用 |

### 検討（余裕があれば）

| # | 観点 | ファイル:行 | 指摘事項 | 推奨対応 |
|---|------|------------|---------|---------|
| 19 | セキュリティ / コーディング規約準拠 | `src/app/(main)/sessions/[id]/adapter.ts:243-244` | `updateSessionMemo` が `_userId` を受け取るが使用せず、呼び出し元の認可チェックを前提とした設計。将来の誤用リスク | パラメータ削除またはJSDocで認可前提を明記 |
| 20 | バグ・ロジックエラー | `src/app/(main)/sessions/adapter.ts:508` | カレンダー月末計算で `23:59:59` を指定。`23:59:59.999` でないためミリ秒単位のデータ漏れの可能性（実務影響は軽微） | `.999` 追加、または月初の直前を使用 |
| 21 | バグ・ロジックエラー | `src/app/(main)/sessions/[id]/_components/SessionActions.tsx:144-168` | `IN_PROGRESS` フェーズ以降でも日程回答ボタンが表示されうる | `session_phase` のガード条件を追加 |
| 22 | コーディング規約準拠 | `src/app/(main)/sessions/[id]/applications/adapter.ts:72-89` | `camelCaseKeys` 後の `as string` 型アサーション多用 | `camelCaseKeys` の戻り値型を適切に活用 |
| 23 | パフォーマンス | `src/app/(main)/sessions/[id]/schedule/adapter.ts:159-202` | `getScheduleResponses` が2回のDB往復で実装。`getScheduleCandidates` と類似データを別クエリ構造で取得 | 1クエリに統一するか `getScheduleCandidates` の結果を再利用 |
| 24 | 設計・保守性 | `src/app/(main)/sessions/[id]/styles.ts:683-803` | `dialog_*` プレフィックスのスタイルがページスタイルファイルに混在 | ダイアログ専用スタイルを `_components/styles.ts` に移動 |

## 良い点

- 全 Server Actions で `getCurrentUserId()` 認証チェック + `isSessionManager()` 認可チェックが徹底されている
- IDOR防止のための二重キー条件（session_id + 対象ID）が一貫して適用されている
- URLスキーム制限（http/httpsのみ）、`cancelSessionSchema` の二重確認テキストバリデーションなど防御的設計
- 楽観的ロック（`updated_at` 条件付きUPDATE）による同時更新の競合検出
- `confirm_schedule` RPC の `SECURITY DEFINER` + Supabase RLS によるDB層・アプリ層の二重防御
- Result型 + `isNil` + Zod `z.infer` が全体で一貫して使用され、型安全なエラーハンドリングが実現
- ディレクトリ構造（page/adapter/interface/schema/actions/styles/_components）が規約通りに整理
- `@phosphor-icons/react/ssr` インポートと LogTape ログ出力が全面統一
- セマンティックトークンの徹底使用（ハードコード色値なし）
- `getSessionDetail` が単一クエリで全関連テーブルを結合取得しN+1クエリを完全回避
- `buildSessionTimeline` が既取得データから純粋変換（追加DBクエリなし）
- `useOptimistic` + `useTransition` による楽観的更新が `react-rules.md` に則って正しく実装
- Ark UI Modal によるフォーカストラップ・Escapeキー閉じ動作の保証
- 外部リンクに `（新しいタブで開く）` aria-label、フェーズバッジのアイコン+テキスト
- `ScheduleResponseContent` の可用性ボタン（○△×）に `aria-label` + `aria-pressed`

## 総合所見

セッション詳細機能の大規模な新規実装として、全体的なアーキテクチャ・セキュリティ設計・型安全性は高品質。特に認証・認可の徹底、Result型パターンの一貫した使用、N+1回避のための効率的なデータ取得設計が優れている。

主な改善ポイントは3カテゴリに分類される：

1. **WCAG準拠**（#3, #4）: ラジオカードのフォーカスリング不表示とタブUIの矢印キーナビゲーション未実装。Ark UI のRadioGroup/Tabsコンポーネントへの置き換えで解決可能。
2. **設計の一貫性**（#1, #2）: Server Actionsでの直接DBアクセスとマジックストリング。いずれもlocalized fixで対応可能。
3. **セキュリティの細部**（#5, #6, #7）: RLSポリシーのWITHDRAWN除外漏れ、未承認参加者の日程回答許可、権限チェック順序の不整合。

必須4件はいずれも局所的な修正で解決可能であり、アーキテクチャの根本的な見直しは不要。
