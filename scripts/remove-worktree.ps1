<#
.SYNOPSIS
    Git worktreeの削除スクリプト

.DESCRIPTION
    指定したworktreeを削除し、オプションでブランチも削除する。

.PARAMETER Name
    worktree名（setup-worktree.ps1で指定した名前）

.PARAMETER DeleteBranch
    ブランチも削除するかどうか（デフォルト: false）

.PARAMETER Force
    強制削除するかどうか（未コミットの変更がある場合）

.EXAMPLE
    .\remove-worktree.ps1 feature/search-refactor
    .\remove-worktree.ps1 feature/search-refactor -DeleteBranch
    .\remove-worktree.ps1 feature/search-refactor -DeleteBranch -Force

.NOTES
    mainブランチにマージしてから削除することを推奨します。
#>

param(
    [Parameter(Mandatory = $true, Position = 0)]
    [string]$Name,

    [Parameter(Mandatory = $false)]
    [switch]$DeleteBranch = $false,

    [Parameter(Mandatory = $false)]
    [switch]$Force = $false
)

# パス設定
$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$sourceDir = Split-Path -Parent $scriptDir
$worktreeName = "scenario-manager-$($Name -replace '/', '-')"
$worktreePath = Join-Path (Split-Path -Parent $sourceDir) $worktreeName

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Git Worktree 削除" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Worktree名: $worktreeName"
Write-Host "Worktreeパス: $worktreePath"
Write-Host "ブランチ名: $Name"
Write-Host "ブランチ削除: $DeleteBranch"
Write-Host ""

# 存在チェック
if (-not (Test-Path $worktreePath)) {
    Write-Host "エラー: $worktreePath は存在しません。" -ForegroundColor Red
    Write-Host ""
    Write-Host "現在のworktree一覧:" -ForegroundColor Yellow
    git worktree list
    exit 1
}

# ソースディレクトリに移動
Push-Location $sourceDir

try {
    # 未コミットの変更チェック
    Push-Location $worktreePath
    $status = git status --porcelain
    Pop-Location

    if ($status -and -not $Force) {
        Write-Host "警告: 未コミットの変更があります:" -ForegroundColor Yellow
        Write-Host $status -ForegroundColor Gray
        Write-Host ""
        $continue = Read-Host "強制削除しますか？ (y/N)"
        if ($continue -ne "y" -and $continue -ne "Y") {
            Write-Host "キャンセルしました。" -ForegroundColor Yellow
            exit 0
        }
        $Force = $true
    }

    # Worktree削除
    Write-Host "Worktreeを削除中..." -ForegroundColor Green
    if ($Force) {
        git worktree remove $worktreePath --force
    } else {
        git worktree remove $worktreePath
    }

    if ($LASTEXITCODE -ne 0) {
        throw "Worktreeの削除に失敗しました"
    }
    Write-Host "  削除完了: $worktreePath" -ForegroundColor Gray

    # ブランチ削除
    if ($DeleteBranch) {
        Write-Host "ブランチを削除中..." -ForegroundColor Green

        # マージ済みかチェック
        $mergedBranches = git branch --merged main
        $isMerged = $mergedBranches -match $Name

        if ($isMerged) {
            git branch -d $Name
        } else {
            Write-Host "  警告: ブランチ '$Name' はmainにマージされていません。" -ForegroundColor Yellow
            $forceDelete = Read-Host "  強制削除しますか？ (y/N)"
            if ($forceDelete -eq "y" -or $forceDelete -eq "Y") {
                git branch -D $Name
            } else {
                Write-Host "  ブランチの削除をスキップしました。" -ForegroundColor Yellow
            }
        }

        if ($LASTEXITCODE -eq 0) {
            Write-Host "  削除完了: $Name" -ForegroundColor Gray
        }
    }

    # 完了メッセージ
    Write-Host ""
    Write-Host "========================================" -ForegroundColor Green
    Write-Host "削除完了!" -ForegroundColor Green
    Write-Host "========================================" -ForegroundColor Green
    Write-Host ""
    Write-Host "現在のworktree一覧:" -ForegroundColor Yellow
    git worktree list

} catch {
    Write-Host ""
    Write-Host "エラー: $_" -ForegroundColor Red
    exit 1
} finally {
    Pop-Location
}
