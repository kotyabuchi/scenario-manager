# セッション日程調整リデザイン 実装レビュー計画（バッチ別）

## 目的

`docs/plans/session-availability-confirmation-redesign.md` の実装について、直近コミット履歴と現行コードを突き合わせて、**Batch 1〜7 + 追加実装**の充足度をレビューする。

## 対象

- 計画書: `docs/plans/session-availability-confirmation-redesign.md`
- 主な実装コミット範囲: `c1189c8` 〜 `eb4e90c`
- 関連フォローアップコミットを含む（同レンジ内）:
  - `6b8ec6f` フェーズ制約のサーバー側強化
  - `b2b1c14` セッション詳細で複数確定枠表示
  - `dd13ee7` `auth_user_id` 完全移行
  - `eb4e90c` `sessions/new` 初期候補保存の可用枠移行 + 旧候補日DB/RPC削除

## レビュー単位（バッチ）

1. Batch 1: DB基盤と型定義
2. Batch 2: Adapter / Server Actions
3. Batch 3: 集計・おすすめロジック（純関数）
4. Batch 4: 共通 UI 基盤
5. Batch 5: 提出 UI（全員）
6. Batch 6: 確定 UI（主催者/GM/KP）
7. Batch 7: セッション詳細導線統合 + 旧導線整理
8. 追加実装: `0014`, `0015`-`0017`（auth完全移行 / `sessions/new`移行 / 旧DB削除）

## 判定ルール

- `DONE`: 計画どおり実装完了（軽微な構成差は許容）
- `PARTIAL`: 実装はあるが、計画からの乖離・未達要件・検証不足がある
- `MISSING`: 該当実装が見当たらない

## 観点

- 計画充足度（Batch/Step 実装有無）
- 計画からの乖離（配置・命名・採用パターン）
- 追加修正の妥当性（フェーズ制約、表示改善）
- テスト/Storybook の実在確認
- 未確認事項（未実行の自動/手動テスト）

## 証跡ソース

- `git log --oneline --name-status`（コミット範囲）
- 実装ファイルの存在確認（`availability`, `schedule/confirm`, `supabase/migrations`, `src/lib/availability`）
- 主要実装のスポット確認（RLS、フェーズガード、UIワークスペース、セッション詳細導線）

## 出力

- 実装レビュー結果（バッチ別）:
  - `docs/reviews/session-availability-confirmation-redesign-impl-review.md`

## 実行メモ

- 既存の `docs/plans/session-availability-confirmation-redesign.md` は未コミット変更があるため編集しない
- 本レビューは「コード/履歴確認ベース」。`pnpm check` / `pnpm vitest` / 手動テストは別途実行が必要

