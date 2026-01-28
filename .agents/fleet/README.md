# Fleet - WezTermマルチエージェントシステム

パイレーツ・オブ・カリビアン風の海賊船団をモチーフにした、Claude Codeマルチエージェント構成。
ジャック・スパロウのような船長を筆頭に、航海士と水夫が並列で作業を遂行する。

## 前提条件

- [WezTerm](https://wezfurlong.org/wezterm/) がインストール済み
- Claude Code がインストール済み
- Claude Max プラン（複数インスタンス同時実行のため推奨）

## 船団構成

| ロール | 人数 | 役割 | キャラクター |
|--------|------|------|-------------|
| 🎩 船長 (Captain) | 1 | 全体指揮・ユーザーとの対話 | ジャック・スパロウ風 |
| 🗺️ 航海士 (Navigator) | 1 | タスク分解・進捗管理 | バルボッサ風の知恵者 |
| ⚓ 水夫 (Sailor) | 3 | 実作業の並列実行 | ブラックパール号の甲板員 |

## 起動方法

WezTermのターミナルで以下を実行:

```powershell
cd C:\Development\Nextjs\scenario-manager
.\.agents\fleet\launch.ps1
```

5ペインに分割され、船長ペインでClaude Codeが自動起動する。
航海士・水夫は船長の指示で必要に応じて起動される（段階的起動）。

## 通信フロー（非対称）

```
ユーザー → 船長 → voyages/ に航海命令(YAML)を作成
                → send-order.ps1 で航海士に通知
                → セッションを終了

航海士 → タスクを分解 → 各水夫に send-order.ps1 で指示
                     → セッションを終了

水夫 → 作業実行 → reports/ に報告(YAML)を作成
              → 航海士に send-order.ps1 で通知
              → セッションを終了

航海士 → reports/ を確認 → dashboard.md を更新
                        → 「🚨 要対応」に航海完了を記載
                        → セッションを終了

船長 → 次回セッションで dashboard.md を確認
    → 「🚨 要対応」の項目を処理
    → ユーザーに報告
```

**重要**: 下から上への `send-order.ps1` は禁止（水夫→航海士を除く）

## ファイル構成

```
.agents/fleet/
├── captain.md          # 船長のシステムプロンプト
├── navigator.md        # 航海士のシステムプロンプト
├── sailor.md           # 水夫のシステムプロンプト
├── launch.ps1          # 船団起動スクリプト
├── send-order.ps1      # 指示送信ユーティリティ
├── filelock.ps1        # ファイルロック管理
├── dashboard.md        # 航海日誌（リアルタイムダッシュボード）
├── panes.json          # ペインID記録（起動時に自動生成）
├── locks.json          # ファイルロック状態（自動生成）
├── voyages/            # 航海命令（タスク定義YAML）
├── reports/            # 完了報告（報告YAML）
└── skill-proposals/    # スキル・改善提案のドラフト
```

## 主要機能

### 航海命令（YAML通信）
タスクの詳細はYAMLファイルに記述し、`send-order.ps1`では通知のみ送る。
これによりトークン消費を抑え、正確な情報伝達を実現する。

### ダッシュボード（`dashboard.md`）
航海士がリアルタイムで更新する進捗ダッシュボード。
- 航海の状態、タスク進捗、乗組員の状態
- ファイルロック状況
- 船長への上申（スキル提案、改善提案、判断要請、エラー報告）

### ファイルロック（`filelock.ps1`）
水夫同士が同じファイルを同時編集しないよう制御する。

```powershell
# ロック取得
.\.agents\fleet\filelock.ps1 -Action lock -File "src/path/to/file.ts" -Owner sailor1

# ロック解放
.\.agents\fleet\filelock.ps1 -Action unlock -File "src/path/to/file.ts" -Owner sailor1

# ロック確認
.\.agents\fleet\filelock.ps1 -Action check -File "src/path/to/file.ts"

# 全ロック一覧
.\.agents\fleet\filelock.ps1 -Action list
```

### ペルソナ（動的変更）
航海士がタスクごとに最適なペルソナを水夫に割り当てる。

| タスク内容 | ペルソナ |
|-----------|---------|
| UI/スタイル修正 | シニアフロントエンドエンジニア |
| ロジック実装 | シニアバックエンドエンジニア |
| テスト作成・実行 | テストエンジニア（QA） |
| ビルド・デプロイ確認 | DevOpsエンジニア |

### スキル自動提案
航海完了時に航海士が過去の報告を分析し、繰り返しパターンを検知したらスキル化を提案する。
採用されたスキルは `.claude/commands/` に配置され `/コマンド名` で使えるようになる。

### 改善提案
同種のエラーが2回以上繰り返された場合、航海士が改善策を提案する。

| 改善の種類 | 対象 |
|-----------|------|
| ルール追加 | `.claude/rules/` に新規ファイル |
| 規約追記 | `coding-standards.md` に追記 |
| プロンプト修正 | エージェントの `.md` を修正 |
| CLAUDE.md追記 | プロジェクト方針の追加 |

## ユーティリティ

### send-order.ps1

```powershell
# 航海士にメッセージ送信
.\.agents\fleet\send-order.ps1 -Target navigator -Message "新たな航海命令: voyage-001"

# 水夫1でClaude Codeを起動
.\.agents\fleet\send-order.ps1 -Target sailor1 -StartClaude

# 水夫2にタスクを通知
.\.agents\fleet\send-order.ps1 -Target sailor2 -Message "作戦あり: voyage-001/task-002"
```

## ステータス

| 状態 | 英名 | 意味 |
|------|------|------|
| ⚓ 停泊中 | docked | 準備中・未着手 |
| ⛵ 航行中 | underway | 作業中 |
| 🏴 投錨 | anchored | 完了 |
| 💀 座礁 | aground | 失敗・エラー |
