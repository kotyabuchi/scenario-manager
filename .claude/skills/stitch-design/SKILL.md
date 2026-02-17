---
name: stitch-design
description: 要件定義書を元にGoogle Stitch MCPでUIデザインを直接生成する。「Stitchでデザイン」「Stitch生成」「UIデザイン生成」で起動。
argument-hint: "[requirements-file-name]"
---

# Stitch Design Generator

要件定義書（`.claude/requirements/`）を元に、Google Stitch MCP でUIデザインを直接生成する。

## When to Use

- 新機能のUIデザインを Google Stitch で作成したい
- 要件定義書のワイヤーフレーム（ASCII art）をビジュアルデザインに変換したい
- プロジェクトのデザインシステムに沿ったデザインを生成したい

## Prerequisites

- Stitch MCP サーバーが接続済みであること（`mcp__stitch__list_projects` が利用可能）
- 利用不可の場合はセットアップ手順を案内して終了

## Stitch の特性（重要）

公式 Prompt Guide に基づく、Stitch の動作特性:

1. **Stitch は前のデザインを記憶しない** — 毎回レイアウト全体を再生成する
2. **5000文字超のプロンプトでコンポーネントが欠落する** — 複雑な画面は分割生成
3. **複数の変更を1プロンプトに詰めるとレイアウトが崩壊する** — 1プロンプト1変更
4. **形容詞がビジュアルトーンを決定する** — 色・フォント・雰囲気の近道
5. **UI/UX キーワードが要素認識精度を上げる** — "card layout", "navigation bar" 等

## Instructions

### Step 1: 要件定義書の特定

引数 `$ARGUMENTS` が指定されている場合:
- `.claude/requirements/` 内で一致するファイルを探す（拡張子 `.md` は省略可能、`requirements-` プレフィックスも省略可能）

引数がない場合:
- `.claude/requirements/` 内の `.md` ファイルを一覧取得
- **最新4件をユーザーに提示し、AskUserQuestion で選択させる**

### Step 2: 要件定義書の解析

要件定義書を読み込み、以下を抽出する:

1. **機能の概要・目的**（`## 概要` セクション等）
2. **画面一覧**（ワイヤーフレームを含むセクション）
3. **データモデル**（表示すべきフィールドの特定用）
4. **ユーザーストーリー**（UX 文脈の補足用）

### Step 3: デザインシステムの読み込み

Serena メモリ `ui-design-system` を読み込み、以下を取得する:

- カラーパレット（primary, gray, accent 等の HEX 値）
- デザインコンセプト（モダン × ソフト × レイヤードUI）
- コンポーネントパターン（カード、チップ、ボタン等）
- シャドウ・角丸の仕様

### Step 4: Stitch プロジェクトの選択

`mcp__stitch__list_projects` を呼び出し、既存プロジェクトを確認する。

AskUserQuestion で以下を確認:
- 既存プロジェクトを使用するか、新規作成するか
- 既存の場合: どのプロジェクトを使うか

新規作成の場合は `mcp__stitch__create_project` で作成する。

### Step 5: 画面の選択とデバイスタイプの確認

要件定義書から検出した画面一覧を提示し、AskUserQuestion で以下を確認:
- どの画面のデザインを生成するか
- デバイスタイプ（`MOBILE` / `DESKTOP`）— デフォルトは `MOBILE`

### Step 6: 画面の複雑度を判定

要件定義書のワイヤーフレームを分析し、画面の複雑度を判定する。

**シンプルな画面**（1回で生成）:
- コンポーネント数が5個以下
- レイアウトが単純（リスト、フォーム等）
- プロンプトが3000文字以内に収まる

**複雑な画面**（3段階で生成 — 公式推奨）:
- コンポーネント数が6個以上
- フィルタ・ソート・タブなど複数のインタラクティブ要素
- ダッシュボード、管理画面など情報密度が高い画面

### Step 7: プロンプトの組み立て

#### 共通ヘッダー（全プロンプトに含める）

```
A clean, modern, and soft TRPG session management web app for Japanese tabletop RPG
enthusiasts. Warm and inviting with a slight green tint. Borderless design using subtle
shadows instead of borders. Rounded corners (16px cards, 12px buttons/chips).

Color palette: primary #059568 (brand green), page background #f5f8f7, cards #FFFFFF
with soft shadow, headings #383F4C, body text #475061, secondary text #777E8C,
inputs #EAEBED no border, error #D54443, info #437BD9. Clean sans-serif font.
```

**形容詞テクニック**: 共通ヘッダーに含める形容詞で全体のトーンが決まる。
プロジェクトのトーンは「clean, modern, soft, warm, inviting」。

#### シンプルな画面 — 1回のプロンプト

```
{共通ヘッダー}

Screen: {画面名}
{画面の目的を1文で}

Layout (top to bottom):
- {ヘッダー}
- {メインコンテンツ — 具体的なコンポーネントを列挙}
- {フッター/アクション}

{データモデルから導出したプレースホルダーデータ}
```

#### 複雑な画面 — 3段階プロンプト（公式推奨ワークフロー）

**Prompt 1 — 構造の基盤（Structure Foundation）**:

```
{共通ヘッダー}

Screen: {画面名}
{画面の目的を1文で}

Create the core layout with these primary elements only:
- {ヘッダー}
- {メインコンテンツの骨格}
- {プレースホルダーデータ}

Keep it simple. We will add interactive elements in the next step.
```

**Prompt 2 — インタラクティブ要素の追加（`edit_screens`）**:

```
On this screen, add the following interactive elements:
- {フィルタ、ソート、タブ等 — 1〜2個ずつ}
```

**Prompt 3 — 細部の調整（`edit_screens`）**:

```
On this screen, adjust the following details:
- {アイコン、間隔、アライメントの微調整}
```

### Step 8: プロンプト生成ルール

1. **言語**: 英語で生成（Stitch は英語プロンプトの精度が最も高い）
2. **長さ制限**: 1プロンプト3000文字以下を厳守。5000文字超は**禁止**
3. **1プロンプト1変更**: 編集時は1つの変更に集中する
4. **UI/UX 用語を使う**: 以下のキーワードで要素認識精度が上がる
   - `navigation bar`, `card layout`, `call-to-action button`
   - `hero section`, `search bar`, `filter chips`
   - `bottom navigation`, `floating action button`, `modal dialog`
   - `badge`, `avatar`, `progress bar`, `tab bar`
5. **具体的に参照する**: "the primary button on the sign-up form"（どの要素か明確に）
6. **形容詞でトーンを設定**: "vibrant", "minimal", "soft", "warm" など
7. **曖昧な表現を避ける**: "Make it better" ではなく "Increase spacing between cards to 24px"
8. **プレースホルダーデータ**: 要件定義書のサンプルを使用、日本語テキストを含める

### Step 9: Stitch MCP でデザイン生成

組み立てたプロンプトを使い、`mcp__stitch__generate_screen_from_text` を呼び出す。

```
パラメータ:
  projectId: {Step 4 で選択/作成したプロジェクトの ID}
  prompt: {Step 7 で組み立てたプロンプト}
  modelId: "GEMINI_3_PRO"
  deviceType: "MOBILE" または "DESKTOP"
```

**重要**: 生成には数分かかる。**接続エラーでも絶対にリトライしない**。`mcp__stitch__get_screen` で確認する。

**output_components の処理**:
- テキストが含まれている場合: ユーザーに表示する
- サジェスチョンが含まれている場合（例: "Yes, make them all"）: ユーザーに提示し、承認されたら `generate_screen_from_text` を再度呼び出す

### Step 10: 複雑な画面の段階的生成

Step 6 で「複雑」と判定した場合、Prompt 1 の生成後に `edit_screens` で段階的に追加する。

```
Prompt 2 → mcp__stitch__edit_screens:
  projectId: {ID}
  selectedScreenIds: [{生成されたスクリーン ID}]
  prompt: {インタラクティブ要素の追加指示}
  modelId: "GEMINI_3_PRO"

Prompt 3 → mcp__stitch__edit_screens:
  projectId: {ID}
  selectedScreenIds: [{同じスクリーン ID}]
  prompt: {細部の調整指示}
  modelId: "GEMINI_3_PRO"
```

各ステップの間でユーザーに進捗を報告し、確認を取る。

### Step 11: 結果の確認と報告

生成結果をユーザーに報告する:

```
## {画面名} — Stitch デザイン生成完了

**プロジェクト**: {プロジェクト名}
**モデル**: GEMINI_3_PRO
**デバイス**: {MOBILE/DESKTOP}
**生成ステップ**: {1/1 または 1/3}

Stitch Web UI で確認: https://stitch.withgoogle.com

**次のアクション**:
- 調整が必要 → 具体的な変更点を1つずつ指示
- バリエーションが欲しい → バリエーション生成
- 次の画面を生成 → 続けて指示
```

### Step 12: 調整フロー（edit_screens）

ユーザーの調整指示を受けて `mcp__stitch__edit_screens` を呼び出す。

**公式ルール: 1プロンプトで1つの変更のみ**

```
パラメータ:
  projectId: {プロジェクト ID}
  selectedScreenIds: [{編集対象のスクリーン ID}]
  prompt: {ユーザーの調整指示を英語に変換 — 具体的に}
  modelId: "GEMINI_3_PRO"
  deviceType: "MOBILE" または "DESKTOP"
```

**良い調整プロンプトの例**（具体的・1変更）:
- 「色を変えて」→ "Change primary color to forest green"
- 「フォントを変えて」→ "Use a playful sans-serif font for all text"
- 「カードの間隔を広く」→ "Increase spacing between cards to 24px"
- 「ヘッダーを固定に」→ "Make the header sticky at the top of the screen"
- 「ボタンを丸く」→ "Make all buttons have fully rounded corners"
- 「テキストを日本語に」→ "Switch all text content to Japanese"

**悪い調整プロンプトの例**（複数変更 — レイアウト崩壊リスク）:
- ❌ "Change the colors, move the header, and add a sidebar"
- ❌ "Redesign the entire card layout and update the navigation"

ユーザーが複数の変更を要求した場合、1つずつ順番に `edit_screens` を呼び出す。

### Step 13: バリエーションフロー（generate_variants）

`mcp__stitch__generate_variants` で複数のデザイン案を生成する。

```
パラメータ:
  projectId: {プロジェクト ID}
  selectedScreenIds: [{対象のスクリーン ID}]
  prompt: "Generate design variants"
  modelId: "GEMINI_3_PRO"
  deviceType: "MOBILE" または "DESKTOP"
  variantOptions:
    variantCount: 3
    creativeRange: "EXPLORE"
    aspects: []
```

**creativeRange の使い分け**:
| レンジ | 説明 | 用途 |
|--------|------|------|
| `REFINE` | 微調整、元に近い | 色やフォントの微修正 |
| `EXPLORE` | バランスの取れた探索（デフォルト） | 複数案の比較検討 |
| `REIMAGINE` | 根本的に異なるデザイン | 方向性が定まらない初期段階 |

**aspects（変更対象の限定）**:
| アスペクト | 説明 |
|-----------|------|
| `LAYOUT` | レイアウト配置 |
| `COLOR_SCHEME` | カラースキーム |
| `IMAGES` | 画像 |
| `TEXT_FONT` | フォント |
| `TEXT_CONTENT` | テキスト内容 |

### Step 14: 次の画面 / 完了の確認

AskUserQuestion で以下を確認:
- 他の画面のデザインも生成するか → Step 5 に戻る
- 今の画面を調整するか → Step 12（編集フロー）へ
- バリエーションを生成するか → Step 13 へ
- 完了

## Available Stitch MCP Tools Reference

| ツール | 用途 | 主なパラメータ |
|--------|------|----------------|
| `list_projects` | プロジェクト一覧 | `filter` |
| `create_project` | プロジェクト作成 | `title` |
| `get_project` | プロジェクト詳細 | `name`（`projects/{id}` 形式） |
| `list_screens` | スクリーン一覧 | `projectId` |
| `get_screen` | スクリーン詳細 | `name`, `projectId`, `screenId` |
| `generate_screen_from_text` | **デザイン生成** | `projectId`, `prompt`, `modelId`, `deviceType` |
| `edit_screens` | **既存スクリーン編集** | `projectId`, `selectedScreenIds`, `prompt`, `modelId` |
| `generate_variants` | **バリエーション生成** | `projectId`, `selectedScreenIds`, `prompt`, `variantOptions` |

## Error Handling

| 状況 | 対応 |
|------|------|
| Stitch MCP 未接続 | セットアップ手順を案内 |
| 認証エラー | API Key の確認を案内（Stitch Settings ページ） |
| 要件定義書が見つからない | `.claude/requirements/` にファイルがない旨を報告 |
| ワイヤーフレームがない | データモデルとユーザーストーリーから画面構成を推測 |
| デザインシステムメモリ読み込み失敗 | デフォルトのカラーパレットをテンプレートから使用 |
| プロンプトが3000文字超 | 画面を分割して3段階生成に切り替え |
| 生成タイムアウト/接続エラー | **リトライ禁止**。`get_screen` で確認 |
| 生成に失敗 | モデルを `GEMINI_3_FLASH` に切り替えて再試行 |
| edit で他のスクリーンが消えた | 1変更ずつに分割して再実行 |

## Notes

- このスキルは `/pencil-design` の代替ではなく補完。Pencil は実装直結、Stitch はビジュアル探索向き
- Stitch の出力は Figma にエクスポート可能（Web UI から操作）
- **Stitch は前のデザインを記憶しない** — 編集は `edit_screens` で、再生成ではない
- `generate_screen_from_text` は数分かかる場合がある。**絶対にリトライしない**
- GEMINI_3_PRO はデフォルト。ユーザーが「速く」「ラフに」と言った場合のみ FLASH を使う
