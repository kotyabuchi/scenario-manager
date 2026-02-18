# コード差分レビュー

> **反映ステータス**: 反映済み（2026-02-18）
> **反映内容**: 必須 8件 + 推奨 10件 + 検討 7件（合計25件反映、2件スキップ、3件該当なし）

> **レビュー日時**: 2026-02-18
> **対象範囲**: HEAD (`91e112a`) からの未コミット変更（staged + unstaged + untracked）
> **変更ファイル数**: 84 files（tracked 25 + untracked 59）, +2097/-901 lines
> **総合評価**: D
> **レビューモード**: パラレル（3エージェント）

## 変更サマリー

TRPGセッション管理機能（セッション詳細ページ、参加申請管理、日程調整フロー）の大規模実装。セッション詳細画面（`sessions/[id]/`）の全UIコンポーネント群、Server Actions、DBアダプター、Zodスキーマ、スケジュール調整サブルート、Supabaseマイグレーション、E2Eテスト、Vitestテスト基盤の整備を含む。既存のセッション一覧・新規作成・参加者管理アダプターにも修正が入っている。

### 変更ファイル

| ディレクトリ | ファイル数 | 種別 | 概要 |
|-------------|-----------|------|------|
| `src/app/(main)/sessions/[id]/` | 42 | 新規 | 詳細ページ、申請管理、日程調整の全実装 |
| `src/app/(main)/sessions/` | 7 | 変更 | 一覧adapter/interface/participantAdapter改修 |
| `src/app/(main)/sessions/__tests__/` | 3 | 変更 | adapter/participantAdapterテスト更新 |
| `src/app/(main)/scenarios/` | 4 | 変更 | テストのvitest.setup対応 |
| `src/app/(main)/profile/` | 1 | 変更 | テストのvitest.setup対応 |
| `src/app/(main)/home/` | 1 | 変更 | モックデータ追加 |
| `src/components/blocks/ScheduleCalendar/` | 3 | 新規 | カレンダーコンポーネント |
| `src/__tests__/helpers/` | 2 | 新規 | テスト用fixtures/testClient |
| `src/db/` | 3 | 変更 | enum/helpers/types拡張 |
| `src/styles/` | 1 | 変更 | セマンティックトークン追加 |
| `supabase/migrations/` | 1 | 新規 | セッションフロースキーマ |
| `e2e/` | 3 | 新規/変更 | E2Eテスト・ヘルパー |
| `vitest.*` | 2 | 新規/変更 | テスト基盤設定 |
| `.claude/` | 6 | 新規/変更 | エージェント・スキル定義 |

## 評価詳細

### 1. コーディング規約準拠 WARN

全体的にコーディング規約は高い水準で守られている。命名規則、`@phosphor-icons/react/ssr` import、LogTape使用、`isNil`チェック、Result型パターン、スタイル分離が一貫して適用されている。ただし、ハードコードされたフォントサイズ値（マジックナンバー）、生スケールトークンの使用、Props型名規約違反が検出された。

### 2. 設計・保守性 WARN

`adapter.ts`/`interface.ts`/`page.tsx`/`actions.ts`/`schema.ts`/`styles.ts` の責務分離パターンが全新規ページで一貫して踏襲されている。Result型エラーハンドリング、楽観的更新も正しく実装されている。ただし、フォーム状態管理に`useState`を使用する明示的禁止違反、独自型の二重管理、UserRole型のSingle Source of Truth欠如が検出された。

### 3. セキュリティ WARN

すべてのServer Actionsで認証チェックを先頭で実施し、IDOR防止、Zodバリデーション、XSS対策が適切に行われている。ただし、`rejectApplication`の認可チェック順序による情報漏洩リスク、`submitScheduleResponse`でのcandidateId帰属検証欠如、`schedule_responses`テーブルのRLSポリシー未設定という重要な問題が検出された。

### 4. パフォーマンス WARN

`Promise.all`による並列フェッチ、`useMemo`/`useCallback`によるメモ化、Suspenseスケルトンが適切に実装されている。`getSessionDetail`でkeeper/creatorを別クエリで取得する構造と、コンポーネント内部での定数再生成が改善候補。

### 5. UX・アクセシビリティ WARN

WAI-ARIAパターン（radiogroup、tablist、alert、aria-pressed）が適切に実装され、空状態メッセージ、フォーカスリング、外部リンクのaria-labelも整備されている。ただし、`badge.spectatorBg`と白テキストのコントラスト比がWCAG 4.5:1を下回る重要な問題と、記号のみのテーブルヘッダーへのsr-only対応不足が検出された。

### 6. バグ・ロジックエラー WARN

ロジック全体は整合しており、楽観的ロック、Result型、null/undefinedチェックが正しく使われている。空配列での`.every()`挙動と、Server Actionパラメータの実行時バリデーション不足が改善候補。

## 指摘一覧

### 必須（マージ前に修正すべき）

| # | 観点 | ファイル:行 | 指摘事項 | 推奨対応 |
|---|------|------------|---------|---------|
| 1 | セキュリティ | `sessions/participantAdapter.ts:256` | `rejectApplication`で`participant_status`チェックが`isSessionManager`認可チェックより前にある。非GMユーザーが申請ステータス（CONFIRMED/否）を推測できる情報漏洩 | `isSessionManager`チェックを`participant_status`チェックより前に移動 |
| 2 | セキュリティ | `sessions/[id]/schedule/actions.ts:74` | `submitResponseAction`で`candidateId`が対象セッションに属するか未検証。参加者が別セッションのcandidateIdに回答書き込み可能。`schedule_responses`にRLSもなし | candidateIdのセッション帰属を`schedule_candidates`テーブルで検証 |
| 3 | セキュリティ | `supabase/migrations/0004_session_flow_schema.sql` | `schedule_responses`テーブルにRLSポリシーが未定義。アプリケーション層アクセス制御のみに依存 | SELECT=参加者・管理者のみ、INSERT/UPDATE=本人のみ、DELETE=管理者のみのRLSポリシーを追加 |
| 4 | コーディング規約準拠 | `sessions/[id]/_components/styles.ts:68` | `fontSize: '[13px]'`はトークン外のハードコード値（マジックナンバー禁止違反） | `semanticTokens.ts`にトークン定義するか既存トークンに変更 |
| 5 | コーディング規約準拠 | `sessions/[id]/styles.ts:408` | `tools_linkSecondary._hover`で`bg: 'gray.200'`（生スケールトークン）を使用 | `bg: 'bg.input'`等のセマンティックトークンに置換 |
| 6 | 設計・保守性 | `sessions/[id]/schedule/respond/.../ScheduleResponseContent.tsx:44-58` | `responses`フォーム状態を`useState`で管理。`form-rules.md`の`useState`禁止に明示違反。`scheduleResponseSchema`が存在するのにRHF未連携 | `useForm` + `zodResolver(scheduleResponseSchema)`に移行 |
| 7 | 設計・保守性 | `sessions/[id]/applications/adapter.ts:14-29` | `ApplicationWithUser`型を独自定義（Supabase生成型と二重管理）。TODO記載あるが未修正 | `Database['public']['Tables']['session_participants']['Row']`を`CamelCaseKeys`で変換して使用 |
| 8 | UX・アクセシビリティ | `sessions/[id]/styles.ts:304` | `participants_roleSpectator`の`bg: 'badge.spectatorBg'`（gray.400相当）+ `color: 'white'`で推定コントラスト比約2.6:1。WCAG 1.4.3（4.5:1）を大幅に下回る。コード内TODOあり | `badge.spectatorBg`を`gray.600`以上に変更、または背景`gray.100`+テキスト`gray.800`に変更 |

### 推奨（対応が望ましい）

| # | 観点 | ファイル:行 | 指摘事項 | 推奨対応 |
|---|------|------------|---------|---------|
| 9 | バグ・ロジックエラー | `sessions/[id]/schedule/respond/.../ScheduleResponseContent.tsx:68` | `candidates.every()`は空配列で`true`を返す。候補0件時に送信ボタンが有効化される | `candidates.length > 0 && candidates.every(...)` に変更 |
| 10 | バグ・ロジックエラー | `sessions/[id]/actions.ts:469` | `updateSessionPhaseAction`の`phase`パラメータに実行時Zodバリデーションがない。Server Actionはクライアントから任意値を送信可能 | `z.enum([...])` でバリデーション追加 |
| 11 | セキュリティ | `sessions/participantAdapter.ts:13` | `isSessionManager`がDBエラーを無視して`false`を返す。エラー隠蔽でデバッグ困難 | `error`存在時にログ出力するか`Result<boolean>`に変更 |
| 12 | コーディング規約準拠 | `sessions/[id]/applications/.../ApplicationApprovalContent.tsx:13` | Props型名が`Props`。「コンポーネント名+Props」規約に反する | `ApplicationApprovalContentProps`にリネーム |
| 13 | コーディング規約準拠 | `sessions/[id]/applications/.../ApplicationCard.tsx:11` | Props型名が`Props`。「コンポーネント名+Props」規約に反する | `ApplicationCardProps`にリネーム |
| 14 | 設計・保守性 | `sessions/[id]/page.tsx:18` | `UserRole`型が`page.tsx`にローカル定義。各コンポーネントで同一リテラル型を手動再定義（SSoT違反） | `interface.ts`に`UserRole`を定義してエクスポート、各コンポーネントでimport |
| 15 | コーディング規約準拠 | `components/blocks/ScheduleCalendar/ScheduleCalendar.tsx:48-80` | `PreviousMonthButton`と`NextMonthButton`が同ファイルに定義（1ファイル1コンポーネント規則違反） | 別ファイルに分離 |
| 16 | 設計・保守性 | `sessions/[id]/_components/SessionActions.tsx:181` | `currentUserId`を`_currentUserId`として受け取り未使用。Props設計が不完全 | 不要ならPropsから削除、将来実装ならJSDocで明示 |
| 17 | 設計・保守性 | `sessions/[id]/_components/SessionActions.tsx:69-176` | `getAvailableActions`がフェーズ文字列を直接`===`比較。`db/enum.ts`の`SessionPhases`定数を使用していない | `SessionPhases.RECRUITING.value`等の定数を使用 |
| 18 | UX・アクセシビリティ | `sessions/[id]/schedule/summary/.../ScheduleSummaryContent.tsx:104-106` | テーブルヘッダーの「○」「△」「×」が記号のみ。スクリーンリーダーが意味を読み上げられない | `<span className="sr-only">参加可能</span>`等を追加 |
| 19 | パフォーマンス | `sessions/[id]/adapter.ts:64-73` | `getSessionDetail`が`game_sessions` JOIN後にさらに`users`テーブルへ別クエリを発行（2回のDB往復） | Supabase外部キーエイリアスで1クエリに統合 |
| 20 | UX・アクセシビリティ | `sessions/[id]/schedule/respond/.../ScheduleResponseContent.tsx:132-158` | 可用性ボタン（○△×）の記号の意味を示す凡例がページ上に非表示 | 回答セクションに凡例（○=参加可能、△=条件付き、×=不可）を表示 |
| 21 | パフォーマンス | `sessions/[id]/applications/.../ApplicationCard.tsx:41-48` | `PARTICIPANT_TYPE_MAP`がコンポーネント関数内に定義されレンダーごとに再生成 | コンポーネント外の定数として移動 |

### 検討（余裕があれば）

| # | 観点 | ファイル:行 | 指摘事項 | 推奨対応 |
|---|------|------------|---------|---------|
| 22 | バグ・ロジックエラー | `sessions/[id]/adapter.ts:168` | `updateSessionMemo`のadapter関数に`userId`チェックがなく、直接呼び出し時に認可バイパス可能 | 関数シグネチャに`userId`を追加し`eq('keeper_id', userId)`条件を追加 |
| 23 | バグ・ロジックエラー | `sessions/[id]/adapter.ts:297` | `getSessionTimeline`の完了イベントで`updated_at`を使用。完了後のレコード更新で日時が不正確になりうる（TODOコメント記載済み） | `completed_at`カラムを追加 |
| 24 | 設計・保守性 | `sessions/[id]/adapter.ts:32-188` | `getSessionDetail`が160行超で複数の変換責務を持つ | 変換ロジックをプライベートヘルパー関数に分離 |
| 25 | 設計・保守性 | `sessions/[id]/applications/.../ApplicationCard.tsx:110-118` | `application.user.image`条件分岐の両ブランチが同一render（デッドコード） | 条件分岐を削除して単一の`<User size={20} />`に統一 |
| 26 | 設計・保守性 | `components/blocks/ScheduleCalendar/ScheduleCalendar.tsx:20` | `markers` propが`_markers`として受け取られ未使用 | TODOコメントで明記するか型定義から除外 |
| 27 | UX・アクセシビリティ | `sessions/[id]/_components/CancelSessionDialog.tsx:127-129` | サーバーエラー表示にアイコンがなく、他ダイアログの`WarningCircle`付き実装と非一貫的 | `WarningCircle`アイコンを追加して統一 |
| 28 | UX・アクセシビリティ | `sessions/[id]/_components/BasicInfoSection.tsx:38-44` | フェーズバッジが全フェーズで同じ`●`記号を使用し色のみで区別（WCAG 1.4.1懸念） | フェーズごとに異なるPhosphorアイコンに変更 |
| 29 | UX・アクセシビリティ | `sessions/[id]/_components/ToolsSection.tsx:87-94` | 「カレンダーに追加」ボタンが`disabled`のみで無効化理由が非表示 | `aria-describedby`で理由を通知 |
| 30 | パフォーマンス | `sessions/[id]/_components/SessionActions.tsx:56-176` | `getAvailableActions`が`icon`プロパティとして毎回新規JSX要素を生成 | アイコンコンポーネント参照を保持しrender時に展開するパターンに変更 |

## 良い点

- すべてのServer Actionsで認証チェック（`getCurrentUserId()` + `isNil`確認）を先頭で行う一貫したパターンが確立されている
- `upsertSessionLink`、`deleteSessionLink`で`link_id`と`session_id`の両方をWHERE条件に含め、IDOR攻撃を防止
- `confirm_schedule` RPC関数をアトミックなDB操作として定義し、日程確定ロジックの一貫性を保証
- 楽観的ロック（`updated_at`比較）により同時編集の競合を適切に検出
- Result型（`ok`/`err`）が全adapter・actionsファイルで一貫して使用され、エラーハンドリングパターンが統一
- `SessionDetailPage`で`Promise.all`による並列フェッチ（3クエリ同時）、`ApplicationsPage`でも同様
- `getSessionTimeline`でも`Promise.all`で参加者・スケジュールを並列取得
- `ScheduleSummaryContent`の`useMemo`、`ScheduleCalendar`の`useCallback`で適切にメモ化
- `ApplicationApprovalContent.tsx`で`useOptimistic` + `useTransition`を使った楽観的更新が正しく実装
- WAI-ARIAパターン（radiogroup、tablist、alert、aria-pressed）が適切に実装
- `ParticipationRequestDialog`の文字数カウンターに`aria-live="polite"` + `sr-only`テキスト
- 全インタラクティブ要素にフォーカスリング（`outline: 'focusRing'`トークン）が一貫して設定
- `@phosphor-icons/react/ssr`からのみインポートし、SSR対応が完璧
- `adapter.ts`/`interface.ts`/`page.tsx`/`actions.ts`/`schema.ts`/`styles.ts`のページ構成パターンが全新規ページで一貫
- LogTape使用が徹底され`console.log`の使用が皆無
- `isNil`によるnull/undefinedチェックが全コンポーネント・adapterで徹底
- Zodスキーマから`z.infer`で型を導出し、型の二重管理を回避
- PandaCSSスタイルが全て`styles.ts`に分離、インラインスタイルなし
- セマンティックHTMLが正しく使用（`<section>`, `<article>`, `<main>`, `<ul>/<li>`, 見出し階層）
- `loading.tsx`のスケルトンUIがSuspenseフォールバックとして適切に機能
- 空状態メッセージが参加者・タイムライン・ツール・集計画面すべてに実装
- セッションリンクURLのスキームを`http://`/`https://`に限定し、`javascript:`等の危険なスキームによるXSSを防止

## 総合所見

セッションフロー機能の大規模実装として、アーキテクチャパターン（責務分離、Result型、楽観的更新）は非常に高い水準で統一されている。アクセシビリティ対応（WAI-ARIA、フォーカスリング、空状態）もほぼ完備されている。

**最優先で対応すべき問題**: セキュリティ関連3件（#1 認可チェック順序、#2 candidateId帰属検証、#3 schedule_responses RLS）は本番環境でのデータ漏洩・不正操作リスクがあり、マージ前に必ず修正すべき。

**次に優先**: コーディング規約違反（#4 マジックナンバー、#5 生トークン）、設計規約違反（#6 useState禁止、#7 型二重管理）、コントラスト比不足（#8）は品質基準を満たすために対応が必要。

規約・設計面の指摘は個々には軽微だが件数が多いため総合評価Dとなった。セキュリティ3件を修正し規約違反を解消すれば、B評価以上に改善する見込み。
