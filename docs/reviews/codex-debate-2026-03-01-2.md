# Codex Debate レビューレポート

> **日時**: 2026-03-01
> **対象**: game_schedules → game_sessions 統合の未コミット差分
> **ラウンド数**: 2/5
> **採用指摘数**: 3 / 全6件

## 対象ファイル

| ファイル | 行数 | 種別 |
|----------|------|------|
| `supabase/migrations/0021_merge_game_schedules_into_game_sessions.sql` | 81 | 新規（マイグレーション） |
| `supabase/migrations/0022_fix_schedule_rpc_auth_and_type.sql` | 88 | 新規（修正マイグレーション） |
| `src/db/types.ts` | 1600+ | 再生成 |
| `src/db/helpers.ts` | - | GameScheduleRow 削除 |
| `src/app/(main)/sessions/interface.ts` | - | GameSchedule 型削除 |
| `src/app/(main)/home/interface.ts` | - | schedule プロパティ削除 |
| `src/app/(main)/sessions/adapter.ts` | - | game_schedules JOIN 削除 |
| `src/app/(main)/sessions/[id]/adapter.ts` | - | game_schedules JOIN 削除 |
| `src/app/(main)/scenarios/[id]/adapter.ts` | - | schedule エイリアス削除 |
| `src/app/(main)/home/adapter.ts` | - | game_schedules クエリ変更 |
| `src/app/(main)/sessions/[id]/scheduleFlowGuards.ts` | - | 2クエリ→1クエリ統合 |
| `src/app/(main)/sessions/[id]/_components/sessionActionsModel.ts` | - | schedulePhase 型変更 |
| `src/app/(main)/sessions/[id]/_components/SessionActions.tsx` | - | schedule?.schedulePhase 簡略化 |
| `src/app/(main)/sessions/[id]/_components/sections/basic-info/BasicInfoSection.tsx` | - | schedule?.scheduleDate 簡略化 |
| `src/app/(main)/sessions/_components/SessionCard.tsx` | - | schedule?.scheduleDate 簡略化 |
| `src/app/(main)/sessions/_components/CalendarView.tsx` | - | schedule?.scheduleDate 簡略化 |
| `src/app/(main)/home/_components/HeroSection.tsx` | - | schedule 変数削除 |
| `src/app/(main)/home/_components/UpcomingSessions.tsx` | - | schedule?.scheduleDate 簡略化 |
| `src/app/(main)/home/_components/_mocks.ts` | - | schedule オブジェクト → インライン |
| `src/app/(main)/sessions/[id]/_components/SessionDetailContent.stories.tsx` | - | schedule: null → scheduleDate/Phase |
| `src/app/(main)/sessions/[id]/_components/__tests__/sessionActionsModel.test.ts` | - | null → ADJUSTING |
| `src/app/(main)/sessions/__tests__/adapter.test.ts` | - | game_schedules INSERT → UPDATE |
| `src/__tests__/helpers/fixtures.ts` | - | game_schedules DELETE 削除 |

## Codex の指摘（3件）

| # | ファイル:行 | 問題 | 改善案 | 優先度 |
|---|------------|------|--------|--------|
| C-1 | 0021:54-63 | SECURITY DEFINER 関数に auth.uid() の非NULL チェックのみで、p_actor_user_id の偽装が可能 | current_app_user_id() で認証ユーザーと一致確認 + keeper/creator の EXISTS チェック | 高 |
| C-2 | 0021:18 | p_schedule_date が TIMESTAMP だが game_sessions.schedule_date も TIMESTAMP。TIMESTAMPTZ との不統一 | RPC の引数型を TIMESTAMPTZ に統一 | 中 |
| C-3 | 0021:58 | UPDATE 後に行が見つからなかった場合のチェックがない | IF NOT FOUND THEN RAISE EXCEPTION 追加 | 中 |

## Claude の指摘（3件）

| # | ファイル:行 | 問題 | 改善案 | 優先度 |
|---|------------|------|--------|--------|
| A-1 | 0021:11 | DROP FUNCTION のシグネチャが TIMESTAMPTZ だが新関数は TIMESTAMP。旧関数が TIMESTAMPTZ だった場合 DROP されない | 一貫した型使用 | 低 |
| A-2 | stories.tsx:190 | `as SessionDetail['scenario']` キャスト | Storybook モックでは許容範囲 | 低 |
| A-3 | _mocks.ts:138 | `schedulePhase: 'CONFIRMED' as const` キャスト | モックデータでは許容範囲 | 低 |

## 議論サマリー

### 合意点（初回で一致、即採用）

なし（全項目が議論を経て採用/却下）

### ラリーの記録

#### C-1: SECURITY DEFINER 関数の認可不足
- **R1 Codex**: auth.uid() の非NULL チェックだけでは不十分。p_actor_user_id を任意の値に設定して他ユーザーのセッション日程を変更可能
- **R1 Claude**: 攻撃シナリオは妥当。ただし `current_app_user_id()` というプロジェクト既存のヘルパーがあり、これで auth.uid() → app user_id のマッピングを取得し、p_actor_user_id と一致確認すべき。さらに keeper/creator の EXISTS チェックも必要
- **R2 Codex**: 【修正】current_app_user_id() の存在を踏まえ、3段階認可（auth.uid() 非NULL → current_app_user_id() == p_actor_user_id → keeper/creator EXISTS）を推奨
- **R2 Claude**: 完全合意。この3段階認可を採用
- **結論**: 採用（3段階認可チェックを実装）

#### C-2: TIMESTAMP vs TIMESTAMPTZ 不統一
- **R1 Codex**: schedule_date カラムが TIMESTAMP で p_schedule_date も TIMESTAMP だが、アプリ全体の一貫性のため TIMESTAMPTZ にすべき
- **R1 Claude**: カラム型は TIMESTAMP で定義済みのため変更は別タスク。ただし RPC 引数を TIMESTAMPTZ にすることで暗黙変換を活用し、呼び出し側の利便性は向上する
- **R2 Codex**: 【修正】カラム型の変更は影響大のため見送り。RPC 引数のみ TIMESTAMPTZ に戻す提案に縮小
- **R2 Claude**: 合意。RPC 引数を TIMESTAMPTZ に変更
- **結論**: 修正して採用（RPC 引数のみ TIMESTAMPTZ に変更）

#### C-3: UPDATE 後の NOT FOUND チェック欠如
- **R1 Codex**: 存在しない session_id が渡された場合、UPDATE が0行に影響し、後続の DELETE + INSERT が空で実行される。エラーにすべき
- **R1 Claude**: 認可チェック（EXISTS）で session_id の存在は事実上確認されるため、TOCTOU の競合以外では発生しない。ただし防御的プログラミングとして追加は妥当
- **R2 Codex**: 【維持】防御的プログラミングとして有益。低コスト
- **R2 Claude**: 合意。IF NOT FOUND を追加
- **結論**: 採用（IF NOT FOUND THEN RAISE EXCEPTION 追加）

### 議論を経て採用

| 指摘 | 最終ラウンド | Codex → Claude のラリー概要 | 結論 |
|------|:-----------:|---------------------------|------|
| C-1 | R2 | Codex: 認可不足 → Claude: current_app_user_id() 活用を提案 → Codex: 合意 | 採用（3段階認可） |
| C-2 | R2 | Codex: TIMESTAMPTZ 統一 → Claude: カラム変更は別タスク → Codex: RPC引数のみに縮小 | 修正して採用 |
| C-3 | R2 | Codex: NOT FOUND チェック → Claude: EXISTS で事実上カバーだが防御的に妥当 | 採用 |

### 議論を経て却下

| 指摘 | 最終ラウンド | 却下理由 |
|------|:-----------:|---------|
| A-2 | - | Storybook モックでの `as` キャストは許容範囲 |
| A-3 | - | モックデータでの `as const` は TypeScript の型推論支援として適切 |

## 実施した改善

| # | ファイル | 改善内容 | 出典 |
|---|---------|---------|------|
| 1 | `supabase/migrations/0022_fix_schedule_rpc_auth_and_type.sql` | 旧 RPC を DROP し、3段階認可 + TIMESTAMPTZ 引数 + NOT FOUND チェック付きで再作成 | C-1, C-2, C-3 合意 |

## 検証結果

- lint/format: PASS（656 files, 1 fixed）
- ビルド: PASS
- テスト: PASS（21/21 — adapter.test.ts 統合テスト）

## 所見

SECURITY DEFINER 関数はRLSをバイパスするため、関数内での認可チェックが不可欠。
今回の統合で RPC を再作成する機会に、`current_app_user_id()` を活用した3段階認可（認証確認 → ユーザーID一致 → セッション権限確認）を導入できたのは大きな改善。
差分レビューで Codex が指摘した「直接 RPC 呼び出しによる p_actor_user_id 偽装」は、Claude 単独では見落としやすいセキュリティ観点だった。
