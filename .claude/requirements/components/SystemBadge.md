# SystemBadge コンポーネント 要件定義書

**作成日**: 2026-01-26
**TDDフェーズ**: 要件定義
**Pencilデザイン**: docs/designs/scenarios.pen > Components > SystemBadge/*

---

## 1. 概要

### 1.1 目的
シナリオのシステム（CoC7版、SW2.5等）を視覚的に識別するためのバッジコンポーネント。
カードの左上角に配置され、波形のカットアウトデザインで特徴的な見た目を提供する。

### 1.2 使用場所
- `src/app/(main)/scenarios/_components/ScenarioCard.tsx`: シナリオカードの左上
- 再利用性: 中（シナリオ関連画面で使用）

### 1.3 Ark UI / 既存コンポーネントとの関係
- ベース: なし（独自実装）
- スタイリング: PandaCSS + SVG（波形カットアウト）

---

## 2. Props設計

### 2.1 必須Props

| Prop | 型 | 説明 |
|------|-----|------|
| `system` | `ScenarioSystem` | システム情報（name, colorを含む） |

### 2.2 オプショナルProps

| Prop | 型 | デフォルト | 説明 |
|------|-----|-----------|------|
| `size` | `"sm" \| "md"` | `"md"` | サイズ |

### 2.3 型定義

```typescript
type SystemBadgeProps = {
  system: {
    name: string;
    color: 'green' | 'purple' | 'orange' | 'blue' | 'red';
  };
  size?: 'sm' | 'md';
};
```

---

## 3. Variants

### 3.1 color（システムカラー）

| 値 | カラーコード | 対象システム例 |
|-----|-------------|---------------|
| `green` | #10B981 | クトゥルフ神話TRPG 7版 |
| `purple` | #8B5CF6 | ソード・ワールド2.5 |
| `orange` | #F59E0B | クトゥルフ神話TRPG 6版 |
| `blue` | #3B82F6 | その他 |
| `red` | #EF4444 | その他 |

### 3.2 size

| 値 | テキストサイズ | パディング |
|-----|--------------|-----------|
| `sm` | 10px | 4px 8px |
| `md` | 11px | 6px 12px |

---

## 4. Pencilデザイン詳細

### 4.1 SystemBadge/Green (rFgeD)
```
本体:
  fill: #10B981
  text: #FFFFFF, 11px, fontWeight: 600
  cornerRadius: [0, 0, 8px, 0]（右下のみ丸み）
  padding: 6px 12px

波形カットアウト:
  右側に16x16の波形（SVGパス）
  下側に16x16の波形（SVGパス）
  同じ色(#10B981)で塗りつぶし

全体サイズ: 約81x44px（テキスト依存）
```

### 4.2 構造

```
┌─────────────┐
│  CoC7版    ╲  ← 波形カットアウト（右）
│             │
└─────────────┘
              ↑ 波形カットアウト（下）
```

---

## 5. インタラクション

### 5.1 状態

このコンポーネントはインタラクティブではない（表示のみ）。

| 状態 | 見た目の変化 |
|------|-------------|
| default | 通常表示 |

### 5.2 親要素への配置

```typescript
// カード左上に絶対配置
position: 'absolute',
top: 0,
left: 0,
```

---

## 6. アクセシビリティ

### 6.1 セマンティクス

```typescript
<span role="img" aria-label={`システム: ${system.name}`}>
  {system.name}
</span>
```

### 6.2 コントラスト確認

| 組み合わせ | コントラスト比 | 判定 |
|-----------|--------------|------|
| 各色背景 + 白文字 | 3:1以上 | ✅（大きいテキスト基準） |

---

## 7. テスト観点

### 7.1 レンダリング

- [ ] システム名が正しく表示される
- [ ] color="green"で緑色になる
- [ ] color="purple"で紫色になる
- [ ] color="orange"でオレンジ色になる
- [ ] size="sm"が正しいサイズで表示される
- [ ] size="md"が正しいサイズで表示される

### 7.2 アクセシビリティ

- [ ] aria-labelが設定される

---

## 8. 実装ファイル

### 8.1 ファイル構成

```
src/components/elements/system-badge/
├── system-badge.tsx         # コンポーネント本体
├── styles.ts                # スタイル定義
├── system-badge.stories.tsx # Storybook
├── system-badge.test.tsx    # テスト
└── index.ts                 # エクスポート
```

---

## 9. 使用例

```tsx
<div style={{ position: 'relative' }}>
  <SystemBadge system={{ name: 'CoC7版', color: 'green' }} />
  <Card>...</Card>
</div>
```

---

## 10. TDD対象一覧

| 対象 | 種別 | ファイルパス | 状態 |
|------|------|-------------|------|
| SystemBadge | コンポーネント | `src/components/elements/system-badge/system-badge.tsx` | 未実装 |

---

## 11. 次のフェーズへの引き継ぎ

```
コンポーネント要件定義が完了しました。

📄 要件定義書: .claude/requirements/components/SystemBadge.md
🎨 Pencilデザイン: docs/designs/scenarios.pen > Components > SystemBadge/*

次のフェーズ:
/gen-test SystemBadge
```
