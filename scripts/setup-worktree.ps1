<#
.SYNOPSIS
    Git worktreeのセットアップスクリプト

.DESCRIPTION
    複数のClaude Codeで並行作業するためのworktreeを作成し、
    環境変数ファイルのシンボリックリンクと依存関係のインストールを行う。

.PARAMETER Name
    worktree名（ブランチ名としても使用）

.PARAMETER BaseBranch
    ベースとなるブランチ（デフォルト: main）

.PARAMETER Port
    開発サーバーのポート番号（情報表示用）

.EXAMPLE
    .\setup-worktree.ps1 feature/search-refactor
    .\setup-worktree.ps1 feature/ui-improvement -BaseBranch develop -Port 3001

.NOTES
    管理者権限が必要です（シンボリックリンク作成のため）
#>

param(
    [Parameter(Mandatory = $true, Position = 0)]
    [string]$Name,

    [Parameter(Mandatory = $false)]
    [string]$BaseBranch = "main",

    [Parameter(Mandatory = $false)]
    [int]$Port = 0
)

# 管理者権限チェック
$isAdmin = ([Security.Principal.WindowsPrincipal] [Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)
if (-not $isAdmin) {
    Write-Host "警告: 管理者権限で実行されていません。シンボリックリンクの作成に失敗する可能性があります。" -ForegroundColor Yellow
    Write-Host "管理者権限のPowerShellで再実行することを推奨します。" -ForegroundColor Yellow
    Write-Host ""
    $continue = Read-Host "続行しますか？ (y/N)"
    if ($continue -ne "y" -and $continue -ne "Y") {
        exit 1
    }
}

# パス設定
$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$sourceDir = Split-Path -Parent $scriptDir
$worktreeName = "scenario-manager-$($Name -replace '/', '-')"
$worktreePath = Join-Path (Split-Path -Parent $sourceDir) $worktreeName

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Git Worktree セットアップ" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "ソースディレクトリ: $sourceDir"
Write-Host "Worktree名: $worktreeName"
Write-Host "Worktreeパス: $worktreePath"
Write-Host "ブランチ名: $Name"
Write-Host "ベースブランチ: $BaseBranch"
Write-Host ""

# 既存チェック
if (Test-Path $worktreePath) {
    Write-Host "エラー: $worktreePath は既に存在します。" -ForegroundColor Red
    exit 1
}

# ソースディレクトリに移動
Push-Location $sourceDir

try {
    # 1. ブランチ作成（存在しない場合）
    Write-Host "[1/5] ブランチを確認中..." -ForegroundColor Green
    $branchExists = git branch --list $Name
    if (-not $branchExists) {
        Write-Host "  新規ブランチ '$Name' を '$BaseBranch' から作成します"
        git branch $Name $BaseBranch
        if ($LASTEXITCODE -ne 0) {
            throw "ブランチの作成に失敗しました"
        }
    } else {
        Write-Host "  ブランチ '$Name' は既に存在します"
    }

    # 2. Worktree作成
    Write-Host "[2/5] Worktreeを作成中..." -ForegroundColor Green
    git worktree add $worktreePath $Name
    if ($LASTEXITCODE -ne 0) {
        throw "Worktreeの作成に失敗しました"
    }
    Write-Host "  作成完了: $worktreePath"

    # 3. 環境変数ファイルのシンボリックリンク作成
    Write-Host "[3/5] 環境変数ファイルのシンボリックリンクを作成中..." -ForegroundColor Green
    $envFiles = @(".env", ".env.development.local", ".env.test.local")

    foreach ($envFile in $envFiles) {
        $sourcePath = Join-Path $sourceDir $envFile
        $targetPath = Join-Path $worktreePath $envFile

        if (Test-Path $sourcePath) {
            try {
                New-Item -ItemType SymbolicLink -Path $targetPath -Target $sourcePath -Force -ErrorAction Stop | Out-Null
                Write-Host "  リンク作成: $envFile" -ForegroundColor Gray
            } catch {
                Write-Host "  警告: $envFile のリンク作成に失敗しました。手動でコピーしてください。" -ForegroundColor Yellow
                # フォールバック: コピー
                Copy-Item $sourcePath $targetPath
                Write-Host "  代替: $envFile をコピーしました" -ForegroundColor Yellow
            }
        }
    }

    # 4. 依存関係インストール
    Write-Host "[4/5] 依存関係をインストール中..." -ForegroundColor Green
    Push-Location $worktreePath
    pnpm install
    if ($LASTEXITCODE -ne 0) {
        throw "pnpm install に失敗しました"
    }

    # 5. PandaCSS生成
    Write-Host "[5/5] PandaCSSを生成中..." -ForegroundColor Green
    pnpm prepare
    if ($LASTEXITCODE -ne 0) {
        throw "pnpm prepare に失敗しました"
    }
    Pop-Location

    # 完了メッセージ
    Write-Host ""
    Write-Host "========================================" -ForegroundColor Green
    Write-Host "セットアップ完了!" -ForegroundColor Green
    Write-Host "========================================" -ForegroundColor Green
    Write-Host ""
    Write-Host "Worktreeパス: $worktreePath" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "次のステップ:" -ForegroundColor Yellow
    Write-Host "  1. 新しいターミナルで以下を実行:"
    Write-Host "     cd $worktreePath" -ForegroundColor White
    Write-Host ""
    if ($Port -gt 0) {
        Write-Host "  2. 開発サーバー起動（ポート指定）:"
        Write-Host "     pnpm dev --port $Port" -ForegroundColor White
    } else {
        # 既存worktreeの数からポート番号を提案
        $existingWorktrees = git worktree list | Measure-Object
        $suggestedPort = 3000 + $existingWorktrees.Count - 1
        Write-Host "  2. 開発サーバー起動（推奨ポート: $suggestedPort）:"
        Write-Host "     pnpm dev --port $suggestedPort" -ForegroundColor White
    }
    Write-Host ""
    Write-Host "  3. Claude Codeを起動:"
    Write-Host "     claude" -ForegroundColor White
    Write-Host ""
    Write-Host "作業完了後の削除:"
    Write-Host "  git worktree remove $worktreePath" -ForegroundColor Gray
    Write-Host "  git branch -d $Name" -ForegroundColor Gray

} catch {
    Write-Host ""
    Write-Host "エラー: $_" -ForegroundColor Red

    # クリーンアップ
    if (Test-Path $worktreePath) {
        Write-Host "クリーンアップ中..." -ForegroundColor Yellow
        git worktree remove $worktreePath --force 2>$null
    }
    exit 1
} finally {
    Pop-Location
}
