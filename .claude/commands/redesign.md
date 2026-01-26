---
allowed-tools: Read, Glob, Grep, Write, Edit, Bash, AskUserQuestion, mcp__pencil__get_editor_state, mcp__pencil__batch_get, mcp__pencil__get_screenshot, mcp__pencil__open_document
description: Pencilデザインを唯一の情報源として、既存実装に引きずられずにUIをリデザインする。テストも確実に通過させる。
---

# /redesign コマンド

## 概要

**Pencilデザインを唯一の情報源（Single Source of Truth）として、UIをリデザインするスキル**

既存実装を参照せず、Pencilデザインから仕様を抽出して純粋に実装する。
実装後はテストを実行し、すべてパスするまで修正を行う。

```
Pencilデザイン読み込み → 仕様抽出 → 実装 → テスト → 完了
        ↑                              ↓
        └── 失敗なら修正 ←─────────────┘
```

## 重要な原則

### 1. Pencil First（デザイン優先）

**絶対に既存実装を先に読まない。** Pencilデザインを先に読み、仕様を完全に把握してから実装する。

| 順序 | 正しいアプローチ | 間違ったアプローチ |
|------|-----------------|-------------------|
| 1 | Pencilを読む | 既存コードを読む |
| 2 | 仕様を抽出する | 「ここを変えればいい」と判断 |
| 3 | 実装を書く | 既存コードをベースに修正 |

### 2. 既存実装に引きずられない

既存コードを見ることで無意識に影響を受ける。以下を徹底する:

- **要素の順序**: Pencilの children 配列の順序をそのまま使う
- **色・サイズ**: Pencilの値を使う（既存と同じでも確認する）
- **レイアウト**: Pencilの padding, gap, alignment を使う
- **アイコン**: Pencilで指定されたアイコンを使う

### 3. テストによる品質保証

リデザイン後、既存のテストがすべてパスすることを確認する。
テストが失敗した場合は、デザインを維持しつつ修正する。

---

## 使用方法

```bash
/redesign もっと見るボタン              # 特定のUI要素をリデザイン
/redesign シナリオ検索画面              # 画面全体をリデザイン
/redesign ScenarioCard                 # コンポーネント名で指定
/redesign --dry-run                    # 実装せず仕様抽出のみ
```

---

## 実行手順

### Phase 1: Pencilデザインの読み込み

#### Step 1.1: エディタ状態の確認

```typescript
mcp__pencil__get_editor_state({ include_schema: false })
```

現在開いている .pen ファイルと、利用可能なフレーム/コンポーネントを確認する。

#### Step 1.2: 対象要素の特定

$ARGUMENTS を解析し、対象のデザイン要素を特定:

1. **日本語名で指定された場合**: Pencilの `name` プロパティで検索
   ```typescript
   mcp__pencil__batch_get({
     filePath: "docs/designs/scenarios.pen",
     patterns: [{ name: "もっと見る" }],
     readDepth: 3,
     resolveVariables: true
   })
   ```

2. **英語名/コンポーネント名の場合**: 同様にnameで検索

3. **画面名の場合**: トップレベルフレームを検索
   ```typescript
   mcp__pencil__batch_get({
     filePath: "docs/designs/scenarios.pen",
     patterns: [{ name: "Scenarios / 検索画面" }],
     readDepth: 4,
     resolveVariables: true
   })
   ```

#### Step 1.3: 完全な仕様抽出

**すべての仕様をPencilから抽出する。** 抽出項目:

| カテゴリ | 抽出項目 |
|---------|---------|
| レイアウト | layout, alignItems, justifyContent, gap, padding |
| サイズ | width, height |
| 背景 | fill（色コード） |
| 角丸 | cornerRadius |
| 影 | effect.blur, effect.color, effect.offset |
| テキスト | content, fontSize, fontWeight, fontFamily, fill |
| アイコン | iconFontName, width, height, fill |
| 子要素 | children（**順序が重要**） |

**仕様抽出の例**:

```markdown
## 抽出した仕様: もっと見るボタン

### レイアウト
- type: frame
- alignItems: center
- gap: 8px
- padding: 0 32px
- height: 44px
- cornerRadius: 8px

### スタイル
- fill: #FFFFFF (white)
- shadow: 0 2px 8px rgba(0, 0, 0, 0.05)
  - blur: 8
  - offset: { x: 0, y: 2 }
  - color: #0000000D

### 子要素（順序重要）
1. アイコン (moreIcon)
   - iconFontName: chevron-down
   - width: 18, height: 18
   - fill: #6B7280 (gray.500)

2. テキスト (moreText)
   - content: "もっと見る"
   - fontSize: 14
   - fontWeight: 500
   - fill: #374151 (gray.700)
```

---

### Phase 2: 実装対象の特定（コード読み込みは最小限）

#### Step 2.1: ファイルパスの特定のみ

既存コードは**ファイルパスの特定のみ**に使用する。実装内容は読まない。

```bash
# ファイルパスのみ特定
grep -l "もっと見る" src/**/*.tsx
```

#### Step 2.2: 対象行の特定

```bash
# 該当箇所の行番号のみ特定
grep -n "もっと見る" src/app/(main)/scenarios/_components/ScenariosContent.tsx
```

**注意**: この時点でコードの実装詳細を読まない。行番号だけ把握する。

---

### Phase 3: Pencil仕様に基づく実装

#### Step 3.1: 既存の削除または置換

Pencilの仕様に基づいて、対象部分を完全に書き換える。

**重要**: 既存コードをベースに「修正」するのではなく、Pencilの仕様から「新規実装」する感覚で書く。

#### Step 3.2: 色のトークン化

ハードコードされた色は使用しない。セマンティックトークンを使用する。

| Pencilの値 | トークン | 備考 |
|-----------|---------|------|
| #FFFFFF | white | 基本色 |
| #F5F7FA | bg.page | ページ背景 |
| #6B7280 | gray.500 | アイコン色 |
| #374151 | gray.700 | テキスト色 |
| shadow 0 2px 8px | header.default | 既存トークンを確認 |

トークンが存在しない場合は `semanticTokens.ts` に追加する。

#### Step 3.3: 要素順序の確認

**Pencilの children 配列の順序をそのまま反映する。**

```typescript
// Pencil: children = [icon, text]
<Button>
  <ChevronDown /> {/* 1. アイコンが先 */}
  もっと見る       {/* 2. テキストが後 */}
</Button>

// NG: 既存実装の順序を維持（Pencilと異なる場合）
<Button>
  もっと見る <ChevronDown />
</Button>
```

#### Step 3.4: 実装コード例

```typescript
// Pencil仕様に完全準拠した実装
<Button
  variant="outline"
  status="primary"
  onClick={handleLoadMore}
  className={css({
    px: '32px',           // Pencil: padding [0, 32]
    shadow: 'header.default', // Pencil: blur:8, y:2, #0000000D
  })}
>
  {/* Pencil children順序: 1.icon, 2.text */}
  <ChevronDown
    size={18}  // Pencil: width/height: 18
    className={css({ color: 'gray.500' })}  // Pencil: fill: #6B7280
  />
  もっと見る
</Button>
```

---

### Phase 4: テスト実行と検証

#### Step 4.1: 関連テストの実行

```bash
# コンポーネントテスト
pnpm vitest run src/app/(main)/scenarios

# 全テスト
pnpm vitest run
```

#### Step 4.2: テスト失敗時の対応

テストが失敗した場合:

1. **デザインは維持**: Pencilの仕様は変えない
2. **テストの期待値を確認**: aria-label、テキスト内容など
3. **必要に応じてテストを更新**: デザイン変更に伴う正当な変更の場合

```markdown
⚠ テスト失敗

失敗したテスト:
- ScenariosContent > もっと見るボタン > テキストが「もっと見る」である

原因:
- Pencilの仕様にはアイコンが含まれているが、テストはテキストのみを期待

対応:
[テストを更新] [実装を修正] [確認して判断]
```

#### Step 4.3: 品質検証

```bash
# Lint/Format
pnpm check

# 型チェック
npx tsc --noEmit

# ビルド（必要に応じて）
pnpm build
```

---

### Phase 5: 完了処理

#### Step 5.1: 変更サマリー

```markdown
## リデザイン完了

### 対象
- ファイル: src/app/(main)/scenarios/_components/ScenariosContent.tsx
- 要素: もっと見るボタン

### Pencilからの変更点
| 項目 | Before | After (Pencil準拠) |
|------|--------|-------------------|
| バリアント | subtle | outline |
| 背景色 | gray.100 | white |
| 影 | なし | header.default |
| アイコン位置 | 右 | 左 |
| アイコンサイズ | 16px | 18px |
| アイコン色 | 継承 | gray.500 |
| パディング | 20px | 32px |

### テスト結果
- ✅ 全テストパス (15/15)
- ✅ Lint/Format パス
- ✅ 型チェック パス
```

---

## チェックリスト

リデザイン時に確認すべき項目:

### デザイン準拠
- [ ] Pencilの fill（背景色）を使用しているか
- [ ] Pencilの effect（影）を使用しているか
- [ ] Pencilの padding/gap を使用しているか
- [ ] Pencilの children 順序を守っているか
- [ ] Pencilのアイコン名・サイズ・色を使用しているか
- [ ] Pencilのテキストスタイル（fontSize, fontWeight, fill）を使用しているか

### コード品質
- [ ] 色はセマンティックトークンを使用しているか
- [ ] 影は既存のシャドウトークンを使用しているか（なければ追加）
- [ ] ハードコードされた値がないか

### テスト
- [ ] 関連テストがすべてパスするか
- [ ] Lint/Formatがパスするか
- [ ] 型チェックがパスするか

---

## トラブルシューティング

### Pencilに該当要素が見つからない

```
⚠ "もっと見る" が見つかりません

対応:
1. get_editor_state で現在のドキュメントを確認
2. 別のフレーム内にないか確認
3. 名前が異なる可能性（英語名など）

どうしますか？
[全ノードを検索] [フレームを指定して検索] [ファイルを開き直す]
```

### 色がトークンに存在しない

```
⚠ Pencilの色 #F5F7FA に対応するトークンがありません

対応:
1. semanticTokens.ts に追加する
2. 近い既存トークンを確認（gray.50など）

推奨: セマンティックトークンに追加して使用
```

### テストとデザインが競合

```
⚠ テストの期待値がPencilデザインと異なります

テスト: アイコンはボタンの右側にある
Pencil: アイコンはボタンの左側

対応:
1. Pencilが正（デザイン優先）
2. テストを更新してPencilに準拠させる
```

---

## 参照ファイル

| ファイル | 用途 |
|----------|------|
| `docs/designs/*.pen` | Pencilデザインファイル |
| `src/styles/semanticTokens.ts` | セマンティックトークン |
| `src/styles/tokens/colors.ts` | 基本カラートークン |
| `.serena/memories/ui-design-system.md` | UIデザインシステム |
