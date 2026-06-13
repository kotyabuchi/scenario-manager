param(
  [string]$ProjectSkillsDir = ".codex/skills",
  [string]$GlobalSkillsDir = (Join-Path $HOME ".codex/skills"),
  [string]$Prefix,
  [ValidateSet("SymbolicLink", "Junction")]
  [string]$LinkType = "SymbolicLink",
  [switch]$Force,
  [switch]$Unlink
)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

function Get-RepoRoot {
  return (Resolve-Path (Join-Path $PSScriptRoot "..")).Path
}

function Resolve-ProjectPath {
  param(
    [string]$RepoRoot,
    [string]$PathValue
  )

  if ([System.IO.Path]::IsPathRooted($PathValue)) {
    return [System.IO.Path]::GetFullPath($PathValue)
  }

  return [System.IO.Path]::GetFullPath((Join-Path $RepoRoot $PathValue))
}

function Get-DefaultPrefix {
  param([string]$RepoRoot)

  $packageJsonPath = Join-Path $RepoRoot "package.json"
  if (Test-Path $packageJsonPath) {
    try {
      $packageJson = Get-Content -Raw -LiteralPath $packageJsonPath -Encoding utf8 | ConvertFrom-Json
      if ($null -ne $packageJson.name -and [string]::IsNullOrWhiteSpace([string]$packageJson.name) -eq $false) {
        return [string]$packageJson.name
      }
    } catch {
      Write-Warning "Failed to read package.json. Falling back to repo folder name for prefix: $($_.Exception.Message)"
    }
  }

  return Split-Path $RepoRoot -Leaf
}

function Normalize-Name {
  param([string]$Value)

  $normalized = $Value.ToLowerInvariant()
  $normalized = [regex]::Replace($normalized, "[^a-z0-9\-]+", "-")
  $normalized = [regex]::Replace($normalized, "-{2,}", "-")
  return $normalized.Trim("-")
}

function Test-ReparsePoint {
  param([System.IO.FileSystemInfo]$Item)

  return (($Item.Attributes -band [System.IO.FileAttributes]::ReparsePoint) -ne 0)
}

function Get-ItemTargetPath {
  param([System.IO.FileSystemInfo]$Item)

  if ($null -ne $Item.Target) {
    $rawTarget = $Item.Target
    $target = if ($rawTarget -is [System.Array]) { [string]$rawTarget[0] } else { [string]$rawTarget }
    if ([string]::IsNullOrWhiteSpace($target)) {
      return $null
    }

    if ([System.IO.Path]::IsPathRooted($target)) {
      return [System.IO.Path]::GetFullPath($target)
    }

    return [System.IO.Path]::GetFullPath((Join-Path $Item.DirectoryName $target))
  }

  return $null
}

function New-DirectoryLink {
  param(
    [string]$Path,
    [string]$Target,
    [string]$LinkTypeRequested
  )

  try {
    New-Item -ItemType $LinkTypeRequested -Path $Path -Target $Target | Out-Null
    return $LinkTypeRequested
  } catch {
    if ($LinkTypeRequested -ne "SymbolicLink") {
      throw
    }

    Write-Warning "Failed to create SymbolicLink. Falling back to Junction: $($_.Exception.Message)"
    New-Item -ItemType Junction -Path $Path -Target $Target | Out-Null
    return "Junction"
  }
}

$repoRoot = Get-RepoRoot
$projectSkillsPath = Resolve-ProjectPath -RepoRoot $repoRoot -PathValue $ProjectSkillsDir
$globalSkillsPath = Resolve-ProjectPath -RepoRoot $repoRoot -PathValue $GlobalSkillsDir

if (-not (Test-Path $projectSkillsPath)) {
  throw "ProjectSkillsDir not found: $projectSkillsPath"
}

$resolvedPrefix = if ([string]::IsNullOrWhiteSpace($Prefix)) {
  Get-DefaultPrefix -RepoRoot $repoRoot
} else {
  $Prefix
}
$resolvedPrefix = Normalize-Name -Value $resolvedPrefix
if ([string]::IsNullOrWhiteSpace($resolvedPrefix)) {
  throw "Prefix resolved to empty. Pass -Prefix explicitly."
}

New-Item -ItemType Directory -Path $globalSkillsPath -Force | Out-Null

$skillDirs = Get-ChildItem -LiteralPath $projectSkillsPath -Directory |
  Where-Object { Test-Path (Join-Path $_.FullName "SKILL.md") } |
  Sort-Object Name

if ($Unlink) {
  $candidates = Get-ChildItem -LiteralPath $globalSkillsPath -Directory |
    Where-Object { $_.Name -like "$resolvedPrefix-*" }

  $removed = 0
  foreach ($item in $candidates) {
    if (-not (Test-ReparsePoint -Item $item)) {
      Write-Warning "Skip (not a link): $($item.FullName)"
      continue
    }

    $targetPath = Get-ItemTargetPath -Item $item
    if ($null -eq $targetPath -or -not $targetPath.StartsWith($projectSkillsPath, [System.StringComparison]::OrdinalIgnoreCase)) {
      Write-Warning "Skip (cannot confirm this link belongs to the current project): $($item.FullName)"
      continue
    }

    Remove-Item -LiteralPath $item.FullName -Force
    $removed += 1
    Write-Host "Removed link: $($item.Name)"
  }

  Write-Host "Unlinked $removed skill link(s) from $globalSkillsPath"
  return
}

$created = 0
$skipped = 0
foreach ($skillDir in $skillDirs) {
  $sourceName = $skillDir.Name
  $linkName = if ($sourceName -like "$resolvedPrefix-*") { $sourceName } else { "$resolvedPrefix-$sourceName" }
  $linkPath = Join-Path $globalSkillsPath $linkName
  $targetPath = [System.IO.Path]::GetFullPath($skillDir.FullName)

  if (Test-Path $linkPath) {
    $existing = Get-Item -LiteralPath $linkPath -Force
    if (Test-ReparsePoint -Item $existing) {
      $existingTarget = Get-ItemTargetPath -Item $existing
      if ($null -ne $existingTarget -and $existingTarget.Equals($targetPath, [System.StringComparison]::OrdinalIgnoreCase)) {
        Write-Host "Skip (already linked): $linkName"
        $skipped += 1
        continue
      }

      if ($Force) {
        Remove-Item -LiteralPath $linkPath -Force
      } else {
        Write-Warning "Skip (a different link already exists): $linkPath"
        $skipped += 1
        continue
      }
    } else {
      Write-Warning "Skip (normal file/directory already exists): $linkPath"
      $skipped += 1
      continue
    }
  }

  $actualType = New-DirectoryLink -Path $linkPath -Target $targetPath -LinkTypeRequested $LinkType
  $created += 1
  Write-Host "Linked ($actualType): $linkName -> $targetPath"
}

Write-Host "Created $created link(s), skipped $skipped."
