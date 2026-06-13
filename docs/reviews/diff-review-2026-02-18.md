# コード差分レビュー

> **反映ステータス**: 反映済み（2026-02-18）
> **反映内容**: 必須 3件 + 推奨 16件 + 検討 8件（全27件）
>
> **レビュー日時**: 2026-02-18
> **対象範囲**: HEAD (91e112a) からの未コミット変更（staged + unstaged + untracked）
> **変更ファイル数**: 82 files (+2078/-897 lines)
> **総合評価**: C
> **レビューモード**: パラレル（3エージェント）

## 変更サマリー

TRPGセッション管理機能の大規模実装。セッション詳細ページ、日程調整、参加者管理、申請承認フロー、スケジュールカレンダーコンポーネントなどを新規追加。既存テストファイルの共通モック一元化（vitest.setup.ts）とテストデータフィクスチャの整備も含む。DBマイグレーション（0004）で `session_links`, `game_schedules`, `schedule_candidates`, `schedule_responses` テーブルを追加。

### 変更ファイル（主要）

| ファイル | 追加 | 削除 | 種別 |
|----------|------|------|------|
| `src/app/(main)/sessions/[id]/adapter.ts` | 新規 | - | 新規 |
| `src/app/(main)/sessions/[id]/actions.ts` | 新規 | - | 新規 |
| `src/app/(main)/sessions/[id]/page.tsx` | +52 | -0 | 変更 |
| `src/app/(main)/sessions/[id]/_components/*.tsx` | 新規(14) | - | 新規 |
| `src/app/(main)/sessions/[id]/applications/**` | 新規(6) | - | 新規 |
| `src/app/(main)/sessions/[id]/schedule/**` | 新規(12) | - | 新規 |
| `src/app/(main)/sessions/adapter.ts` | +67 | -0 | 変更 |
| `src/app/(main)/sessions/participantAdapter.ts` | +183 | -0 | 変更 |
| `src/app/(main)/sessions/new/adapter.ts` | +23 | -0 | 変更 |
| `src/app/(main)/sessions/interface.ts` | +43 | -0 | 変更 |
| `src/components/blocks/ScheduleCalendar/**` | 新規(3) | - | 新規 |
| `src/__tests__/helpers/fixtures.ts` | 新規 | - | 新規 |
| `src/__tests__/helpers/testClient.ts` | 新規 | - | 新規 |
| `src/db/types.ts` | +84 | -0 | 変更 |
| `src/db/enum.ts` | +19 | -0 | 変更 |
| `supabase/migrations/0004_session_flow_schema.sql` | 新規 | - | 新規 |
| `vitest.setup.ts` | 新規 | - | 新規 |
| テストファイル群 (8) | 大幅変更 | - | 変更 |
| `e2e/auth/session-flow.spec.ts` | 新規 | - | 新規 |

## 評価詳細

### 1. コーディング規約準拠 WARN

全体的に規約準拠度は高い。`export const` によるコンポーネント定義、`@phosphor-icons/react/ssr` からのインポート、LogTape使用、`isNil` の一貫した使用など基本規約は守られている。ただし `styles.ts` でのマジックナンバー (`[13px]`, `[12px]`)、`ScheduleCalendar.tsx` での複数コンポーネント定義が検出された。

### 2. 設計・保守性 WARN

Result型パターン、Zodスキーマ分離、Server Actionsでの認可→バリデーション→DB操作の順序統一など、既存パターンとの整合性は良好。ただし `adapter.ts` での `as SessionDetail` キャスト、`ApplicationWithUser` 型の独自定義（Supabase生成型から導出可能）、`as unknown as never` による型安全性の完全放棄が問題。

### 3. セキュリティ WARN

認証・認可チェック、Zodバリデーション、XSS防止は全体的に良好。ただし `deleteSessionLink` が `session_id` との照合なしに削除可能な IDOR 脆弱性、`schedule_candidates` テーブルの SELECT ポリシーが全公開（`USING (true)`）という問題あり。

### 4. パフォーマンス WARN

Server Component での `Promise.all` による並列データ取得は適切。ただし `getSessionTimeline` での逐次クエリ（並列化可能）、`ScheduleCalendar` の `defaultDisabled` 関数の再生成（`useCallback` 未使用）が検出された。

### 5. UX・アクセシビリティ WARN

Ark UI のダイアログ利用、`role="alert"` によるエラー通知、`aria-label` の付与、`loading.tsx` でのスケルトンUI提供など多くの良い実装がある。ただし未実装ボタン（編集・カレンダー追加）の露出、`<nav>` 内の `role="tablist"` 配置、外部リンクの新規タブ通知欠如などが検出された。

### 6. バグ・ロジックエラー WARN

フェーズ遷移バリデーション、楽観的ロック、参加者状態管理など全体的にロジックは堅固。ただし `rejectApplication` が承認済み参加者も削除可能、`SelectedDatesDisplay` の配列ミューテーション、退会済みユーザー表示値の不一致が検出された。

## 指摘一覧

### 必須（マージ前に修正すべき）

| # | 観点 | ファイル:行 | 指摘事項 | 推奨対応 |
|---|------|------------|---------|---------|
| 1 | セキュリティ | `src/app/(main)/sessions/[id]/adapter.ts:436-456` | `deleteSessionLink` が `session_id` との照合なしに `link_id` だけで削除しておりIDOR脆弱性がある | `.delete().eq('link_id', linkId).eq('session_id', sessionId)` に修正。関数シグネチャに `sessionId` を追加 |
| 2 | バグ・ロジックエラー | `src/app/(main)/sessions/participantAdapter.ts:235-276` | `rejectApplication` が `participant_status` を確認せず、承認済み(CONFIRMED)参加者も削除できてしまう | `participant.participant_status === 'CONFIRMED'` の場合はエラーを返し、辞退フローを案内する |
| 3 | UX・アクセシビリティ | `src/app/(main)/sessions/[id]/schedule/_components/SelectedDatesDisplay.tsx:32` | `dates.sort(...)` が受け取った props 配列を直接ミューテートしている（副作用バグ） | `[...dates].sort((a, b) => a.getTime() - b.getTime())` に変更 |

### 推奨（対応が望ましい）

| # | 観点 | ファイル:行 | 指摘事項 | 推奨対応 |
|---|------|------------|---------|---------|
| 4 | セキュリティ | `supabase/migrations/0004_session_flow_schema.sql:79-81` | `schedule_candidates_select` ポリシーが `USING (true)` で全公開。プライベートセッションの日程候補も誰でも取得可能 | セッションの `visibility` や参加者との関係に基づいたポリシーに制限する |
| 5 | セキュリティ / 設計・保守性 | `src/app/(main)/sessions/[id]/schedule/adapter.ts:217` | `supabase.rpc('confirm_schedule' as unknown as never, ...)` で型安全性を完全に破棄している | Supabase型定義に RPC 関数の型を手動追加し、キャストを削除する |
| 6 | バグ・ロジックエラー | `src/app/(main)/sessions/adapter.ts:556` | 未確定セッションに `new Date().toISOString()` を仮値としてセット。カレンダーで常に「今日」に誤表示される | `scheduleDate: null` にして型定義上 `null` を許容し、カレンダー側でnull処理する |
| 7 | バグ・ロジックエラー | `src/app/(main)/sessions/[id]/schedule/adapter.ts:94` | 退会済みユーザーの表示値が `{ userId: '', userName: '' }` と空。`getSessionDetail` では `'退会済みユーザー'` を返しており不一致 | `{ userId: 'unknown', userName: '退会済みユーザー' }` に統一する |
| 8 | コーディング規約準拠 | `src/app/(main)/sessions/[id]/styles.ts:68` | `fontSize: '[13px]'` / `'[12px]'` のような生の数値をトークンなしで使用 | `semanticTokens.ts` にフォントサイズトークンを定義するか既存トークンを使用する |
| 9 | 設計・保守性 | `src/app/(main)/sessions/[id]/adapter.ts:169` | `sessionDetail` の最終組み立てで `as SessionDetail` キャスト。`camelCaseKeys` が `unknown` を返すため型チェックが効かない | 各フィールドを個別に代入して明示的な型検証を行うか、`camelCaseKeys` の型定義を改善する |
| 10 | 設計・保守性 | `src/app/(main)/sessions/[id]/applications/adapter.ts:13` | `ApplicationWithUser` 型を独自定義。Supabase生成型から導出可能であり型定義の二重管理リスク | Supabase生成型から導出する |
| 11 | コーディング規約準拠 | `src/components/blocks/ScheduleCalendar/ScheduleCalendar.tsx:47-83` | `PreviousMonthButton` / `NextMonthButton` の2コンポーネントが同ファイルで定義（1ファイル1コンポーネント原則違反） | 小さなヘルパーとして許容するか、別ファイルに分離する |
| 12 | パフォーマンス | `src/app/(main)/sessions/[id]/adapter.ts:217-232` | `getSessionTimeline` で `session_participants` と `game_schedules` を逐次クエリ | `Promise.all` で並列化する |
| 13 | パフォーマンス | `src/components/blocks/ScheduleCalendar/ScheduleCalendar.tsx:94-98` | `defaultDisabled` 関数がレンダリングごとに再生成。`DayPicker` の `disabled` prop 参照が毎回変化 | `useCallback` でメモ化する |
| 14 | UX・アクセシビリティ | `src/app/(main)/sessions/[id]/_components/SessionDetailContent.tsx:47-61` | 「編集」「その他のメニュー」ボタンに `onClick` ハンドラなし。未実装UIが露出 | `disabled` 属性を付けるか実装するまで非表示にする |
| 15 | UX・アクセシビリティ | `src/app/(main)/sessions/[id]/_components/ToolsSection.tsx:86-89` | 「カレンダーに追加」ボタンも同様に未実装 | `disabled` 属性を付けるか非表示にする |
| 16 | UX・アクセシビリティ | `src/app/(main)/sessions/[id]/applications/_components/ApplicationApprovalContent.tsx:137` | `<nav>` 内に `role="tablist"` を配置。WAI-ARIA推奨構造から外れている | `<nav>` を `<div>` に変更する |
| 17 | UX・アクセシビリティ | `src/app/(main)/sessions/[id]/schedule/_components/ScheduleContent.tsx:107-110` | 候補日統計「○ △ ×」にスクリーンリーダー向けラベルなし | `<span className="sr-only">参加可能:</span>` 等を追加する |
| 18 | UX・アクセシビリティ | `src/app/(main)/sessions/[id]/_components/ToolsSection.tsx:72-83` | 外部リンク(`target="_blank"`)に新規タブで開く旨の通知なし | `aria-label` に「（新しいタブで開く）」を追加する |
| 19 | UX・アクセシビリティ | `src/app/(main)/sessions/[id]/_components/ParticipationRequestDialog.tsx:180-185` | `register` を使わず `setValue` のみ使用。ラジオグループの `name` 属性がネイティブinputに渡っていない | `register('participantType')` を `<input>` に展開する |

### 検討（余裕があれば）

| # | 観点 | ファイル:行 | 指摘事項 | 推奨対応 |
|---|------|------------|---------|---------|
| 20 | バグ・ロジックエラー / 設計・保守性 | `src/app/(main)/sessions/[id]/schedule/respond/_components/ScheduleResponseContent.tsx:44-56` | `initialResponses` がコンポーネント本体で直接計算。`candidates` prop変化時に再計算されない | `useState(() => { ... })` の遅延初期化形式を使用する |
| 21 | バグ・ロジックエラー | `src/app/(main)/sessions/[id]/adapter.ts:293-299` | `updated_at` を完了日時として使用。メモ追加等でも変更されるため不正確（TODOコメント既存） | `completed_at` カラム追加を検討する |
| 22 | 設計・保守性 | `src/app/(main)/sessions/[id]/_components/ApplicationCard.tsx:41-68` | `getTypeBadgeClass` と `getTypeLabel` が同一switchキーで別々に処理 | テーブル駆動アプローチに統合する |
| 23 | コーディング規約準拠 | `src/app/(main)/sessions/[id]/_components/SessionDetailContent.tsx:19-25` | `participantStatus` の型が `string \| undefined` でリテラル型でない | `Database['public']['Enums']['participant_status'] \| undefined` を使用する |
| 24 | 設計・保守性 | `src/app/(main)/sessions/[id]/actions.ts:51-56` | `VALID_TRANSITIONS` が `Record<string, string[]>` で型安全性がない | Enum リテラル型を使用する |
| 25 | パフォーマンス | `src/app/(main)/sessions/[id]/schedule/summary/_components/ScheduleSummaryContent.tsx:50-57` | `sortedCandidates`, `maxOkCount`, `recommendedIds` をレンダリング毎に再計算 | `useMemo` でメモ化する |
| 26 | UX・アクセシビリティ | `src/app/(main)/sessions/[id]/_components/styles.ts:280-306` | ロールバッジの `color: 'white'` と背景色の組み合わせでコントラスト比が不足する可能性 | セマンティックトークンの実際値でコントラスト比4.5:1以上を確認する |
| 27 | UX・アクセシビリティ | `src/app/(main)/sessions/[id]/_components/CancelSessionDialog.tsx:119-123` | `<ul><li>` にスタイルなし。ブラウザデフォルトのbulletが表示される | PandaCSSで適切なスタイルを設定する |

## 良い点

- 全 Server Action が `isSessionManager` + `getCurrentUserId` による二重の認証・認可チェックを一貫して実装
- `completeSessionAction` / `updateSessionPhaseAction` が `updated_at` ベースの楽観的ロックで競合操作を防止
- Result型パターン (`ok`, `err`, `isNil`) の全 Server Action / Adapter への徹底的な適用
- Zodスキーマの `schema.ts` 分離と `z.infer` による型導出が規約準拠
- LogTape (`getAppLogger`) の使用が全ファイルで一貫。`console.log` なし
- `@phosphor-icons/react/ssr` からのインポートが全ファイルで統一。SSRエラーリスクなし
- `ApplicationApprovalContent.tsx` の楽観的更新が `useOptimistic` + `useTransition` で正しく実装
- Server Component での `Promise.all` による並列データ取得（`SessionDetailPage`, `ApplicationsPage`）
- Ark UI ダイアログのフォーカストラップ・Escapeキー対応による a11y 機能の継承
- `role="alert"` によるエラー通知、`aria-label` の適切な付与
- `loading.tsx` でのスケルトンUIによるCLS抑制
- テストフィクスチャ (`fixtures.ts`) がSupabase生成型を活用した型安全なテストデータ管理
- `searchPublicSessions` での `ilike` ワイルドカードエスケープ
- `cancelSessionSchema` の二重確認フィールド（「キャンセル」入力必須）による誤操作防止
- ユーザー入力は全てReactテキストノードとして描画。XSSリスクなし

## 総合所見

セッションフロー機能の大規模実装として、全体的な設計品質は高い。認証・認可、バリデーション、エラーハンドリングの基盤パターンが一貫して適用されており、保守性のある構造になっている。

**修正が必須な3件** はいずれも局所的な修正で対応可能:
1. `deleteSessionLink` のIDOR脆弱性（`.eq('session_id', sessionId)` の追加）
2. `rejectApplication` の状態チェック漏れ（`participant_status` の確認追加）
3. `SelectedDatesDisplay` の配列ミューテーション（スプレッド演算子の追加）

推奨事項では、`as unknown as never` による型安全性の放棄（RPC型定義の追加で解決）、未確定セッションの仮日時設定（null許容に変更）、逐次クエリの並列化が優先度の高い改善項目。
