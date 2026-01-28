# Fleet - WezTermマルチエージェントシステム

中世ヨーロッパの船団をモチーフにした、Claude Codeマルチエージェント構成。

## 前提条件

- [WezTerm](https://wezfurlong.org/wezterm/) がインストール済み
- Claude Code がインストール済み
- Claude Max プラン（複数インスタンス同時実行のため推奨）

## 船団構成

| ロール | 人数 | 役割 |
|--------|------|------|
| 船長 (Captain) | 1 | 全体指揮・ユーザーとの対話 |
| 航海士 (Navigator) | 1 | タスク分解・進捗管理 |
| 水夫 (Sailor) | 3 | 実作業の並列実行 |

## 起動方法

### 方法1: WezTermショートカット
WezTermで `Ctrl+Shift+F` を押すと、新しいタブで船団が起動する。

### 方法2: 手動起動
```powershell
cd C:\Development\Nextjs\scenario-manager
.\.agents\fleet\launch.ps1
```

### 船長の起動
launch.ps1 実行後、船長ペイン（左側の大きなペイン）で:
```powershell
claude --system-prompt .agents/fleet/captain.md
```

## 通信フロー

```
ユーザー → 船長 → voyages/ に航海命令を作成
                → send-order.ps1 で航海士に通知
航海士 → タスクを分解 → 各水夫に send-order.ps1 で指示
水夫 → 作業実行 → reports/ に報告を作成
                → 航海士に完了通知
航海士 → 進捗集約 → 船長に報告
```

## ファイル構成

```
.agents/fleet/
├── captain.md        # 船長のシステムプロンプト
├── navigator.md      # 航海士のシステムプロンプト
├── sailor.md         # 水夫のシステムプロンプト
├── launch.ps1        # 船団起動スクリプト
├── send-order.ps1    # 指示送信ユーティリティ
├── panes.json        # ペインID記録（起動時に自動生成）
├── voyages/          # 航海命令（タスク定義）
└── reports/          # 航海日誌（完了報告）
```

## ユーティリティ

### send-order.ps1

```powershell
# 航海士にメッセージ送信
.\.agents\fleet\send-order.ps1 -Target navigator -Message "voyage-001を確認せよ"

# 水夫1でClaude Codeを起動
.\.agents\fleet\send-order.ps1 -Target sailor1 -StartClaude

# 水夫2にタスクを指示
.\.agents\fleet\send-order.ps1 -Target sailor2 -Message "styles.tsを修正して"
```

## ステータス

| 状態 | 英名 | 意味 |
|------|------|------|
| 停泊中 | docked | 準備中・未着手 |
| 航行中 | underway | 作業中 |
| 投錨 | anchored | 完了 |
| 座礁 | aground | 失敗・エラー |
