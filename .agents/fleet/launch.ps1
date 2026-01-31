#Requires -Version 7.0
<#
.SYNOPSIS
  船団（Fleet）起動スクリプト - WezTermで5ペインを作成する

.DESCRIPTION
  現在のペインを分割して 船長(1) + 航海士(1) + 甲板長(1) + 見張り番(1) + 船大工(1) の5ペインを作成する。
  Claude Codeは船長ペインのみ起動。他のペインは船長の指示で起動される。

.EXAMPLE
  .\.agents\fleet\launch.ps1
#>

$ErrorActionPreference = "Stop"
$ProjectDir = "C:\Development\Nextjs\scenario-manager"
$FleetDir = "$ProjectDir\.agents\fleet"

# voyages/reports ディレクトリを準備
New-Item -ItemType Directory -Force -Path "$FleetDir\voyages" | Out-Null
New-Item -ItemType Directory -Force -Path "$FleetDir\reports" | Out-Null

# 古い報告・航海命令をクリア
Remove-Item "$FleetDir\reports\*" -Force -ErrorAction SilentlyContinue
Remove-Item "$FleetDir\voyages\*" -Recurse -Force -ErrorAction SilentlyContinue

Write-Host "=== Fleet Launch ===" -ForegroundColor Cyan
Write-Host "船団を出港させます..." -ForegroundColor Yellow

# 現在のペインIDを取得（船長ペイン）
$captainPaneId = $env:WEZTERM_PANE
if (-not $captainPaneId) {
  $captainPaneId = (wezterm cli list-clients --format json | ConvertFrom-Json)[0].focused_pane_id
}
Write-Host "[Captain] Pane ID: $captainPaneId" -ForegroundColor Green

# 甲板長ペイン（船長の右に分割 — 左55:右45）
$bosunPaneId = (wezterm cli split-pane --right --percent 45 --cwd $ProjectDir --pane-id $captainPaneId).Trim()
Write-Host "[Bosun] Pane ID: $bosunPaneId" -ForegroundColor Magenta

# 航海士ペイン（船長(左)の下に分割 — 上55:下45）
$navigatorPaneId = (wezterm cli split-pane --bottom --percent 45 --cwd $ProjectDir --pane-id $captainPaneId).Trim()
Write-Host "[Navigator] Pane ID: $navigatorPaneId" -ForegroundColor Blue

# 見張り番ペイン（甲板長(右上)の下に分割 — 上33:下67）
$lookoutPaneId = (wezterm cli split-pane --bottom --percent 67 --cwd $ProjectDir --pane-id $bosunPaneId).Trim()
Write-Host "[Lookout] Pane ID: $lookoutPaneId" -ForegroundColor Yellow

# 船大工ペイン（見張り番の下に分割 — 上50:下50）
$carpenterPaneId = (wezterm cli split-pane --bottom --percent 50 --cwd $ProjectDir --pane-id $lookoutPaneId).Trim()
Write-Host "[Carpenter] Pane ID: $carpenterPaneId" -ForegroundColor DarkYellow

# ペインIDをファイルに保存
@{
  captain   = [int]$captainPaneId
  navigator = [int]$navigatorPaneId
  bosun     = [int]$bosunPaneId
  lookout   = [int]$lookoutPaneId
  carpenter = [int]$carpenterPaneId
} | ConvertTo-Json | Set-Content "$FleetDir\panes.json" -Encoding UTF8

Write-Host @"

=== Fleet Ready ===

船団構成（左2 + 右3）:
  [Captain]    Pane $captainPaneId  - 左上（このペイン）
  [Navigator]  Pane $navigatorPaneId  - 左下
  [Bosun]      Pane $bosunPaneId  - 右上
  [Lookout]    Pane $lookoutPaneId  - 右中
  [Carpenter]  Pane $carpenterPaneId  - 右下

船長を起動します...

"@ -ForegroundColor White

# 船長のClaude Codeを起動（ファイル内容をシステムプロンプトとして渡す）
$captainPrompt = Get-Content "$FleetDir\captain.md" -Raw
claude --system-prompt $captainPrompt
