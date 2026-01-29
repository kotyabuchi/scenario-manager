#Requires -Version 7.0
<#
.SYNOPSIS
  船団（Fleet）起動スクリプト - WezTermで5ペインを作成する

.DESCRIPTION
  現在のペインを分割して 船長(1) + 航海士(1) + 水夫(3) の5ペインを作成する。
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

# 古い報告をクリア
Remove-Item "$FleetDir\reports\*" -Force -ErrorAction SilentlyContinue
Remove-Item "$FleetDir\voyages\*" -Force -ErrorAction SilentlyContinue

Write-Host "=== Fleet Launch ===" -ForegroundColor Cyan
Write-Host "船団を出港させます..." -ForegroundColor Yellow

# 現在のペインIDを取得（船長ペイン）
$captainPaneId = $env:WEZTERM_PANE
if (-not $captainPaneId) {
  $captainPaneId = (wezterm cli list-clients --format json | ConvertFrom-Json)[0].focused_pane_id
}
Write-Host "[Captain] Pane ID: $captainPaneId" -ForegroundColor Green

# 水夫1ペイン（船長の右に分割 — 左40:右60）
$sailor1PaneId = (wezterm cli split-pane --right --percent 60 --cwd $ProjectDir --pane-id $captainPaneId).Trim()
Write-Host "[Sailor-1] Pane ID: $sailor1PaneId" -ForegroundColor Magenta

# 航海士ペイン（船長(左)の下に分割 — 上50:下50）
$navigatorPaneId = (wezterm cli split-pane --bottom --percent 50 --cwd $ProjectDir --pane-id $captainPaneId).Trim()
Write-Host "[Navigator] Pane ID: $navigatorPaneId" -ForegroundColor Blue

# 水夫2ペイン（水夫1(右上)の下に分割 — 上33:下67）
$sailor2PaneId = (wezterm cli split-pane --bottom --percent 67 --cwd $ProjectDir --pane-id $sailor1PaneId).Trim()
Write-Host "[Sailor-2] Pane ID: $sailor2PaneId" -ForegroundColor Magenta

# 水夫3ペイン（水夫2の下に分割 — 上50:下50）
$sailor3PaneId = (wezterm cli split-pane --bottom --percent 50 --cwd $ProjectDir --pane-id $sailor2PaneId).Trim()
Write-Host "[Sailor-3] Pane ID: $sailor3PaneId" -ForegroundColor Magenta

# ペインIDをファイルに保存
@{
  captain   = [int]$captainPaneId
  navigator = [int]$navigatorPaneId
  sailor1   = [int]$sailor1PaneId
  sailor2   = [int]$sailor2PaneId
  sailor3   = [int]$sailor3PaneId
} | ConvertTo-Json | Set-Content "$FleetDir\panes.json" -Encoding UTF8

Write-Host @"

=== Fleet Ready ===

船団構成（左2 + 右3）:
  [Captain]    Pane $captainPaneId  - 左上（このペイン）
  [Navigator]  Pane $navigatorPaneId  - 左下
  [Sailor-1]   Pane $sailor1PaneId  - 右上
  [Sailor-2]   Pane $sailor2PaneId  - 右中
  [Sailor-3]   Pane $sailor3PaneId  - 右下

船長を起動します...

"@ -ForegroundColor White

# 船長のClaude Codeを起動（ファイル内容をシステムプロンプトとして渡す）
$captainPrompt = Get-Content "$FleetDir\captain.md" -Raw
claude --system-prompt $captainPrompt
