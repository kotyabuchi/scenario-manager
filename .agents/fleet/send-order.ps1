#Requires -Version 7.0
<#
.SYNOPSIS
  指示送信ユーティリティ - 指定ペインにClaude Codeコマンドを送信する

.PARAMETER Target
  送信先: captain, navigator, bosun, lookout, carpenter

.PARAMETER Message
  送信するメッセージ

.PARAMETER StartClaude
  Trueの場合、Claude Codeをシステムプロンプト付きで起動する

.EXAMPLE
  # 航海士にメッセージを送信
  .\.agents\fleet\send-order.ps1 -Target navigator -Message "voyage-001を確認せよ"

  # 甲板長でClaude Codeを起動
  .\.agents\fleet\send-order.ps1 -Target bosun -StartClaude

  # 見張り番にレビューを通知
  .\.agents\fleet\send-order.ps1 -Target lookout -Message "レビュー依頼: voyage-001/task-002"
#>

param(
  [Parameter(Mandatory)]
  [ValidateSet("captain", "navigator", "bosun", "lookout", "carpenter")]
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

if ($null -eq $paneId) {
  Write-Error "ターゲット '$Target' のペインIDが見つかりません。"
  exit 1
}

if ($StartClaude) {
  # ロールに応じたシステムプロンプトファイルを選択
  $promptFile = switch ($Target) {
    "captain"   { "$FleetDir\captain.md" }
    "navigator" { "$FleetDir\navigator.md" }
    "bosun"     { "$FleetDir\bosun.md" }
    "lookout"   { "$FleetDir\lookout.md" }
    "carpenter" { "$FleetDir\carpenter.md" }
  }

  # ペイン側でファイルを読み込んでclaude起動するコマンドを送信
  $cmd = "claude --system-prompt (Get-Content '$promptFile' -Raw)"
  if ($Message) {
    $cmd += " '$Message'"
  }

  wezterm cli send-text --no-paste --pane-id $paneId -- $cmd
  wezterm cli send-text --no-paste --pane-id $paneId -- "`r"
  Write-Host "[$Target] Claude Code を起動しました (Pane $paneId)" -ForegroundColor Green
}
elseif ($Message) {
  wezterm cli send-text --no-paste --pane-id $paneId -- $Message
  wezterm cli send-text --no-paste --pane-id $paneId -- "`r"
  Write-Host "[$Target] メッセージを送信しました (Pane $paneId)" -ForegroundColor Green
}
else {
  Write-Error "-Message または -StartClaude を指定してください。"
}
