#Requires -Version 7.0
<#
.SYNOPSIS
  Fleet YAML バリデーター — スキーマに基づいてYAMLファイルを検証する

.PARAMETER Schema
  スキーマ名: voyage / report / skill-proposal

.PARAMETER File
  検証対象のYAMLファイルパス

.EXAMPLE
  pwsh -File .agents/fleet/validate.ps1 -Schema voyage -File .agents/fleet/voyages/voyage-010.yaml
  pwsh -File .agents/fleet/validate.ps1 -Schema report -File .agents/fleet/reports/voyage-010-task-001.yaml
#>

param(
  [Parameter(Mandatory)]
  [ValidateSet('voyage', 'task', 'report', 'skill-proposal')]
  [string]$Schema,

  [Parameter(Mandatory)]
  [string]$File
)

$ErrorActionPreference = 'Stop'

$fleetDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$schemaFile = Join-Path $fleetDir "schemas/$Schema.schema.yaml"

# --- 依存チェック ---
if (-not (Get-Module -ListAvailable -Name 'powershell-yaml')) {
  Write-Host '[validate] powershell-yaml モジュールをインストール中...' -ForegroundColor Yellow
  Install-Module -Name powershell-yaml -Scope CurrentUser -Force
}

Import-Module powershell-yaml

# --- ファイル読み込み ---
if (-not (Test-Path $File)) {
  Write-Error "ファイルが見つかりません: $File"
  exit 1
}
if (-not (Test-Path $schemaFile)) {
  Write-Error "スキーマが見つかりません: $schemaFile"
  exit 1
}

$data = Get-Content $File -Raw | ConvertFrom-Yaml
$schemaDef = Get-Content $schemaFile -Raw | ConvertFrom-Yaml

# --- バリデーション関数 ---
$errors = [System.Collections.ArrayList]::new()

function Test-Type {
  param($value, $expectedType, $path)

  switch ($expectedType) {
    'string'  { if ($value -isnot [string]) { $errors.Add("$path : string型が必要 (実際: $($value.GetType().Name))") | Out-Null } }
    'integer' { if ($value -isnot [int] -and $value -isnot [long]) { $errors.Add("$path : integer型が必要") | Out-Null } }
    'array'   { if ($value -isnot [System.Collections.IList]) { $errors.Add("$path : array型が必要") | Out-Null } }
    'object'  { if ($value -isnot [hashtable] -and $value -isnot [System.Collections.Specialized.OrderedDictionary]) { $errors.Add("$path : object型が必要") | Out-Null } }
  }
}

function Test-Property {
  param($value, $propSchema, $path)

  if ($null -eq $value) { return }

  # type check
  if ($propSchema.ContainsKey('type')) {
    Test-Type $value $propSchema.type $path
  }

  # enum check
  if ($propSchema.ContainsKey('enum')) {
    if ($value -notin $propSchema.enum) {
      $allowed = $propSchema.enum -join ', '
      $errors.Add("$path : '$value' は許可されていません (許可値: $allowed)") | Out-Null
    }
  }

  # pattern check
  if ($propSchema.ContainsKey('pattern')) {
    if ($value -is [string] -and $value -notmatch $propSchema.pattern) {
      $errors.Add("$path : パターン不一致 '$($propSchema.pattern)' (値: '$value')") | Out-Null
    }
  }

  # minLength check
  if ($propSchema.ContainsKey('minLength')) {
    if ($value -is [string] -and $value.Length -lt $propSchema.minLength) {
      $errors.Add("$path : 最小文字数 $($propSchema.minLength) (実際: $($value.Length))") | Out-Null
    }
  }

  # maxLength check
  if ($propSchema.ContainsKey('maxLength')) {
    if ($value -is [string] -and $value.Length -gt $propSchema.maxLength) {
      $errors.Add("$path : 最大文字数 $($propSchema.maxLength) (実際: $($value.Length))") | Out-Null
    }
  }

  # minItems check
  if ($propSchema.ContainsKey('minItems')) {
    $count = if ($value -is [System.Collections.IList]) { $value.Count } else { 0 }
    if ($count -lt $propSchema.minItems) {
      $errors.Add("$path : 最小要素数 $($propSchema.minItems) (実際: $count)") | Out-Null
    }
  }

  # array items check
  if ($propSchema.ContainsKey('items') -and $value -is [System.Collections.IList]) {
    $itemSchema = $propSchema.items
    for ($i = 0; $i -lt $value.Count; $i++) {
      $itemPath = "$path[$i]"
      if ($itemSchema.ContainsKey('type')) {
        Test-Type $value[$i] $itemSchema.type $itemPath
      }
      # nested object validation
      if ($itemSchema.ContainsKey('properties')) {
        Test-Object $value[$i] $itemSchema $itemPath
      }
      # $ref support (inline only for $defs)
      if ($itemSchema.ContainsKey('$ref')) {
        $refPath = $itemSchema['$ref']
        if ($refPath -match '^\#/\$defs/(.+)$') {
          $defName = $Matches[1]
          if ($schemaDef.ContainsKey('$defs') -and $schemaDef['$defs'].ContainsKey($defName)) {
            Test-Object $value[$i] $schemaDef['$defs'][$defName] $itemPath
          }
        }
      }
    }
  }
}

function Test-Object {
  param($data, $objectSchema, $path)

  if ($null -eq $data) { return }

  # required check
  if ($objectSchema.ContainsKey('required')) {
    foreach ($req in $objectSchema.required) {
      if (-not $data.ContainsKey($req)) {
        $errors.Add("$path : 必須フィールド '$req' がありません") | Out-Null
      }
    }
  }

  # properties check
  if ($objectSchema.ContainsKey('properties')) {
    foreach ($key in $data.Keys) {
      $propPath = if ($path) { "$path.$key" } else { $key }
      if ($objectSchema.properties.ContainsKey($key)) {
        Test-Property $data[$key] $objectSchema.properties[$key] $propPath
      }
      elseif ($objectSchema.ContainsKey('additionalProperties') -and $objectSchema.additionalProperties -eq $false) {
        $errors.Add("$propPath : 未定義のフィールドです") | Out-Null
      }
    }
  }

  # conditional (if/then) check
  if ($objectSchema.ContainsKey('if') -and $objectSchema.ContainsKey('then')) {
    $ifSchema = $objectSchema['if']
    $matched = $true
    if ($ifSchema.ContainsKey('properties')) {
      foreach ($key in $ifSchema.properties.Keys) {
        $cond = $ifSchema.properties[$key]
        if ($cond.ContainsKey('const')) {
          if (-not $data.ContainsKey($key) -or $data[$key] -ne $cond.const) {
            $matched = $false
          }
        }
      }
    }
    if ($matched) {
      $thenSchema = $objectSchema['then']
      if ($thenSchema.ContainsKey('required')) {
        foreach ($req in $thenSchema.required) {
          if (-not $data.ContainsKey($req)) {
            $errors.Add("$path : 条件付き必須フィールド '$req' がありません (条件: $($ifSchema.properties.Keys -join ','))") | Out-Null
          }
        }
      }
      if ($thenSchema.ContainsKey('properties')) {
        foreach ($key in $thenSchema.properties.Keys) {
          if ($data.ContainsKey($key)) {
            Test-Property $data[$key] $thenSchema.properties[$key] "$path.$key"
          }
        }
      }
    }
  }
}

# --- 実行 ---
Test-Object $data $schemaDef ''

# --- 結果出力 ---
if ($errors.Count -eq 0) {
  Write-Host "[validate] OK: $File ($Schema スキーマ準拠)" -ForegroundColor Green
  exit 0
}
else {
  Write-Host "[validate] NG: $File ($($errors.Count) 件のエラー)" -ForegroundColor Red
  foreach ($err in $errors) {
    Write-Host "  - $err" -ForegroundColor Red
  }
  exit 1
}
