<#
.SYNOPSIS
  船団（Fleet）一括終了スクリプト - 船長以外の全ペインを閉じる

.DESCRIPTION
  panes.json を読み取り、船長ペイン以外（航海士・水夫1〜3）を閉じる。
  船長ペインは残るので、通常のターミナルとして使える。

.EXAMPLE
  .\.agents\fleet\dismiss.ps1
#>

$ErrorActionPreference = "Stop"
$FleetDir = "$PSScriptRoot"
$PanesFile = "$FleetDir\panes.json"

if (-not (Test-Path $PanesFile)) {
  Write-Host "panes.json が見つかりません。船団が起動していないようです。" -ForegroundColor Red
  exit 1
}

$panes = Get-Content $PanesFile -Encoding UTF8 | ConvertFrom-Json
$captainPaneId = $panes.captain

Write-Host "=== Fleet Dismiss ===" -ForegroundColor Cyan
Write-Host "船団を解散します..." -ForegroundColor Yellow

# 船長以外のペインを閉じる（逆順で閉じる）
$targets = @(
  @{ Name = "Sailor-3";  Id = $panes.sailor3 }
  @{ Name = "Sailor-2";  Id = $panes.sailor2 }
  @{ Name = "Sailor-1";  Id = $panes.sailor1 }
  @{ Name = "Navigator"; Id = $panes.navigator }
)

foreach ($target in $targets) {
  try {
    wezterm cli kill-pane --pane-id $target.Id 2>$null
    Write-Host "  [$($target.Name)] Pane $($target.Id) - 閉じました" -ForegroundColor Green
  } catch {
    Write-Host "  [$($target.Name)] Pane $($target.Id) - 既に閉じています" -ForegroundColor DarkGray
  }
}

# panes.json を削除
Remove-Item $PanesFile -Force -ErrorAction SilentlyContinue

Write-Host @"

=== Fleet Dismissed ===
全ペインを閉じました。お疲れ様でした！
"@ -ForegroundColor White
