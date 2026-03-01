# Codex Debate レビューレポート

> **日時**: 2026-03-01
> **対象**: `docs/plans/merge-game-schedules.md`（計画書モード）
> **ラウンド数**: 2/5
> **採用指摘数**: 4 / 全7件

## 対象

| ファイル | 種別 |
|----------|------|
| `docs/plans/merge-game-schedules.md` | 実装計画書（20ファイル、4 Batch） |

## Codex の指摘（5件）

| # | セクション | 問題 | 改善案 | 優先度 |
|---|-----------|------|--------|--------|
| C-1 | Step 1-1 | `schedule_date` は既存が `TIMESTAMP`（TZなし）だが計画では `TIMESTAMPTZ` と記載。型不一致でタイムゾーンずれリスク | `TIMESTAMP` に修正 | 高 |
| C-2 | Step 1-1 | 同一リリースで `DROP TABLE` すると旧アプリインスタンスが破壊される | 2段階マイグレーションに分割 | 高 |
| C-3 | Step 1-1 | RPC `replace_confirmed_schedule_time_blocks` に `auth.uid()` チェックがない（SECURITY DEFINER） | 認可チェックを追加 | 高 |
| C-4 | Step 1-1 | `game_schedules_date_idx` が DROP されるが `game_sessions.schedule_date` にインデックスがない | インデックスを追加 | 中 |
| C-5 | Step 1-2 | 手動 `types.ts` 更新で FK/Relationships の不整合リスク | チェックリスト化 | 中 |

## Claude の指摘（2件）

| # | セクション | 問題 | 改善案 | 優先度 |
|---|-----------|------|--------|--------|
| A-1 | Batch 1-2 間 | Batch 1 で `GameScheduleRow` を削除すると参照側が未更新でビルド失敗 | 型削除を Batch 2 末尾に移動 | 中 |
| A-2 | Step 1-1 | インデックス欠落（C-4 と同一） | — | 中 |

## 議論サマリー

### 合意点（初回で一致、即採用）

- C-4/A-2: `game_sessions(schedule_date)` にインデックスを追加

### ラリーの記録

#### C-1: schedule_date の型不一致
- **R1 Codex**: `TIMESTAMP` → `TIMESTAMPTZ` への暗黙変換でタイムゾーンずれリスク
- **R1 Claude**: 同意。既存に合わせ `TIMESTAMP` に修正すべき
- **R2 Codex**: 【修正】計画を `TIMESTAMP` に合わせれば解消
- **結論**: 採用（計画を `TIMESTAMP` に修正）

#### C-2: 同一リリースでの DROP TABLE
- **R1 Codex**: 旧アプリが新DBスキーマを見る期間にクエリが壊れる
- **R1 Claude**: Cloudflare Pages は atomic デプロイ、マイグレーションは手動先行適用。2段階は不要
- **R2 Codex**: 【維持】マイグレーション先行適用の時点で旧アプリが新スキーマを見る時間帯は存在する
- **結論**: 却下（運用上リスクは極めて低い。個人開発で同時アクセスなし。分割コスト > リスク）

#### C-3: RPC の auth.uid() チェック欠如
- **R1 Codex**: SECURITY DEFINER で auth 未検証は任意ユーザーのデータ改変リスク
- **R1 Claude**: 既存の問題でスコープ外。ただし RPC 書き換えのついでに追加は検討に値する
- **R2 Codex**: 【修正】スコープ外は同意。ただし書き換えコストが低いため同時修正推奨
- **結論**: 採用（RPC 再作成時に `auth.uid()` チェックを追加）

#### C-5: 手動 types.ts 更新のリスク
- **R1 Codex**: FK/Relationships の更新漏れリスク
- **R1 Claude**: 計画 Step 1-2 で明示済み
- **R2 Codex**: 【修正】優先度を下げつつ、`game_schedules` 参照ゼロ確認をチェックリスト化
- **結論**: 部分採用（検証方法に grep 確認を追加）

#### A-1: Batch 1 のビルド破壊
- Claude 独自指摘。Batch 1 で `GameScheduleRow` を削除すると Batch 2 まで参照が残りビルドが通らない
- **結論**: 採用（型の削除を Batch 2 の Step 2-8 に移動）

### 議論を経て採用

| 指摘 | 最終ラウンド | ラリー概要 | 結論 |
|------|:-----------:|-----------|------|
| C-1 | R2 | 型を `TIMESTAMP` に合わせることで双方合意 | 採用 |
| C-3 | R2 | 既存問題だが書き換えコスト低いため同時修正 | 採用 |
| C-4/A-2 | R1 | 初回で合意 | 採用 |
| C-5 | R2 | 検証方法に grep 確認を追加 | 部分採用 |
| A-1 | — | Claude 独自。型削除を後続 Batch に移動 | 採用 |

### 議論を経て却下

| 指摘 | 最終ラウンド | 却下理由 |
|------|:-----------:|---------|
| C-2 | R2 | 個人開発プロジェクトで同時アクセスなし。分割コスト > リスク |

## 実施した改善

| # | ファイル | 改善内容 | 出典 |
|---|---------|---------|------|
| 1 | `docs/plans/merge-game-schedules.md` | `TIMESTAMPTZ` → `TIMESTAMP` に修正 | C-1 |
| 2 | `docs/plans/merge-game-schedules.md` | RPC に `auth.uid()` 認可チェック追加を記載 | C-3 |
| 3 | `docs/plans/merge-game-schedules.md` | `game_sessions(schedule_date)` インデックス追加 | C-4/A-2 |
| 4 | `docs/plans/merge-game-schedules.md` | 型削除を Batch 2 Step 2-8 に移動（ビルド維持） | A-1 |
| 5 | `docs/plans/merge-game-schedules.md` | 検証方法に `game_schedules` 参照ゼロ確認を追加 | C-5 |

## 検証結果

- lint/format: N/A（計画書モード）
- ビルド: N/A（計画書モード）
- テスト: N/A（計画書モード）

## 所見

計画書の主要なリスクは Codex が的確に指摘した。特に `schedule_date` の型不一致（C-1）は実装時に発見しにくいバグの原因になり得た。RPC への認可チェック追加（C-3）は既存負債だが、書き換えのついでに解消できるため合理的。Batch 間のビルド整合性（A-1）は Claude の独自分析で発見し、型削除の順序を再編することで解消した。
