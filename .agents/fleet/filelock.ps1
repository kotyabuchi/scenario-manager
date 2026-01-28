<#
.SYNOPSIS
  ファイルロック管理 - 水夫同士のコンフリクトを防止する

.PARAMETER Action
  lock / unlock / check / list

.PARAMETER File
  ロック対象のファイルパス（プロジェクトルートからの相対パス）

.PARAMETER Owner
  ロック取得者（sailor1, sailor2, sailor3）

.EXAMPLE
  # ロック取得
  .\.agents\fleet\filelock.ps1 -Action lock -File "src/app/(main)/sessions/_components/styles.ts" -Owner sailor1

  # ロック解放
  .\.agents\fleet\filelock.ps1 -Action unlock -File "src/app/(main)/sessions/_components/styles.ts" -Owner sailor1

  # ロック確認（ロック中ならexit code 1）
  .\.agents\fleet\filelock.ps1 -Action check -File "src/app/(main)/sessions/_components/styles.ts"

  # 全ロック一覧
  .\.agents\fleet\filelock.ps1 -Action list
#>

param(
  [Parameter(Mandatory)]
  [ValidateSet("lock", "unlock", "check", "list")]
  [string]$Action,

  [string]$File = "",
  [string]$Owner = ""
)

$FleetDir = "C:\Development\Nextjs\scenario-manager\.agents\fleet"
$LockFile = "$FleetDir\locks.json"

# ロックファイルの読み込み（なければ空オブジェクト）
if (Test-Path $LockFile) {
  $locks = Get-Content $LockFile -Encoding UTF8 | ConvertFrom-Json -AsHashtable
} else {
  $locks = @{}
}

switch ($Action) {
  "lock" {
    if (-not $File -or -not $Owner) {
      Write-Error "-File と -Owner を指定してください"
      exit 1
    }
    if ($locks.ContainsKey($File)) {
      $existing = $locks[$File]
      Write-Error "ロック競合: '$File' は $($existing.owner) がロック中（タスク: $($existing.task)）"
      exit 1
    }
    $locks[$File] = @{
      owner = $Owner
      locked_at = (Get-Date -Format "yyyy-MM-ddTHH:mm:ss")
    }
    $locks | ConvertTo-Json -Depth 3 | Set-Content $LockFile -Encoding UTF8
    Write-Host "ロック取得: $File -> $Owner" -ForegroundColor Green
  }

  "unlock" {
    if (-not $File -or -not $Owner) {
      Write-Error "-File と -Owner を指定してください"
      exit 1
    }
    if (-not $locks.ContainsKey($File)) {
      Write-Host "ロックなし: $File" -ForegroundColor Yellow
      exit 0
    }
    if ($locks[$File].owner -ne $Owner) {
      Write-Error "ロック解放失敗: '$File' は $($locks[$File].owner) のロックです（あなた: $Owner）"
      exit 1
    }
    $locks.Remove($File)
    $locks | ConvertTo-Json -Depth 3 | Set-Content $LockFile -Encoding UTF8
    Write-Host "ロック解放: $File" -ForegroundColor Green
  }

  "check" {
    if (-not $File) {
      Write-Error "-File を指定してください"
      exit 1
    }
    if ($locks.ContainsKey($File)) {
      $info = $locks[$File]
      Write-Host "ロック中: $File -> $($info.owner) ($($info.locked_at))" -ForegroundColor Red
      exit 1
    } else {
      Write-Host "利用可能: $File" -ForegroundColor Green
      exit 0
    }
  }

  "list" {
    if ($locks.Count -eq 0) {
      Write-Host "現在ロックされているファイルはありません" -ForegroundColor Gray
    } else {
      foreach ($key in $locks.Keys) {
        $info = $locks[$key]
        Write-Host "  $key -> $($info.owner) ($($info.locked_at))" -ForegroundColor Yellow
      }
    }
  }
}
