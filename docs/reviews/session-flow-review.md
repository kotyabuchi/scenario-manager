# セッションフロー実装計画 レビューレポート

> **反映ステータス**: 反映済み（2026-02-17）
> **反映内容**: 必須 2件 + 推奨 5件 + 検討 3件
> **レビュー日時**: 2026-02-17（第4回レビュー）
> **対象ファイル**: `docs/plans/session-flow.md`
> **総合評価**: B
> **前回評価**: B → B（前回必須3件すべて反映済み。新たに技術的課題2件を検出）

## サマリー

第3回レビューで指摘された必須3件（辞退後の再申請処理、adapter.tsのWITHDRAWN除外Step、辞退理由の必須/任意統一）、推奨5件、検討3件はすべて計画に反映済み。加えて `created_by_id` / `isSessionManager()` の導入設計も高品質で、セッション操作権限の設計が完成した。計画全体として38ファイル・6バッチの大規模実装に対して十分な詳細度を持ち、実装フェーズへの移行が可能な状態にある。

ただし、`confirmSchedule()` のアトミック性保証と `created_by_id` マイグレーションの安全策という2つの技術的課題が残存しており、実装前の対処を推奨する。

## 評価詳細

### 1. 技術的妥当性 WARN

**良い点**:
- `isSessionManager()` の設計が明確（`keeper_id || created_by_id` チェック、Before/Afterコード例付き）
- `created_by_id` のNOT NULL制約追加マイグレーションが段階的（ADD COLUMN → UPDATE → SET NOT NULL）
- `schedule_candidates` のRLSポリシーが `created_by_id` に対応済み（`keeper_id = auth.uid() OR created_by_id = auth.uid()`）
- `confirmSchedule()` の4操作が詳細に定義済み
- `validatePhaseTransition()` でフェーズ遷移を制御
- `react-day-picker` + `date-fns` はa11y内蔵で適切な選定

**問題点**:
- **`confirmSchedule()` のアトミック性（重要）**: Step 4-1 で「トランザクション的に実行」と記載された4操作（候補CONFIRMED、他候補CANCELLED、`game_schedules.schedule_date` 更新、`schedule_phase` CONFIRMED更新）は、2テーブル（`schedule_candidates` + `game_schedules`）にまたがる。Supabase JS clientはマルチテーブルトランザクションをネイティブにサポートしないため、中間状態でエラーが発生した場合にデータ不整合が生じるリスクがある
- **`created_by_id` マイグレーションの安全策**: `keeper_id: string | null`（`types.ts:201`）であり、DB定義上 `keeper_id = NULL` のレコードが存在しうる。現在の `createSession()` は常に `keeper_id` を設定するが、手動データ投入や過去の仕様変更で NULL レコードが存在した場合、`SET NOT NULL` 制約追加が失敗する

**軽微な懸念**:
- セッションフェーズ変更時の楽観的ロックが未定義。2ユーザーが同時に `updateSessionPhaseAction` を呼んだ場合の競合制御が考慮されていない
- `react-day-picker` + `date-fns` の追加によるバンドルサイズ影響が未評価。`date-fns` は tree-shakeable だが `react-day-picker` のCSS + ロケール込みサイズを事前確認すべき

### 2. 網羅性・考慮漏れ OK

**良い点**:
- 前回必須3件（再申請処理、WITHDRAWN除外Step、辞退理由統一）がすべて反映済み
- Step 1-4 に `applyToSession()` の WITHDRAWN → PENDING 復帰コード例が追加
- Step 1-4 に `cancelApplication()` の WITHDRAWN チェックが追加
- Step 1-5 として一覧表示ロジックの WITHDRAWN 除外が独立Stepで追加（4関数すべて網羅）
- 前提条件セクションに WITHDRAWN 関連の修正項目が追記
- 決定事項テーブルに辞退後の再申請方針・辞退理由方針・申請拒否方針が明記
- 空状態表示の定義が充実（参加者ゼロ、リンクゼロ、候補日ゼロ等）

**軽微な懸念**:
- `withdrawFromSession()` のWITHDRAWN移行後、辞退者の `schedule_responses`（日程回答）の処理方針が未定義。辞退者の回答を集計結果に含めるか除外するかを決定事項に追記すべき
- 要件定義P0に「セッション前日リマインダー」があるが、計画Phase 1スコープに含まれていない（通知全般がPhase 2延期のため）。意図的なスコープ判断であれば決定事項に明記推奨

### 3. セキュリティ OK

**良い点**:
- `isSessionManager()` により認可チェックが `keeper_id || created_by_id` に統一
- `upsertLinkAction` / `deleteLinkAction` に `isSessionManager()` 認可が追記済み（前回推奨指摘反映）
- `sessionLinkSchema` で `javascript:` URL 防止
- `updateCharacterSheetAction` で本人確認チェック明記
- `scheduleCandidatesFormSchema` に `.max(30)` 上限設定
- `schedule_candidates` RLSポリシーが `created_by_id` 対応済み
- `cancelApplicationAction` に WITHDRAWN チェック追加

**軽微な懸念**:
- `schedule_responses` の既存RLSポリシーがFK変更後も有効か未確認。Plan本文に注意事項テキストはあるが、具体的な確認手順・修正SQLが不足
- Step 3-4 `applications/page.tsx` の「GM権限チェック」は `isSessionManager()` に置き換えるべき（`created_by_id` ユーザーも申請管理できるべき）

### 4. UX・アクセシビリティ OK

**良い点**:
- カレンダーのWCAG 2.1 AA準拠が具体的（キーボード操作、ARIA属性、タッチ44x44px）
- ○△×ラジオボタンの `aria-label` に日本語テキスト
- モバイル対応（`mdDown`で1カラムフォールバック）
- ローディング状態・トースト通知の共通パターンが決定事項に定義済み
- 辞退理由の必須/任意が「必須」に統一され、決定事項テーブルに根拠が明記
- キャンセルダイアログの二重確認UI検討が記載
- 完了ダイアログのアニメーション方針が明記（CSS優先、外部ライブラリは最終手段）

### 5. 保守性・拡張性 OK

**良い点**:
- `isSessionManager()` ヘルパーへの一元化により、将来の権限拡張が容易
- 既存パターン（adapter/interface/actions/schema分離）に忠実
- `ScheduleCalendar` を共通コンポーネントとして抽出
- Phase 1/2 スコープ分離が明確
- サブコンポーネントのインライン開始→段階的分離アプローチが許容

**軽微な懸念**:
- `isSessionManager()` への移行時、`approveApplication`, `rejectApplication`, `cancelSession` 等すべての呼び出し箇所の更新漏れリスク。Step 1-4 の注記で言及されているが、対象関数の完全なリストが欲しい

### 6. プロジェクト整合性 OK

**良い点**:
- CLAUDE.md の規約に準拠（Result型、PandaCSS、Ark UI、Biome）
- React Hook Form + Zod パターンが既存と整合
- 参加タイプが `PLAYER | SPECTATOR` のみ（KEEPERは `keeper_id` で管理）
- Enum定義パターンが `enum.ts` の既存構造と一致
- `helpers.ts` への型追加が Step 1-2 に明記
- Server Actions の認可パターンが統一（`isSessionManager()` / 参加者チェック / 本人チェック）
- セッション作成時の `created_by_id: userId` 設定が Step 6-2 に明記

### 7. 実行可能性 OK

**良い点**:
- 6バッチの依存関係が明確
- チーム戦略で5エージェント分担が定義
- 検証方法が自動テスト + 手動テストの両面
- DBマイグレーションのSQL実行順序が正確（7ステップ + ロールバック）
- Step 3-8 として申請承認スタイル定義が追加（前回推奨指摘反映）
- `confirmSchedule()` の4操作が詳細に記述済み

**軽微な懸念**:
- E2Eテストの `beforeEach` セットアップで、Supabase Auth のモック戦略（GMユーザー・PLユーザーの認証模擬）が未定義。既存E2Eテストのパターンがあれば踏襲すべき

## 改善提案

### 必須（実装前に対処すべき）

| # | 視点 | 指摘事項 | 推奨対応 |
|---|------|---------|---------|
| 1 | 技術的妥当性 | `confirmSchedule()` の4操作が2テーブルにまたがるが、Supabase JS clientではマルチテーブルトランザクションがサポートされない。中間状態（候補はCONFIRMEDだがgame_schedulesが未更新）でエラー時にデータ不整合が発生する | Supabase RPC（PostgreSQL関数）で4操作をラップし、DB側でトランザクション保証する。Step 1-1のSQL群に `confirm_schedule(p_candidate_id TEXT, p_session_id TEXT)` 関数定義を追加し、Step 4-1のアダプターは `.rpc('confirm_schedule', {...})` で呼び出す方式に変更 |
| 2 | 技術的妥当性 | `created_by_id` NOT NULL制約追加時、`keeper_id = NULL` のレコードが存在すると `ALTER TABLE ... SET NOT NULL` が失敗する。`keeper_id` は `types.ts:201` で `string \| null` であり、DB定義上NULLが許容されている | Step 1-1 の手順5に安全策を追加: `SELECT COUNT(*) FROM game_sessions WHERE keeper_id IS NULL;` を事前実行し、0件であることを確認してから `SET NOT NULL` を実行。0件でない場合のフォールバック手順（手動で `created_by_id` を設定するか、該当レコードの調査）を記載 |

### 推奨（対応が望ましい）

| # | 視点 | 指摘事項 | 推奨対応 |
|---|------|---------|---------|
| 1 | 網羅性 | 辞退者の `schedule_responses`（日程回答）の処理方針が未定義。辞退後も回答が集計結果に含まれると、実質不参加者の意見が日程選定に影響する | 決定事項テーブルに方針を追記。推奨: 辞退時に該当ユーザーの `schedule_responses` を削除（または集計時にWITHDRAWN参加者の回答を除外）。Step 1-4 の `withdrawFromSession()` 修正に対応処理を追記 |
| 2 | セキュリティ | `schedule_responses` の既存RLSポリシーがFK変更（`game_schedules` → `schedule_candidates`）後も正常動作するか未確認。JOINパスが変わるためRLS条件が機能しなくなる可能性 | Step 1-1 の注意事項を具体化: FK変更前に `SELECT * FROM pg_policies WHERE tablename = 'schedule_responses';` で既存ポリシーを確認し、必要に応じてポリシーを再作成するSQLを準備 |
| 3 | 保守性 | `isSessionGM()` → `isSessionManager()` の移行対象関数の完全リストが不明。Step 1-4 の注記に「approveApplication, rejectApplication, cancelSession 等」とあるが「等」が曖昧 | Step 1-4 に対象関数の網羅リストを追記: `approveApplication`, `rejectApplication`, `cancelSession`, および今回新規追加する全Server Actions（Step 2-2, 3-6, 4-3, 5-5）。既存コードで `isSessionGM` をGrepし、すべての呼び出し箇所を列挙 |
| 4 | セキュリティ | Step 3-4 `applications/page.tsx` の「GM権限チェック」が `isSessionManager()` ではなく「GM権限」と記載。`created_by_id` ユーザー（GM未定セッションの作成者）が申請管理画面にアクセスできない可能性 | Step 3-4 の記述を「`isSessionManager()` による権限チェック」に修正 |
| 5 | 技術的妥当性 | `react-day-picker` + `date-fns` のクライアントバンドルサイズ影響が未評価 | Step 4-5 に注記追加: 依存追加後に `pnpm build` でバンドルサイズを確認し、必要に応じて `date-fns` のロケールを `ja` のみインポートする最適化を検討 |

### 検討（余裕があれば）

| # | 視点 | 指摘事項 | 推奨対応 |
|---|------|---------|---------|
| 1 | 技術的妥当性 | セッションフェーズ変更の楽観的ロックが未定義。2ユーザーが同時に `updateSessionPhaseAction` を呼んだ場合に競合する可能性 | Phase 1 では `updated_at` をWHERE条件に含めるシンプルな楽観的ロックで対応検討。`UPDATE game_sessions SET session_phase = $1 WHERE game_session_id = $2 AND updated_at = $3` で変更が0行なら競合エラー |
| 2 | 網羅性 | 要件定義P0の「セッション前日リマインダー」が計画スコープ外（通知全般がPhase 2）。意図的なスコープ判断だが決定事項テーブルに明記がない | 決定事項テーブルに「通知機能はPhase 1では追加しない。Phase 2で対応予定」の行を追加（既存の行はあるが `NotificationTypes` に限定されている） |
| 3 | 実行可能性 | E2Eテストの認証モック戦略（GMユーザー・PLユーザーの切り替え）が未定義 | 既存E2Eテスト（`e2e/` ディレクトリ）のセットアップパターンを参照し、Step 6-4 に認証戦略を追記 |

## 前回レビューからの改善状況

### 第3回レビュー必須指摘（3件）→ すべて反映済み

| # | 指摘 | 対応状況 |
|---|------|---------|
| 1 | WITHDRAWN導入後の辞退再申請エラー | ✅ 決定事項に「許可する（WITHDRAWN → PENDING復帰）」を明記。Step 1-4 に `applyToSession()` のコード例追加 |
| 2 | `adapter.ts` のWITHDRAWN除外Stepが欠落 | ✅ Step 1-5 として独立Stepを追加。4関数（`getUpcomingSessions`, `getHistorySessions`, `searchPublicSessions`, `getCalendarSessions`）すべて網羅 |
| 3 | 辞退理由の必須/任意が要件定義書と不一致 | ✅ 決定事項テーブルに「必須（200文字以内）」と根拠を明記 |

### 第3回レビュー推奨指摘（5件）→ すべて反映済み

| # | 指摘 | 対応状況 |
|---|------|---------|
| 1 | `searchPublicSessions()` 参加者数にWITHDRAWN含む | ✅ Step 1-5 の修正対象に含まれ、WITHDRAWNフィルタのコード例付き |
| 2 | `upsertLinkAction` / `deleteLinkAction` 認可方針 | ✅ Step 2-2 に `isSessionManager()` 認可チェック追記 |
| 3 | `cancelApplication()` のWITHDRAWNチェック | ✅ Step 1-4 にエラー返却ロジックのコード例付きで追記 |
| 4 | `applications/styles.ts` の作成Step | ✅ Step 3-8 として独立Step追加 |
| 5 | `confirmSchedule()` の詳細動作 | ✅ Step 4-1 に4操作の具体的手順を追記 |

### 第3回レビュー検討指摘（3件）→ すべて反映済み

| # | 指摘 | 対応状況 |
|---|------|---------|
| 1 | `schedule_candidates.created_by` カラム | ✅ テーブル定義に `created_by TEXT REFERENCES users(user_id)` が含まれている |
| 2 | `schedule_responses` RLS確認 | ✅ Step 1-1 注意事項に記載（ただし具体的SQLが不足 → 今回推奨#2で指摘） |
| 3 | 完了アニメーション方針 | ✅ Step 5-4 にCSSアニメーション優先の方針を明記 |

### 追加改善（前回レビュー以降に反映された設計変更）

| # | 変更内容 | 影響範囲 |
|---|---------|---------|
| 1 | `created_by_id` カラム + `isSessionManager()` ヘルパーの導入 | 権限設計の根幹。全Server Actionsの認可チェック、RLSポリシーに波及 |
| 2 | `schedule_candidates` RLSポリシーの `created_by_id` 対応 | GM未定セッションでも作成者が日程候補を操作可能 |
| 3 | ロールバックSQLに `created_by_id` カラム削除を追加 | マイグレーション安全策 |
| 4 | `isSessionGM()` → `isSessionManager()` 移行のBefore/Afterコード追加 | 実装ガイダンスの具体化 |

## 総合所見

第3回レビューのB評価から、必須3件・推奨5件・検討3件がすべて計画に反映された上、`created_by_id` / `isSessionManager()` という大きな設計改善も追加された。これは第3回レビューでは未検出だった「GM未定セッション作成者の操作権限」という根本的な問題に対する適切な解決策である。

今回の新たな指摘は2件の技術的課題に集中している。特に必須#1（`confirmSchedule()` のアトミック性）は、Supabase RPC関数として実装すれば解決できる明確な課題であり、計画への反映コストは低い。必須#2（`created_by_id` マイグレーション安全策）は防御的プログラミングの観点からの指摘であり、SELECTクエリ1行の追加で対応可能。

推奨指摘5件はいずれも実装品質を高める改善であり、辞退者の日程回答処理（推奨#1）は実装時に初めて判断を迫られる可能性が高いため、事前に方針を決めておくことを勧める。

必須2件を対応すれば、計画品質はA評価に引き上げ可能。38ファイル・6バッチの大規模計画として、4回のレビューイテレーションを経て非常に成熟した状態にあり、実装フェーズへの移行に十分な品質を備えている。
