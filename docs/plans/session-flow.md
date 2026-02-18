# セッションフロー実装計画

## Context

セッション機能の募集→参加申請→日程調整→進行→完了の一連フローを実装する。

**現状**:
- セッション一覧ページ（3タブ）: 実装済み
- セッション作成フォーム & アクション: 実装済み
- 参加申請アダプター（apply/approve/reject/withdraw/cancel）: 実装済み（テスト付き）
- セッション詳細ページ: **プレースホルダーのみ**（TODO状態）
- 日程調整UI: **未実装**
- キャンセル・辞退ダイアログ: **未実装**
- セッション完了フロー: **未実装**

**デザインモック**: 11画面（`docs/designs/mocks/セッション/` に配置済み）

**DB**: `game_sessions`, `game_schedules`(1:1), `session_participants`, `schedule_responses`, `session_links` テーブルは定義済み。日程調整の複数候補管理用テーブル（`schedule_candidates`）が不足。

## 決定事項

| 項目 | 方針 | 理由 |
|------|------|------|
| 日程候補管理 | `schedule_candidates`テーブルを新規作成 | `game_schedules`は1:1で確定日専用。候補投票には別テーブルが必要 |
| タイムライン | 既存タイムスタンプから合成（新テーブル不要） | MVP では `created_at`/`applied_at`/`approved_at` 等から生成。Phase 2 で events テーブル検討 |
| キャンセル理由保存 | `game_sessions.cancel_reason` カラム追加 | 既存 `cancelSession()` の `_reason` パラメータを活用 |
| 辞退理由保存 | `session_participants.withdrawal_reason` カラム追加 + 辞退時にDELETEではなくステータス更新 | 既存 `withdrawFromSession()` はレコードDELETEだが、理由を保存するにはレコードが必要。`WITHDRAWN` ステータスに変更する方式に移行 |
| 辞退方式 | DELETE → `participant_status = 'WITHDRAWN'` に変更 | レコードを残すことで辞退理由・履歴を保持。一覧表示では WITHDRAWN を除外 |
| 参加申請タイプ | PLAYER / SPECTATOR のみ（KEEPERは除外） | KEEPER は `game_sessions.keeper_id` で管理。既存アダプターと整合 |
| セッション操作権限 | `keeper_id === userId \|\| created_by_id === userId` で判定 | GM未定（`keeper_id = NULL`）でセッション作成可能な要件（Section 3.1「すべて未定」パターン）に対応。作成者は常に操作権限を持つ。GM指名後もセッション管理を継続できる |
| `created_by_id` | `game_sessions` に `created_by_id NOT NULL` カラム追加 | セッション作成者の追跡。`keeper_id` は NULL 許容（GM未定・GM募集状態）。認可は `isSessionManager()` ヘルパーで一元管理 |
| スコープ | Phase 1（MVP）のみ | リスケ・動画登録・通知は後続Phase |
| Server Actions | 各機能ごとに`actions.ts`に分離 | 既存パターンに準拠 |
| スタイリング | `styles.ts`分離 + セマンティックトークン | プロジェクト規約通り |
| フォーム | React Hook Form + Zod | プロジェクト規約通り |
| 楽観的更新 | 承認/拒否/投票の全操作に適用 | UX向上（CLAUDE.md規約） |
| コンポーネント構成 | デザインモックの区画に忠実に分割 | 再利用性と可読性の確保 |
| カレンダーUI | react-day-picker + date-fns を採用 | a11y対応済み（ARIA属性、キーボードナビゲーション内蔵）。自作はコスト・品質リスクが高い |
| フェーズ遷移 | `validatePhaseTransition()` ヘルパーで順序制約を強制 | 任意のフェーズ遷移を防ぎ、RECRUITING→PREPARATION→IN_PROGRESS→COMPLETED の順序を保証 |
| 通知タイプ | Phase 1 では追加しない。Phase 2 で対応予定 | TODO: `NotificationTypes` に SESSION_APPLICATION_RECEIVED、DATE_CONFIRMED 等を追加 |
| テスト戦略 | アダプター単体テスト + Storybook + E2E | 三層で品質保証 |
| ローディング・通知 | Server Action実行中はボタン `disabled` + `SpinnerGap` アイコン表示。完了後はトースト通知（成功: 緑、エラー: 赤） | 全Server Actionで統一パターンを適用。Ark UI Toast を使用 |
| 辞退後の再申請 | 許可する（WITHDRAWN → PENDING に復帰） | WITHDRAWN導入でレコードが残るため、`applyToSession()` で既存レコードがWITHDRAWNならPENDINGに戻す。新規DELETEではなく再利用 |
| 辞退理由 | 必須（200文字以内） | TRPG文化ではGMへの配慮として理由を求めるのが自然。要件定義書（Section 3.6.2）では「任意」だが、Plan側で「必須」に統一 |
| 申請拒否方式 | Phase 1 ではレコードDELETE（現状維持） | `rejectApplication()` の拒否履歴保持は Phase 2 で検討。`REJECTED` ステータス追加も Phase 2 スコープ |
| 辞退者の日程回答 | 辞退時に該当ユーザーの `schedule_responses` を削除 | 辞退者の回答が集計結果に残ると、実質不参加者の意見が日程選定に影響する。集計ロジックの複雑化を避けるため、辞退時にデータを削除する方式を採用 |
| 通知機能 | Phase 1 では通知機能全般を追加しない。Phase 2 で対応予定 | セッション前日リマインダー（要件P0）を含め、通知基盤の構築は Phase 2 スコープ。Phase 1 ではUI上のトースト通知のみで完結する |

## 前提条件

- DB: Supabase に `schedule_candidates` テーブルを作成済みであること（Step 1-1 のSQLを実行）
- FK変更: `schedule_responses.schedule_id` → `schedule_responses.candidate_id` へのFK変更完了
- DBカラム追加: `game_sessions.cancel_reason`, `session_participants.withdrawal_reason` 追加済み
- DB ENUM追加: `participant_status` に `WITHDRAWN` を追加済み
- DBカラム追加: `game_sessions.created_by_id` 追加済み（セッション作成者の追跡用）
- 既存アダプター修正: `isSessionGM()` → `isSessionManager()` への拡張完了（`keeper_id || created_by_id` チェック、Step 1-4）
- 既存アダプター修正: `withdrawFromSession()` のDELETE→ステータス更新方式への移行完了（Step 1-4）
- 既存アダプター修正: `cancelSession()` の `cancel_reason` 保存追加完了（Step 1-4）
- 既存アダプター修正: `applyToSession()` の WITHDRAWN 再申請対応完了（Step 1-4）
- 既存アダプター修正: `cancelApplication()` の WITHDRAWN チェック追加完了（Step 1-4）
- 一覧表示修正: `adapter.ts` の WITHDRAWN 除外フィルタ追加完了（Step 1-5）
- 型: `pnpm supabase gen types typescript --project-id <PROJECT_ID>` で型再生成済みであること
- 環境: feature/session-flow ブランチのワークツリーで作業
- Supabase: プロジェクトID はダッシュボード > Project Settings > General から取得

---

## Batch 1: DB拡張 & 型基盤

日程調整の複数候補管理に必要なDBテーブルと型定義を整備する。

### Step 1-1. schedule_candidates テーブル作成 & DBマイグレーション（Supabase）

Supabase ダッシュボード > SQL Editor で以下を順番に実行:

**1. schedule_candidates テーブル作成**:
```sql
CREATE TYPE schedule_candidate_status AS ENUM ('PENDING', 'CONFIRMED', 'CANCELLED');

CREATE TABLE schedule_candidates (
  candidate_id TEXT PRIMARY KEY,
  session_id TEXT NOT NULL REFERENCES game_sessions(game_session_id) ON DELETE CASCADE,
  candidate_date TIMESTAMPTZ NOT NULL,
  end_time TIMESTAMPTZ,
  status schedule_candidate_status NOT NULL DEFAULT 'PENDING',
  created_by TEXT REFERENCES users(user_id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_schedule_candidates_session ON schedule_candidates(session_id);
```

**2. schedule_responses の FK 変更**:
```sql
-- 既存の FK 制約を削除（実際の制約名は types.ts:479 で確認済み）
ALTER TABLE schedule_responses
  DROP CONSTRAINT IF EXISTS schedule_responses_schedule_id_game_schedules_session_id_fk;

-- カラム名を candidate_id に変更（意味的整合性のため）
ALTER TABLE schedule_responses
  RENAME COLUMN schedule_id TO candidate_id;

-- 新しい FK 制約を追加（schedule_candidates を参照）
ALTER TABLE schedule_responses
  ADD CONSTRAINT schedule_responses_candidate_id_fkey
  FOREIGN KEY (candidate_id) REFERENCES schedule_candidates(candidate_id) ON DELETE CASCADE;
```

**3. game_sessions に cancel_reason カラム追加**:
```sql
ALTER TABLE game_sessions ADD COLUMN cancel_reason TEXT;
```

**4. session_participants に withdrawal_reason カラム追加**:
```sql
ALTER TABLE session_participants ADD COLUMN withdrawal_reason TEXT;
```

**5. game_sessions に created_by_id カラム追加**:
```sql
-- セッション作成者カラム追加（GM未定でも作成者が操作権限を持つため）
ALTER TABLE game_sessions ADD COLUMN created_by_id TEXT REFERENCES users(user_id);

-- 安全確認: keeper_id = NULL のレコードが存在しないことを確認
-- 0件であることを確認してから次のステップに進むこと
-- 0件でない場合は手動で created_by_id を設定するか、該当レコードの調査を行う
SELECT COUNT(*) AS null_keeper_count FROM game_sessions WHERE keeper_id IS NULL;

-- 既存レコードの created_by_id を keeper_id で埋める（既存データはGM=作成者の前提）
UPDATE game_sessions SET created_by_id = keeper_id WHERE created_by_id IS NULL AND keeper_id IS NOT NULL;

-- NOT NULL制約を追加（新規作成時は必ず設定される）
-- 上記の安全確認で0件であることが前提。NULL レコードが残っている場合はこのALTERが失敗する
ALTER TABLE game_sessions ALTER COLUMN created_by_id SET NOT NULL;
```

**6. participant_status ENUM に WITHDRAWN を追加**:
```sql
ALTER TYPE participant_status ADD VALUE IF NOT EXISTS 'WITHDRAWN';
```

**8. `confirm_schedule` RPC関数作成**（日程確定のアトミック操作）:
```sql
CREATE OR REPLACE FUNCTION confirm_schedule(
  p_candidate_id TEXT,
  p_session_id TEXT
) RETURNS void AS $$
BEGIN
  -- 1. 選択された候補を CONFIRMED に更新
  UPDATE schedule_candidates
    SET status = 'CONFIRMED', updated_at = now()
    WHERE candidate_id = p_candidate_id AND session_id = p_session_id;

  -- 2. 同セッションの他候補を CANCELLED に更新
  UPDATE schedule_candidates
    SET status = 'CANCELLED', updated_at = now()
    WHERE session_id = p_session_id AND candidate_id != p_candidate_id;

  -- 3-4. game_schedules の日程・フェーズを更新
  UPDATE game_schedules
    SET schedule_date = (
      SELECT candidate_date FROM schedule_candidates WHERE candidate_id = p_candidate_id
    ),
    schedule_phase = 'CONFIRMED',
    updated_at = now()
    WHERE session_id = p_session_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

> **設計意図**: `confirmSchedule()` の4操作は `schedule_candidates` + `game_schedules` の2テーブルにまたがる。Supabase JS clientはマルチテーブルトランザクションをネイティブにサポートしないため、PostgreSQL関数でラップしDB側でトランザクション保証する。アダプター側は `.rpc('confirm_schedule', { p_candidate_id, p_session_id })` で呼び出す。

**9. schedule_candidates テーブルに RLS ポリシー設定**（既存テーブルパターン踏襲）:
```sql
ALTER TABLE schedule_candidates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "schedule_candidates_select" ON schedule_candidates
  FOR SELECT USING (true);

CREATE POLICY "schedule_candidates_insert" ON schedule_candidates
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM game_sessions
      WHERE game_session_id = session_id
      AND (keeper_id = auth.uid() OR created_by_id = auth.uid())
    )
  );

CREATE POLICY "schedule_candidates_update" ON schedule_candidates
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM game_sessions
      WHERE game_session_id = session_id
      AND (keeper_id = auth.uid() OR created_by_id = auth.uid())
    )
  );

CREATE POLICY "schedule_candidates_delete" ON schedule_candidates
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM game_sessions
      WHERE game_session_id = session_id
      AND (keeper_id = auth.uid() OR created_by_id = auth.uid())
    )
  );
```

> **RLSポリシー確認**: マイグレーション適用後、既存テーブル `schedule_responses` にもRLSポリシーが適切に設定されているか確認する:
> ```sql
> SELECT * FROM pg_policies WHERE tablename = 'schedule_responses';
> ```
> ポリシーが不足している場合は、`schedule_candidates` と同様のパターンで追加する。

**ロールバック SQL**（問題発生時）:
```sql
-- cancel_reason / withdrawal_reason / created_by_id カラム削除
ALTER TABLE game_sessions DROP COLUMN IF EXISTS cancel_reason;
ALTER TABLE game_sessions DROP COLUMN IF EXISTS created_by_id;
ALTER TABLE session_participants DROP COLUMN IF EXISTS withdrawal_reason;

-- WITHDRAWN ステータスのロールバック: PostgreSQL では ALTER TYPE ... DROP VALUE が使えないため、
-- WITHDRAWN 状態のレコードを DELETE してから型を再作成する必要がある。開発環境のみ実施。

-- FK を元に戻す
ALTER TABLE schedule_responses DROP CONSTRAINT IF EXISTS schedule_responses_candidate_id_fkey;
ALTER TABLE schedule_responses RENAME COLUMN candidate_id TO schedule_id;
ALTER TABLE schedule_responses
  ADD CONSTRAINT schedule_responses_schedule_id_fkey
  FOREIGN KEY (schedule_id) REFERENCES game_schedules(session_id) ON DELETE CASCADE;

-- テーブル削除
DROP TABLE IF EXISTS schedule_candidates;
DROP TYPE IF EXISTS schedule_candidate_status;
```

> **注意**: `schedule_responses` の既存RLSポリシーがある場合、FK変更後も正常に動作するか確認すること。FK参照先が `game_schedules` → `schedule_candidates` に変わるため、RLS条件がセッション所有者チェックを行っている場合はJOINパスの更新が必要。

> **注意**: 既存の `schedule_responses` データがある場合、FK変更前にデータ移行が必要。
> 現在は開発環境のため既存データは空の前提で進行。本番環境では移行スクリプトを別途作成すること。

> **将来検討**: 現在は Supabase ダッシュボードでの手動SQL実行に依存しているが、スケールに伴い `supabase migration` CLI への移行を検討する。

### Step 1-2. Supabase 型再生成 & helpers.ts 更新

Supabase ダッシュボード > Project Settings > General からプロジェクトIDを取得し実行:

```bash
pnpm supabase gen types typescript --project-id <PROJECT_ID> > src/db/types.ts
```

> `<PROJECT_ID>` は Supabase のプロジェクト固有ID（英数字の文字列）。
> ローカル開発では `supabase status` で確認可能。

型再生成後、`src/db/helpers.ts` に以下を追加:
- `ScheduleCandidateRow` — `Tables['schedule_candidates']['Row']` のキャメルケース変換型
- `ScheduleCandidateInsert` — `Tables['schedule_candidates']['Insert']` のキャメルケース変換型

### Step 1-3. Enum 定義追加

- 対象ファイル: `src/db/enum.ts`
- 追加:
  - `ScheduleCandidateStatuses` (PENDING, CONFIRMED, CANCELLED)
  - `ParticipantStatuses` に `WITHDRAWN` を追加（辞退時にレコードを残してステータス更新するため）
- 既存（追加不要）:
  - `ScheduleAvailabilities` (OK, MAYBE, NG) — `enum.ts:189-202` に定義済み
  - `SessionLinkTypes` (DISCORD, CCFOLIA, OTHER) — `enum.ts:219-232` に定義済み

> **注意**: DB側の `participant_status` ENUM にも `WITHDRAWN` を追加する必要がある。Step 1-1 の SQL に追記済み。

### Step 1-4. 既存アダプター修正（辞退・キャンセルの理由保存）

- 対象ファイル: `src/app/(main)/sessions/participantAdapter.ts`（変更）
- 修正内容:
  1. **`isSessionGM()` → `isSessionManager()` に拡張**: GM（`keeper_id`）またはセッション作成者（`created_by_id`）のどちらかであれば操作権限を付与
     ```typescript
     // Before: GMのみチェック
     const isSessionGM = async (sessionId: string, userId: string) => {
       const { data: session } = await supabase.from('game_sessions')
         .select('keeper_id').eq('game_session_id', sessionId).maybeSingle();
       return session?.keeper_id === userId;
     };
     // After: GM または 作成者をチェック
     const isSessionManager = async (sessionId: string, userId: string) => {
       const { data: session } = await supabase.from('game_sessions')
         .select('keeper_id, created_by_id').eq('game_session_id', sessionId).maybeSingle();
       return session?.keeper_id === userId || session?.created_by_id === userId;
     };
     ```
     > `isSessionGM` → `isSessionManager` の移行対象（網羅リスト）:
     > - `participantAdapter.ts`: `approveApplication()`, `rejectApplication()`, `cancelSession()`
     > - 新規 Server Actions: `updateMemoAction`, `upsertLinkAction`, `deleteLinkAction`（Step 2-2）、`approveApplicationAction`, `rejectApplicationAction`（Step 3-6）、`createCandidatesAction`, `confirmScheduleAction`（Step 4-3）、`cancelSessionAction`, `completeSessionAction`（Step 5-5）
     > - 新規ページ: `applications/page.tsx`（Step 3-4）
  2. **`withdrawFromSession()`**: レコードDELETE → `participant_status` を `WITHDRAWN` に更新 + `withdrawal_reason` に理由を保存する方式に変更。**辞退時に `schedule_responses` も削除する**（辞退者の回答が日程集計に混入するのを防ぐ）
     ```typescript
     // Before: DELETE
     await supabase.from('session_participants').delete()...
     // After: UPDATE + schedule_responses 削除
     await supabase.from('session_participants').update({
       participant_status: ParticipantStatuses.WITHDRAWN.value,
       withdrawal_reason: reason ?? null,
     })...
     // 辞退者の日程回答を削除（集計結果への影響を排除）
     await supabase.from('schedule_responses').delete()
       .eq('user_id', userId).eq('candidate_id', candidateId)
     ```
  2. **`cancelSession()`**: `_reason` パラメータを活用し、`cancel_reason` カラムに保存
     ```typescript
     // Before: session_phase のみ更新
     await supabase.from('game_sessions').update({
       session_phase: SessionPhases.CANCELLED.value,
     })...
     // After: cancel_reason も同時更新
     await supabase.from('game_sessions').update({
       session_phase: SessionPhases.CANCELLED.value,
       cancel_reason: reason ?? null,
     })...
     ```
  3. **`applyToSession()`**: 重複チェックで既存レコードが WITHDRAWN の場合、PENDING に復帰させて再申請を許可
     ```typescript
     // 既存の重複チェック（participantAdapter.ts:95-104）を修正
     if (!isNil(existingParticipant)) {
       if (existingParticipant.participant_status === ParticipantStatuses.WITHDRAWN.value) {
         // WITHDRAWN → PENDING に復帰（再申請）
         await supabase.from('session_participants').update({
           participant_status: ParticipantStatuses.PENDING.value,
           participant_type: input.participantType,
           application_message: input.applicationMessage ?? null,
           applied_at: new Date().toISOString(),
           withdrawal_reason: null,
         })...
         return ok({ ... });
       }
       return err(new Error(PARTICIPANT_ERROR_MESSAGES.ALREADY_APPLIED));
     }
     ```
  4. **`cancelApplication()`**: WITHDRAWN ステータスのチェックを追加し、WITHDRAWN の場合はエラー返却
     ```typescript
     // WITHDRAWN の場合は取り消し不可
     if (participant.participant_status === ParticipantStatuses.WITHDRAWN.value) {
       return err(new Error(PARTICIPANT_ERROR_MESSAGES.CANNOT_WITHDRAW));
     }
     ```
- 影響範囲:
  - 既存テスト `participantAdapter.test.ts` の辞退テストを修正（DELETE検証 → ステータス更新検証）
  - 既存テスト `participantAdapter.test.ts` に再申請テスト（WITHDRAWN → PENDING 復帰）を追加

### Step 1-5. 一覧表示ロジックの WITHDRAWN 除外

- 対象ファイル: `src/app/(main)/sessions/adapter.ts`（変更）
- 修正内容:
  1. **`getUpcomingSessions()`**: `session_participants` クエリに WITHDRAWN 除外フィルタを追加
     ```typescript
     const { data: userSessions } = await supabase
       .from('session_participants')
       .select('session_id, participant_type')
       .eq('user_id', userId)
       .neq('participant_status', ParticipantStatuses.WITHDRAWN.value);
     ```
  2. **`getHistorySessions()`**: 同様に WITHDRAWN 除外フィルタを追加
  3. **`searchPublicSessions()`**: 参加者数カウント（`adapter.ts:144-148`）に WITHDRAWN 除外を追加
     ```typescript
     const { data: participants } = await supabase
       .from('session_participants')
       .select('session_id')
       .in('session_id', sessionIds)
       .neq('participant_status', ParticipantStatuses.WITHDRAWN.value);
     ```
  4. **`getCalendarSessions()`**: 同様に WITHDRAWN 除外フィルタを追加
- 影響範囲:
  - セッション一覧の3タブ（参加予定/参加履歴/公開卓）すべてに影響
  - カレンダービューにも影響

### Step 1-6. interface.ts 型拡張

- 対象ファイル: `src/app/(main)/sessions/interface.ts`
- 追加する型:
  - `ScheduleCandidate` - DB Row型から導出
  - `ScheduleResponse` - DB Row型から導出
  - `SessionLink` - DB Row型から導出
  - `ScheduleCandidateWithResponses` - 候補 + 回答集計
  - `SessionDetail` - 詳細ページ用の統合型（セッション + 参加者 + スケジュール + リンク）

---

## Batch 2: セッション詳細ページ

デザインモック「セッション詳細ページ」に基づき、セッション情報の一元表示ページを構築する。

### Step 2-1. セッション詳細アダプター

- 対象ファイル: `src/app/(main)/sessions/[id]/adapter.ts`（新規）
- 関数:
  - `getSessionDetail(sessionId)` → セッション + シナリオ + 参加者 + スケジュール + リンク を一括取得
  - `getSessionTimeline(sessionId)` → タイムライン用イベント取得（既存タイムスタンプから合成）
    - **データソース**: 新テーブルは作成せず、既存テーブルのタイムスタンプを合成して生成
    - **パフォーマンス**: 4テーブルから合成するため、実装時にクエリ実行時間を計測。必要に応じて単一のUNION queryにまとめるか、バッチ取得に最適化
    - `game_sessions.created_at` → 「セッション作成」
    - `session_participants.applied_at` → 「参加申請」
    - `session_participants.approved_at` → 「参加承認」
    - `game_schedules.start_date` 確定時 → 「日程確定」
    - `game_sessions.phase` が COMPLETED → 「セッション完了」
    - 各イベントを `{ type, date, actor?, description }` 形式で返却し、日時順でソート
  - `updateSessionMemo(sessionId, memo)` → GMメモ更新
  - `getSessionLinks(sessionId)` → セッション用リンク取得
  - `upsertSessionLink(sessionId, linkData)` → リンク追加/更新
  - `deleteSessionLink(linkId)` → リンク削除
  - `updateCharacterSheetUrl(sessionId, userId, url)` → キャラシURL更新

### Step 2-2. セッション詳細 Server Actions

- 対象ファイル: `src/app/(main)/sessions/[id]/actions.ts`（新規）
- アクション:
  - `updateMemoAction(sessionId, memo)` - GMメモ保存
    - 認可チェック: `isSessionManager()` で検証（GM または セッション作成者のみ操作可能）
  - `upsertLinkAction(sessionId, linkData)` - リンク追加/更新
    - 認可チェック: `isSessionManager()`（GM または セッション作成者）
  - `deleteLinkAction(linkId)` - リンク削除
    - 認可チェック: `isSessionManager()`（GM または セッション作成者）
  - `updateCharacterSheetAction(sessionId, url)` - キャラシURL更新
    - 認可チェック: 認証ユーザーの userId と更新対象の参加者 userId が一致することを検証（他人のキャラシ更新を防止）
  - `updateSessionPhaseAction(sessionId, phase)` - フェーズ変更
    - `validatePhaseTransition(currentPhase, nextPhase)` ヘルパーを使用し、許可された遷移のみ実行
    - 許可遷移: RECRUITING→PREPARATION→IN_PROGRESS→COMPLETED、任意→CANCELLED
    - 不正な遷移は `err(new Error('Invalid phase transition'))` を返却
    - **楽観的ロック**: `updated_at` を条件に含め、更新時に `.eq('updated_at', expectedUpdatedAt)` で競合を検出。0行更新の場合は `err(new Error('Conflict: session was modified'))` を返却し、クライアント側でリロードを促す

### Step 2-3. セッション詳細 Zodスキーマ

- 対象ファイル: `src/app/(main)/sessions/[id]/schema.ts`（新規）
- スキーマ:
  - `sessionMemoSchema` - メモ（2000文字以内）
  - `sessionLinkSchema` - リンク（URL + タイプ + ラベル）
    - URL: `z.string().url().refine(url => url.startsWith('http'), { message: 'http:// または https:// で始まるURLを入力してください' })` で `javascript:` URL を防止
  - `characterSheetSchema` - キャラシURL

### Step 2-4. セッション詳細ページ Server Component

- 対象ファイル: `src/app/(main)/sessions/[id]/page.tsx`（変更）
- 実装:
  - `getSessionDetail()` でデータ取得
  - 認証チェック（セッション管理者（GM or 作成者）/参加者/一般で表示を分岐）
  - `SessionDetailContent` に props を渡す

### Step 2-5. セッション詳細スタイル定義

- 対象ファイル: `src/app/(main)/sessions/[id]/styles.ts`（新規）
- デザインモック「セッション詳細ページ」に基づくスタイル:
  - 2カラムレイアウト（メイン + サイドバー）
    - モバイル（`mdDown`）: 1カラム表示にフォールバック、サイドバーはメインカラムの下に配置
  - 各セクションカード
  - 参加者リスト、タイムライン
  - 各セクションの空状態表示（参加者ゼロ、リンクゼロ等）

### Step 2-6. SessionDetailContent コンポーネント

- 対象ファイル: `src/app/(main)/sessions/[id]/_components/SessionDetailContent.tsx`（新規）
- 左カラム:
  - `BasicInfoSection` - システムバッジ、シナリオリンク、日時、ツール、GM情報
  - `ParticipantsSection` - 参加者リスト（役割別、CSステータス表示）
  - `GMNotesSection` - GMメモ（GM のみ表示、インライン編集）
- 右カラム（サイドバー）:
  - `ToolsSection` - Discord/ココフォリア等のリンク集
  - `TimelineSection` - セッションイベント時系列

### Step 2-7. 各サブコンポーネント

- `BasicInfoSection.tsx` - 基本情報カード
- `ParticipantsSection.tsx` - 参加者一覧（役割アイコン、キャラシステータスバッジ）。空状態: 「まだ参加者がいません」メッセージ表示
- `ParticipantCard.tsx` - 参加者1人分のカード
- `GMNotesSection.tsx` - GMメモ（テキストエリア + 保存ボタン）
- `ToolsSection.tsx` - 外部ツールリンク（コピーボタン付き）
- `TimelineSection.tsx` - タイムラインリスト
- `SessionActions.tsx` - セッション操作ボタン群（フェーズに応じて変化）

### Step 2-8. セッション詳細テスト

- `src/app/(main)/sessions/[id]/__tests__/adapter.test.ts` - アダプターテスト
- `src/app/(main)/sessions/[id]/_components/SessionDetailContent.stories.tsx` - Storybook

---

## Batch 3: 参加申請・承認フロー

デザインモック「参加申請ダイアログ」「参加申請承認画面」に基づき、申請から承認までのフローを構築する。

### Step 3-1. 参加申請ダイアログ

- 対象ファイル: `src/app/(main)/sessions/[id]/_components/ParticipationRequestDialog.tsx`（新規）
- UI要素（モック「セッション募集フォーム_4」準拠）:
  - セッション情報サマリー
  - 参加タイプ選択（プレイヤー/観戦者のラジオカード）
  - 一言メッセージテキストエリア
  - 申請送信ボタン
- 使用: Ark UI Dialog + React Hook Form

> **設計判断**: KEEPER（GM）はセッション作成時に `game_sessions.keeper_id` で設定されるため、参加申請経由では選択できない。既存 `participantAdapter.applyToSession()` の `ApplyToSessionInput` も `PLAYER | SPECTATOR` のみを受け付ける。

### Step 3-2. 参加申請スキーマ

- 対象ファイル: `src/app/(main)/sessions/[id]/schema.ts`（追加）
- `participationRequestSchema`:
  - `participantType`: PLAYER | SPECTATOR（KEEPERはセッション作成時に設定済み）
  - `applicationMessage`: 200文字以内（任意）

### Step 3-3. 参加申請 Server Action

- 対象ファイル: `src/app/(main)/sessions/[id]/actions.ts`（追加）
- `applyToSessionAction(sessionId, data)`:
  - 認証チェック
  - Zodバリデーション
  - `participantAdapter.applyToSession()` 呼び出し
  - revalidatePath

### Step 3-4. 参加申請承認ページ

- 対象ファイル: `src/app/(main)/sessions/[id]/applications/page.tsx`（新規）
- Server Component:
  - `isSessionManager()` による権限チェック
  - 申請一覧取得
  - `ApplicationApprovalContent` に渡す

### Step 3-5. 申請承認アダプター

- 対象ファイル: `src/app/(main)/sessions/[id]/applications/adapter.ts`（新規）
- `getApplications(sessionId)` → PENDING/CONFIRMED 申請一覧（ユーザー情報付き）
- `getApplicationStats(sessionId)` → 申請統計（承認数/保留数/合計）

### Step 3-6. 申請承認 Server Actions

- 対象ファイル: `src/app/(main)/sessions/[id]/applications/actions.ts`（新規）
- `approveApplicationAction(sessionId, userId)` - 承認
- `rejectApplicationAction(sessionId, userId)` - 拒否
- 楽観的更新対応（revalidatePath）

### Step 3-7. ApplicationApprovalContent コンポーネント

- 対象ファイル: `src/app/(main)/sessions/[id]/applications/_components/ApplicationApprovalContent.tsx`（新規）
- デザインモック「参加申請承認画面」準拠:
  - ヘッダー（セッション情報、進捗バー）
  - フィルター・検索バー
  - 申請カードグリッド
- 子コンポーネント:
  - `ApplicationCard.tsx` - 1件の申請カード（アバター、経歴、メッセージ、承認/拒否ボタン）
  - `ApplicationFilters.tsx` - フィルター

### Step 3-8. 申請承認スタイル定義

- 対象ファイル: `src/app/(main)/sessions/[id]/applications/styles.ts`（新規）
- デザインモック「参加申請承認画面」に基づくスタイル:
  - 申請カードグリッドレイアウト
  - フィルターバー
  - ヘッダー（進捗バー含む）

### Step 3-9. 参加申請テスト

- `src/app/(main)/sessions/[id]/applications/__tests__/adapter.test.ts` - アダプターテスト
- `src/app/(main)/sessions/[id]/_components/ParticipationRequestDialog.stories.tsx` - Storybook
- `src/app/(main)/sessions/[id]/applications/_components/ApplicationApprovalContent.stories.tsx`

---

## Batch 4: 日程調整

デザインモック「日程候補選択画面」「日程回答画面」「日程集計・確定画面」に基づき、日程調整フローを構築する。

### Step 4-1. 日程調整アダプター

- 対象ファイル: `src/app/(main)/sessions/[id]/schedule/adapter.ts`（新規）
- 関数:
  - `createScheduleCandidates(sessionId, candidates[])` → 候補日時一括登録
  - `getScheduleCandidates(sessionId)` → 候補一覧（回答集計付き）
  - `submitScheduleResponse(sessionId, responses[])` → 回答送信（upsert）
  - `getScheduleResponses(sessionId)` → 全参加者の回答取得
  - `confirmSchedule(sessionId, candidateId)` → 日程確定。Step 1-1 で作成した `confirm_schedule` RPC関数を呼び出し、DB側でトランザクション保証する:
    ```typescript
    const { error } = await supabase.rpc('confirm_schedule', {
      p_candidate_id: candidateId,
      p_session_id: sessionId,
    })
    ```
    RPC内部で以下の4操作をアトミックに実行:
    1. 選択された候補の `status` を `CONFIRMED` に更新
    2. 同セッションの他候補の `status` を `CANCELLED` に更新
    3. `game_schedules.schedule_date` に確定候補の日時を設定
    4. `game_schedules.schedule_phase` を `CONFIRMED` に更新
  - `getScheduleSummary(sessionId)` → 集計結果（候補ごとの○△×人数）

### Step 4-2. 日程調整 Zodスキーマ

- 対象ファイル: `src/app/(main)/sessions/[id]/schedule/schema.ts`（新規）
- `scheduleCandidateSchema`:
  - `candidateDate`: ISO 8601 日時
  - `endTime`: ISO 8601 日時（任意）
- `scheduleCandidatesFormSchema`:
  - `candidates`: 上記の配列（1件以上、最大30件: `.min(1).max(30)`）
  - `timeSetting`: "batch" | "individual"
- `scheduleResponseSchema`:
  - `responses`: Array<{ candidateId, availability: OK|MAYBE|NG }>
  - `comment`: 200文字以内（任意）

### Step 4-3. 日程調整 Server Actions

- 対象ファイル: `src/app/(main)/sessions/[id]/schedule/actions.ts`（新規）
- `createCandidatesAction(sessionId, data)` - GM: 候補作成
    - 認可チェック: `isSessionManager()`（GM または セッション作成者）
- `submitResponseAction(sessionId, data)` - PL: 回答送信
    - 認可チェック: `session_participants` にレコードが存在する参加者のみ（参加者専用操作）
- `confirmScheduleAction(sessionId, candidateId)` - GM: 日程確定
    - 認可チェック: `isSessionManager()`（GM または セッション作成者）

### Step 4-4. 日程候補選択ページ（GM用）

- 対象ファイル: `src/app/(main)/sessions/[id]/schedule/page.tsx`（新規）
- デザインモック「日程候補選択画面」準拠:
  - カレンダーUI（月表示、日付クリック選択）
  - 選択日程タグ表示
  - 時間設定セクション（一括/個別）
  - 「候補を確定する」ボタン

### Step 4-5. カレンダーコンポーネント

- 対象ファイル: `src/components/blocks/ScheduleCalendar/ScheduleCalendar.tsx`（新規）
- **ライブラリ**: `react-day-picker` + `date-fns`（a11y対応済みコンポーネントをベースにカスタマイズ）
- 共通カレンダーコンポーネント（日程候補選択 + 回答画面で再利用）:
  - 月表示、前後月移動
  - 日付セルのクリック選択
  - 選択状態のハイライト
  - 参加者アバター表示（回答画面用）
  - 候補日ゼロの空状態: 「日程候補がありません」メッセージ表示
- **アクセシビリティ要件**（WCAG 2.1 AA準拠）:
  - キーボードナビゲーション: 矢印キーで日付移動、Enter で選択、Escape でキャンセル（react-day-picker 内蔵）
  - ARIA属性: `role="grid"`, `aria-label="日程候補カレンダー"`, `aria-selected` で選択状態を通知
  - フォーカスリング: `borders.focusRing` トークンを使用
  - モバイル: タッチ操作に十分なセルサイズ（最低44x44px）を確保
- スタイル: `ScheduleCalendar/styles.ts`（PandaCSSでreact-day-pickerのデフォルトスタイルをオーバーライド）
- 依存追加: `pnpm add react-day-picker date-fns`
- **バンドルサイズ評価**: 導入後に `pnpm build` でビルドし、クライアントバンドルへの影響を確認。`date-fns` はツリーシェイキング対応だが、`react-day-picker` のCSSインポート方法（全量 vs 必要分のみ）に注意

### Step 4-6. 日程回答ページ（PL用）

- 対象ファイル: `src/app/(main)/sessions/[id]/schedule/respond/page.tsx`（新規）
- デザインモック「日程回答画面」準拠:
  - セッション情報ヘッダー
  - テーブル型候補日時一覧（他参加者の回答アバター表示）
  - 各候補に○△×ラジオボタン（`aria-label` 付与: ○=「参加可能」、△=「条件付き参加可能」、×=「参加不可」）
  - コメントテキストエリア
  - 「回答を送信」ボタン

### Step 4-7. 日程集計・確定ページ（GM用）

- 対象ファイル: `src/app/(main)/sessions/[id]/schedule/summary/page.tsx`（新規）
- デザインモック「日程集計・確定画面」準拠:
  - 候補日時テーブル（○△×未の集計数、推奨バッジ）
  - ラジオボタンで確定日選択
  - 回答詳細セクション（コラプシブル）
  - 「確定する」ボタン

### Step 4-8. 日程調整サブコンポーネント

- `ScheduleCandidateForm.tsx` - 候補日時入力フォーム（カレンダー + 時間設定）
- `ScheduleResponseTable.tsx` - 回答テーブル（○△×ラジオ）
- `ScheduleSummaryTable.tsx` - 集計テーブル（推奨表示付き）
- `ResponseDetailCollapsible.tsx` - 回答詳細（参加者ごと）
- `SelectedDatesDisplay.tsx` - 選択日程タグ表示

### Step 4-9. 日程調整テスト

- `src/app/(main)/sessions/[id]/schedule/__tests__/adapter.test.ts` - アダプターテスト
- `src/app/(main)/sessions/[id]/schedule/__tests__/schema.test.ts` - スキーマテスト
- Storybook: 各コンポーネント

---

## Batch 5: ライフサイクルダイアログ

デザインモック「キャンセル・辞退ダイアログ」「セッション完了ダイアログ」に基づく。

### Step 5-1. キャンセルダイアログ（GM用）

- 対象ファイル: `src/app/(main)/sessions/[id]/_components/CancelSessionDialog.tsx`（新規）
- デザインモック「キャンセル・辞退ダイアログ」GM版準拠:
  - 警告ヘッダー
  - 影響説明（赤背景ボックス）
  - キャンセル理由テキストエリア（任意）
  - 「キャンセルする」ボタン（赤）
  - **二重確認**: キャンセルは全参加者に影響する操作のため、確認ダイアログ内で「キャンセル」と入力してから実行する方式を検討
- アクション: `cancelSessionAction` → `participantAdapter.cancelSession()` を呼び出し（Step 1-4 で修正済み: `cancel_reason` カラムに理由を自動保存）

### Step 5-2. 辞退ダイアログ（PL用）

- 対象ファイル: `src/app/(main)/sessions/[id]/_components/WithdrawDialog.tsx`（新規）
- デザインモック「キャンセル・辞退ダイアログ」PL版準拠:
  - ヘッダー
  - 影響説明
  - 辞退理由テキストエリア（必須、200文字）
  - 「辞退する」ボタン
- アクション: `withdrawAction` → `participantAdapter.withdrawFromSession()` を呼び出し（Step 1-4 で修正済み: レコードDELETEではなく `participant_status` を `WITHDRAWN` に更新 + `withdrawal_reason` に理由を保存）

### Step 5-3. 申請取り消しダイアログ

- 対象ファイル: `src/app/(main)/sessions/[id]/_components/CancelApplicationDialog.tsx`（新規）
- PENDING ステータスのみ表示
- アクション: `cancelApplicationAction` → `participantAdapter.cancelApplication()`

### Step 5-4. セッション完了ダイアログ

- 対象ファイル: `src/app/(main)/sessions/[id]/_components/CompleteSessionDialog.tsx`（新規）
- デザインモック「セッション完了ダイアログ」準拠:
  - 確認画面（セッション情報、GMメモ入力）
  - 成功画面（チェックアニメーション、レビュー促進ボタン）
    - **アニメーション方針**: CSSアニメーション（`@keyframes` + PandaCSS）で実装。外部ライブラリ（Framer Motion等）は導入しない。実装時にパフォーマンス・表現力が不足する場合のみ検討
- 2段階UI（確認 → 成功）
- アクション: `completeSessionAction` → フェーズを COMPLETED に更新

### Step 5-5. ライフサイクル Server Actions

- 対象ファイル: `src/app/(main)/sessions/[id]/actions.ts`（追加）
- `cancelSessionAction(sessionId, reason?)` - キャンセル（`game_sessions.cancel_reason` に保存）
- `withdrawFromSessionAction(sessionId, reason?)` - 辞退（`session_participants.withdrawal_reason` に保存）
- `cancelApplicationAction(sessionId)` - 申請取り消し
- `completeSessionAction(sessionId, completionNote?)` - 完了

### Step 5-6. ライフサイクル Zodスキーマ

- 対象ファイル: `src/app/(main)/sessions/[id]/schema.ts`（追加）
- `cancelSessionSchema` - 理由（500文字以内、任意）
- `withdrawSchema` - 理由（200文字以内、必須）
- `completeSessionSchema` - 完了メモ（500文字以内、任意）

### Step 5-7. ライフサイクルテスト

- Storybook: 各ダイアログ
- `src/app/(main)/sessions/[id]/__tests__/actions.test.ts` - Server Actionsテスト

---

## Batch 6: 統合 & 品質保証

全機能を結合し、E2Eテストとレビューで品質を確保する。

### Step 6-1. セッション詳細ページへの統合

- `SessionDetailContent` から各ダイアログ・ページへのナビゲーション統合:
  - 「参加申請する」ボタン → `ParticipationRequestDialog`
  - 「申請管理」ボタン → `/sessions/[id]/applications`
  - 「日程を調整する」ボタン → `/sessions/[id]/schedule`
  - 「キャンセル」→ `CancelSessionDialog`
  - 「辞退」→ `WithdrawDialog`
  - 「完了にする」→ `CompleteSessionDialog`
- フェーズに応じたボタン表示/非表示制御

### Step 6-2. セッション作成フォーム & アダプター修正

- 対象ファイル: `src/app/(main)/sessions/new/_components/SessionForm.tsx`（変更）
- 対象ファイル: `src/app/(main)/sessions/new/adapter.ts`（変更）
- Phase 1 スコープ:
  - `adapter.ts`: セッション作成時に `created_by_id: userId` を設定（既存の `keeper_id: userId` と並行）
  - セッション詳細ページへの遷移リンク追加
  - 既存フォームの軽微なUI調整（モック準拠のレイアウト微修正）
- **Phase 2 に延期**（スコープ過大のため）:
  - メンバー追加UI（@ユーザーID検索）
  - シナリオ検索モーダル（既存シナリオ選択 + ID/URL指定）

### Step 6-3. ビルド & Lint チェック

```bash
pnpm check
pnpm build
```

### Step 6-4. E2E テスト

- 対象ファイル: `e2e/sessions/session-flow.spec.ts`（新規）
- **テストデータセットアップ**: `e2e/fixtures/session-data.ts` にテスト用データ生成ヘルパーを作成
  - GMユーザー、PLユーザーの作成
  - テスト用セッション（各フェーズ）の作成
  - `beforeEach` でクリーンアップ & シード投入
- **認証モック戦略**: E2Eテストでは Supabase Auth のモックが必要。`e2e/fixtures/auth-helpers.ts` にログインヘルパーを用意し、テスト用ユーザーの認証トークンをセットアップする。GM用・PL用の2ユーザーを `beforeAll` で認証し、テスト間でセッションを再利用する
- テストシナリオ:
  - セッション作成 → 詳細ページ表示
  - 参加申請 → GM承認 → 参加者に表示
  - 日程候補作成 → PL回答 → GM確定
  - セッションキャンセル
  - 参加者辞退
  - セッション完了 → レビュー促進表示

### Step 6-5. コードレビュー

- `/review-diff` でコード品質チェック
- アクセシビリティ確認（WCAG 2.1 AA準拠）
- パフォーマンス確認（Server Componentの最大活用）

---

## ファイル一覧

### 新規ファイル

| ファイル | 用途 |
|---------|------|
| `src/app/(main)/sessions/[id]/adapter.ts` | セッション詳細アダプター |
| `src/app/(main)/sessions/[id]/actions.ts` | セッション詳細 Server Actions |
| `src/app/(main)/sessions/[id]/schema.ts` | Zodスキーマ（メモ、リンク、参加申請、ライフサイクル） |
| `src/app/(main)/sessions/[id]/styles.ts` | セッション詳細スタイル |
| `src/app/(main)/sessions/[id]/_components/SessionDetailContent.tsx` | 詳細ページメインコンポーネント |
| `src/app/(main)/sessions/[id]/_components/BasicInfoSection.tsx` | 基本情報セクション |
| `src/app/(main)/sessions/[id]/_components/ParticipantsSection.tsx` | 参加者一覧セクション |
| `src/app/(main)/sessions/[id]/_components/ParticipantCard.tsx` | 参加者カード |
| `src/app/(main)/sessions/[id]/_components/GMNotesSection.tsx` | GMメモセクション |
| `src/app/(main)/sessions/[id]/_components/ToolsSection.tsx` | ツール・リンクセクション |
| `src/app/(main)/sessions/[id]/_components/TimelineSection.tsx` | タイムライン |
| `src/app/(main)/sessions/[id]/_components/SessionActions.tsx` | 操作ボタン群 |
| `src/app/(main)/sessions/[id]/_components/ParticipationRequestDialog.tsx` | 参加申請ダイアログ |
| `src/app/(main)/sessions/[id]/_components/CancelSessionDialog.tsx` | キャンセルダイアログ |
| `src/app/(main)/sessions/[id]/_components/WithdrawDialog.tsx` | 辞退ダイアログ |
| `src/app/(main)/sessions/[id]/_components/CancelApplicationDialog.tsx` | 申請取り消しダイアログ |
| `src/app/(main)/sessions/[id]/_components/CompleteSessionDialog.tsx` | 完了ダイアログ |
| `src/app/(main)/sessions/[id]/applications/page.tsx` | 申請承認ページ |
| `src/app/(main)/sessions/[id]/applications/adapter.ts` | 申請承認アダプター |
| `src/app/(main)/sessions/[id]/applications/actions.ts` | 申請承認 Actions |
| `src/app/(main)/sessions/[id]/applications/styles.ts` | 申請承認スタイル |
| `src/app/(main)/sessions/[id]/applications/_components/ApplicationApprovalContent.tsx` | 承認ページ本体 |
| `src/app/(main)/sessions/[id]/applications/_components/ApplicationCard.tsx` | 申請カード |
| `src/app/(main)/sessions/[id]/applications/_components/ApplicationFilters.tsx` | フィルター |
| `src/app/(main)/sessions/[id]/schedule/page.tsx` | 日程候補選択ページ |
| `src/app/(main)/sessions/[id]/schedule/adapter.ts` | 日程調整アダプター |
| `src/app/(main)/sessions/[id]/schedule/actions.ts` | 日程調整 Actions |
| `src/app/(main)/sessions/[id]/schedule/schema.ts` | 日程調整スキーマ |
| `src/app/(main)/sessions/[id]/schedule/styles.ts` | 日程調整スタイル |
| `src/app/(main)/sessions/[id]/schedule/respond/page.tsx` | 日程回答ページ |
| `src/app/(main)/sessions/[id]/schedule/summary/page.tsx` | 日程集計ページ |
| `src/app/(main)/sessions/[id]/schedule/_components/ScheduleCandidateForm.tsx` | 候補入力フォーム |
| `src/app/(main)/sessions/[id]/schedule/_components/ScheduleResponseTable.tsx` | 回答テーブル |
| `src/app/(main)/sessions/[id]/schedule/_components/ScheduleSummaryTable.tsx` | 集計テーブル |
| `src/app/(main)/sessions/[id]/schedule/_components/ResponseDetailCollapsible.tsx` | 回答詳細 |
| `src/app/(main)/sessions/[id]/schedule/_components/SelectedDatesDisplay.tsx` | 選択日程表示 |
| `src/components/blocks/ScheduleCalendar/ScheduleCalendar.tsx` | カレンダーコンポーネント |
| `src/components/blocks/ScheduleCalendar/styles.ts` | カレンダースタイル |
| `src/components/blocks/ScheduleCalendar/index.ts` | エクスポート |
| `e2e/fixtures/session-data.ts` | E2Eテスト用データ生成ヘルパー |

### 変更ファイル

| ファイル | 変更内容 |
|---------|---------|
| `src/db/enum.ts` | `ScheduleCandidateStatuses` 追加、`ParticipantStatuses` に `WITHDRAWN` 追加 |
| `src/db/types.ts` | Supabase型再生成（schedule_candidates追加） |
| `src/app/(main)/sessions/interface.ts` | 新型定義追加 |
| `src/app/(main)/sessions/[id]/page.tsx` | プレースホルダー → 詳細ページ実装 |
| `src/app/(main)/sessions/participantAdapter.ts` | `isSessionGM()` → `isSessionManager()` 拡張（`keeper_id \|\| created_by_id`）、`withdrawFromSession()` をDELETEからステータス更新方式に変更、`cancelSession()` に `cancel_reason` 保存追加、`applyToSession()` にWITHDRAWN再申請対応追加、`cancelApplication()` にWITHDRAWNチェック追加 |
| `src/app/(main)/sessions/__tests__/participantAdapter.test.ts` | 辞退テストをステータス更新方式に修正 |
| `src/app/(main)/sessions/adapter.ts` | `getUpcomingSessions()`・`getHistorySessions()`・`searchPublicSessions()`・`getCalendarSessions()` にWITHDRAWN除外フィルタ追加（Step 1-5） |
| `src/db/helpers.ts` | `ScheduleCandidateRow` / `ScheduleCandidateInsert` 型追加 |
| `src/app/(main)/sessions/new/adapter.ts` | セッション作成時に `created_by_id: userId` を設定 |
| `src/app/(main)/sessions/new/_components/SessionForm.tsx` | 軽微なUI調整（メンバー追加・シナリオ検索はPhase 2） |
| `package.json` | `react-day-picker`, `date-fns` 依存追加 |

## チーム戦略

6つのBatchを以下のチーム構成で並行実施:

| エージェント | 担当 | 並行可能 |
|-------------|------|---------|
| team-lead | 全体統括、Batch 1（DB/型）、Batch 6（統合） | - |
| backend-dev | Batch 2 アダプター/Actions, Batch 3 アダプター/Actions, Batch 4 アダプター/Actions | Batch 2→3→4 順次 |
| frontend-dev | Batch 2 UI, Batch 3 UI, Batch 5 ダイアログ UI | Batch 2→3→5 順次 |
| schedule-dev | Batch 4 UI（カレンダー + 日程調整画面） | Batch 1完了後開始 |
| test-dev | 各Batch完了後にテスト作成 | 各Batch完了次第 |

> **開発コスト最適化**: 新規ファイルが38個と多いため、Batch 2 のサブコンポーネントは初期段階では `SessionDetailContent.tsx` 内にインラインで実装し、複雑化した段階でファイル分離する段階的アプローチも許容する。

**依存関係**:
- Batch 1 → 全Batch（型定義が基盤）
- Batch 2 → Batch 3, 5（詳細ページがダイアログのホスト）
- Batch 2, 3, 4, 5 → Batch 6（統合）

## 検証方法

### 自動テスト

```bash
# アダプターテスト
pnpm vitest run src/app/(main)/sessions/[id]/__tests__/
pnpm vitest run src/app/(main)/sessions/[id]/applications/__tests__/
pnpm vitest run src/app/(main)/sessions/[id]/schedule/__tests__/

# スキーマテスト
pnpm vitest run src/app/(main)/sessions/[id]/__tests__/schema.test.ts

# Storybook
pnpm storybook

# E2E
pnpm exec playwright test e2e/sessions/session-flow.spec.ts

# 品質チェック
pnpm check
pnpm build
```

### 手動テスト

- [ ] セッション作成 → 詳細ページ遷移が正常
- [ ] 参加申請ダイアログが開閉、送信できる
- [ ] GM承認画面で承認/拒否が動作する
- [ ] 日程候補のカレンダー選択が直感的に操作できる
- [ ] PL日程回答の○△×選択が正常に保存される
- [ ] GM日程確定が全参加者に反映される
- [ ] キャンセル/辞退ダイアログが正常に動作する
- [ ] セッション完了後にレビュー促進画面が表示される
- [ ] キーボード操作（Tab、Enter、Escape）が全ダイアログで機能する
- [ ] モバイル表示でレイアウトが崩れない
