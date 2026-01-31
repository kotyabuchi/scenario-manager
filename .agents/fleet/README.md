# Fleet - WezTermマルチエージェントシステム

パイレーツ・オブ・カリビアン風の海賊船団をモチーフにした、Claude Codeマルチエージェント構成。
TDD（テスト駆動開発）サイクルに対応した5役職構成で、品質保証を構造的に組み込む。

## 前提条件

- [WezTerm](https://wezfurlong.org/wezterm/) がインストール済み
- **PowerShell 7+（pwsh）** がインストール済み（PS5は非対応。全スクリプトを `pwsh -File` で実行すること）
- Claude Code がインストール済み
- Claude Max プラン（複数インスタンス同時実行のため推奨）

## 船団構成

| ロール | 人数 | 役割 | TDDフェーズ | キャラクター |
|--------|------|------|-----------|-------------|
| 🎩 船長 (Captain) | 1 | 全体指揮・ユーザーとの対話 | - | ジャック・スパロウ風 |
| 🗺️ 航海士 (Navigator) | 1 | タスク分解・進捗管理 | 計画 | バルボッサ風の知恵者 |
| ⚓ 甲板長 (Bosun) | 1 | 実装 | Green | 力強く実直な現場責任者 |
| 🔭 見張り番 (Lookout) | 1 | レビュー・品質検証 | Review | 冷静で鋭い観察眼 |
| 🔨 船大工 (Carpenter) | 1 | リファクタ | Refactor | 職人気質の改善担当 |

## TDDフロー

```
Navigator（タスク分解・テスト設計指示）
    ↓
Bosun（実装 = Green：テストを通す最小実装）
    ↓
Lookout（レビュー：コード品質・仕様準拠チェック）
    ↓  OK → 完了 / NG → Bosunに差し戻し or Carpenterにリファクタ指示
Carpenter（リファクタ = Refactor：テスト維持しながら品質改善）
    ↓
Lookout（再レビュー）
```

## 起動方法

WezTermのターミナルで以下を実行:

```powershell
cd C:\Development\Nextjs\scenario-manager
pwsh -File .\.agents\fleet\launch.ps1
```

5ペインに分割され、船長ペインでClaude Codeが自動起動する。
航海士・乗組員は船長の指示で必要に応じて起動される（段階的起動）。

## 通信フロー（非対称）

```
ユーザー → 船長 → voyages/ に航海命令(YAML)を作成
                → send-order.ps1 で航海士に通知
                → セッションを終了

航海士 → タスクを分解（TDDフロー対応）
      → Bosunに send-order.ps1 で実装指示
      → セッションを終了

Bosun → 実装（Green） → reports/ に報告(YAML)を作成
                      → 航海士に send-order.ps1 で通知
                      → セッションを終了

航海士 → Lookoutに send-order.ps1 でレビュー指示
      → セッションを終了

Lookout → レビュー → reports/ に判定(YAML)を作成
                   → 航海士に send-order.ps1 で通知
                   → セッションを終了

（NG時）航海士 → Carpenterに send-order.ps1 でリファクタ指示

Carpenter → リファクタ → reports/ に報告(YAML)を作成
                       → 航海士に通知 → Lookoutが再レビュー

航海士 → 全タスク完了 → dashboard.md を更新
                     → 船長に通知 → セッションを終了
```

**重要**: 下から上への `send-order.ps1` は禁止（乗組員→航海士を除く）

## ファイル構成

```
.agents/fleet/
├── captain.md          # 船長のシステムプロンプト
├── navigator.md        # 航海士のシステムプロンプト
├── bosun.md            # 甲板長のシステムプロンプト（実装/Green）
├── lookout.md          # 見張り番のシステムプロンプト（レビュー）
├── carpenter.md        # 船大工のシステムプロンプト（リファクタ）
├── launch.ps1          # 船団起動スクリプト
├── send-order.ps1      # 指示送信ユーティリティ
├── filelock.ps1        # ファイルロック管理
├── dismiss.ps1         # 船団解散スクリプト
├── dashboard.md        # 航海日誌（リアルタイムダッシュボード）
├── panes.json          # ペインID記録（起動時に自動生成）
├── locks.json          # ファイルロック状態（自動生成）
├── schemas/            # YAMLスキーマ定義
│   ├── voyage.schema.yaml   # 航海命令メタ情報
│   ├── task.schema.yaml     # 個別タスク定義
│   ├── report.schema.yaml
│   └── skill-proposal.schema.yaml
├── validate.ps1        # YAMLバリデーター
├── voyages/            # 航海命令（ディレクトリ単位）
│   └── voyage-011/
│       ├── voyage.yaml      # メタ情報（目的・背景）
│       ├── task-001.yaml    # Bosun向けタスク
│       ├── task-002.yaml    # Lookout向けタスク
│       └── task-003.yaml    # Carpenter向けタスク（NG時のみ）
├── reports/            # 完了報告（報告YAML）
└── skill-proposals/    # スキル・改善提案のドラフト
```

## 主要機能

### 航海命令（YAML通信）
タスクの詳細はYAMLファイルに記述し、`send-order.ps1`では通知のみ送る。
これによりトークン消費を抑え、正確な情報伝達を実現する。

航海命令はディレクトリ単位で管理し、メタ情報（`voyage.yaml`）とタスク（`task-XXX.yaml`）を分離する。
各乗組員は自分のタスクファイルだけを読めばよく、航海全体を読む必要がない。

### TDDサイクル統合
各タスクに `phase` フィールド（green/review/refactor）を持ち、TDDサイクルを構造的に管理する。
Lookoutのレビュー判定（OK/NG）に基づき、差し戻しやリファクタ指示が自動的にフローする。

### ダッシュボード（`dashboard.md`）
航海士がリアルタイムで更新する進捗ダッシュボード。
- 航海の状態、タスク進捗（TDDフェーズ含む）、乗組員の状態
- ファイルロック状況
- 船長への上申（スキル提案、改善提案、判断要請、エラー報告）

### ファイルロック（`filelock.ps1`）
乗組員同士が同じファイルを同時編集しないよう制御する。

```powershell
# ロック取得
pwsh -File .\.agents\fleet\filelock.ps1 -Action lock -File "src/path/to/file.ts" -Owner bosun

# ロック解放
pwsh -File .\.agents\fleet\filelock.ps1 -Action unlock -File "src/path/to/file.ts" -Owner bosun

# ロック確認
pwsh -File .\.agents\fleet\filelock.ps1 -Action check -File "src/path/to/file.ts"

# 全ロック一覧
pwsh -File .\.agents\fleet\filelock.ps1 -Action list
```

### ペルソナ（動的変更）
航海士がタスクごとに最適なペルソナをBosunに割り当てる。

| タスク内容 | ペルソナ |
|-----------|---------|
| UI/スタイル修正 | シニアフロントエンドエンジニア |
| ロジック実装 | シニアバックエンドエンジニア |
| テスト作成・実行 | テストエンジニア（QA） |
| ビルド・デプロイ確認 | DevOpsエンジニア |

### スキル自動提案
乗組員が作業開始時にclaude-memで類似作業を検索し、繰り返しパターンを検知したら報告に含める。
航海士が有用性を審査し、通過した提案のみ船長経由でユーザーに承認を求める。
採用されたスキルは `.claude/commands/` に配置され `/コマンド名` で使えるようになる。

### 改善提案
乗組員のエラー報告を受けた航海士がclaude-memで同種エラーを検索し、繰り返しを検知したら改善策を提案する。

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
pwsh -File .\.agents\fleet\send-order.ps1 -Target navigator -Message "新たな航海命令: voyage-001"

# 甲板長でClaude Codeを起動
pwsh -File .\.agents\fleet\send-order.ps1 -Target bosun -StartClaude

# 見張り番にレビュー依頼
pwsh -File .\.agents\fleet\send-order.ps1 -Target lookout -Message "レビュー依頼: voyage-001/task-002"

# 船大工にリファクタ指示
pwsh -File .\.agents\fleet\send-order.ps1 -Target carpenter -Message "リファクタ: voyage-001/task-003"
```

## ステータス

| 状態 | 英名 | 意味 |
|------|------|------|
| ⚓ 停泊中 | docked | 準備中・未着手 |
| ⛵ 航行中 | underway | 作業中 |
| 🏴 投錨 | anchored | 完了 |
| 💀 座礁 | aground | 失敗・エラー |
