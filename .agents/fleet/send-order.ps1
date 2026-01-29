#Requires -Version 7.0
<#
.SYNOPSIS
  指示送信ユーティリティ - 指定ペインにClaude Codeコマンドを送信する

.PARAMETER Target
  送信先: captain, navigator, sailor1, sailor2, sailor3

.PARAMETER Message
  送信するメッセージ

.PARAMETER StartClaude
  Trueの場合、Claude Codeをシステムプロンプト付きで起動する

.EXAMPLE
  # 航海士にメッセージを送信
  .\.agents\fleet\send-order.ps1 -Target navigator -Message "voyage-001を確認せよ"

  # 水夫1でClaude Codeを起動
  .\.agents\fleet\send-order.ps1 -Target sailor1 -StartClaude

  # 水夫2にClaude Codeでタスクを実行させる
  .\.agents\fleet\send-order.ps1 -Target sailor2 -Message "src/components/Button/styles.tsを修正して"
#>

param(
  [Parameter(Mandatory)]
  [ValidateSet("captain", "navigator", "sailor1", "sailor2", "sailor3")]
  [string]$Target,

  [string]$Message = "",

  [switch]$StartClaude
)

$FleetDir = "C:\Development\Nextjs\scenario-manager\.agents\fleet"
$panesFile = "$FleetDir\panes.json"

if (-not (Test-Path $panesFile)) {
  Write-Error "panes.json が見つかりません。先に launch.ps1 を実行してください。"
  exit 1
}

$panes = Get-Content $panesFile | ConvertFrom-Json
$paneId = $panes.$Target

if (-not $paneId) {
  Write-Error "ターゲット '$Target' のペインIDが見つかりません。"
  exit 1
}

if ($StartClaude) {
  # ロールに応じたシステムプロンプトファイルを選択
  $promptFile = switch ($Target) {
    "captain"   { "$FleetDir\captain.md" }
    "navigator" { "$FleetDir\navigator.md" }
    default     { "$FleetDir\sailor.md" }
  }

  # ペイン側でファイルを読み込んでclaude起動するコマンドを送信
  $cmd = "claude --system-prompt (Get-Content '$promptFile' -Raw)"
  if ($Message) {
    $cmd += " '$Message'"
  }

  $cmd | wezterm cli send-text --pane-id $paneId
  wezterm cli send-text --no-paste --pane-id $paneId -- "`r"
  Write-Host "[$Target] Claude Code を起動しました (Pane $paneId)" -ForegroundColor Green
}
elseif ($Message) {
  $Message | wezterm cli send-text --pane-id $paneId
  wezterm cli send-text --no-paste --pane-id $paneId -- "`r"
  Write-Host "[$Target] メッセージを送信しました (Pane $paneId)" -ForegroundColor Green
}
else {
  Write-Error "-Message または -StartClaude を指定してください。"
}
