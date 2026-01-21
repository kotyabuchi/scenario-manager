# UIデザインシステム詳細化 作業メモ

このドキュメントは既存の `ui-design-system.md` をさらに詳細化するための作業用ドキュメントです。
完成したら既存のメモリに統合します。

---

## 重要な設計決定（2026-01-21更新）

### タップターゲット: 26px最小（Apple 44pxは不採用）
- デスクトップWebアプリには44pxは大きすぎる
- シナリオカードのお気に入りボタン（26px）が視覚的・操作的に許容できる最小サイズ

### フォーカスリング: `outline`を使用（`box-shadow`禁止）
- アクセシビリティ的に`outline`がブラウザ標準で正しい
- `box-shadow`での再現は禁止
- `outlineOffset: '2px'`で視認性確保

### overflow: hidden との競合対策
- `outline`は要素外に描画されるため、親の`overflow: hidden`で切れる
- 折りたたみアニメーション等では、展開時に`overflow: visible`へ切り替える

---

## 詳細化の優先順位

### 🔴 最優先（すぐに必要）
- [ ] スペーシングシステムの明確化
- [ ] フォーム要素（input, textarea, select, checkbox）
- [ ] ボタンのバリアント

### 🟡 次点（よく使う）
- [ ] エラー・空状態・ローディング表示
- [ ] カード内部構造（header, body, footerの余白ルール）
- [ ] リスト・グリッドレイアウトパターン

### 🟢 補完（細かい部分）
- [ ] アイコンのサイズと配置ルール
- [ ] 数値・日付表示の統一フォーマット
- [ ] レスポンシブブレイクポイント
- [ ] 各状態のスタイル（disabled, loading, error, success）

---

## 詳細化の進め方

各項目について以下を明確にする：
1. **用途**: どんな場面で使うか
2. **実装**: 具体的なスタイル定義
3. **例**: コード例とビジュアル表現
4. **禁止**: やってはいけないこと

---

## 1. Appleデザイン原則（採用/不採用の整理）

### 1.1 採用する原則

#### デザイン哲学（4原則）

| 原則 | 説明 | 本プロジェクトでの適用 |
|------|------|----------------------|
| **Clarity（明確さ）** | 一目で理解できる、不要な複雑さを排除 | シンプルなUI、情報の優先順位を明確に |
| **Deference（従順さ）** | UIがコンテンツの邪魔をしない | 控えめな装飾、コンテンツファースト |
| **Depth（深度）** | レイヤー・シャドウ・モーションで階層を表現 | 影によるレイヤード表現（既存方針と一致） |
| **Consistency（一貫性）** | 標準的なUI要素と視覚的手がかりの統一 | トークンシステム、コンポーネント再利用 |

#### 8ptグリッドシステム

**採用理由**: 予測可能で調和的なスペーシングを実現

- 主要スペーシング: 8の倍数（8, 16, 24, 32px）
- 補助グリッド: 4の倍数（4, 12, 20px）
- 詳細は後述の「スペーシングシステム」セクション参照

#### タップターゲット26px以上（プロジェクト独自基準）

**採用理由**: Apple HIG推奨の44pxはWebアプリには大きすぎるため、本プロジェクト独自の基準を採用

**基準の根拠**: シナリオカードのお気に入りボタン（26px）が視覚的・操作的に許容できる最小サイズ

| 要素 | 最小サイズ | 備考 |
|------|-----------|------|
| アイコンボタン | 26×26px | お気に入りボタン等の小さいボタン |
| テキストボタン | 高さ26px以上 | タブ、展開ボタン等 |
| フォーム要素 | 高さ32px以上 | Input, Select等（入力しやすさ考慮） |

**不採用**: Apple HIG 44px（デスクトップWebには大きすぎる）

**実装例**:
```typescript
// 最小のアイコンボタン（26px）
export const iconButtonSmall = css({
  minW: '26px',
  minH: '26px',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  '& svg': {
    w: '14px',
    h: '14px',
  },
});
```



#### タイポグラフィの原則

| 原則 | 説明 | 本プロジェクトでの適用 |
|------|------|----------------------|
| UI用とテキスト用の使い分け | Apple: SF Pro Display（UI）/ SF Pro Text（長文） | 同様の考え方でフォントサイズ・行間を調整 |
| サイズに応じた文字間隔 | 小さいテキストは広め、大きいテキストは狭め | PandaCSSのfontSizeトークンで調整 |

---

### 1.2 不採用とする原則

#### Squircle（スーパー楕円）

**不採用理由**: 導入コストが高い

- CSSのborder-radiusでは再現不可
- SVGマスクやcanvasが必要
- Figmaでの再現: `サイズ × 0.222` + コーナースムージング61%
- Webでの実装は複雑すぎるため、通常の角丸（border-radius）を使用

**代替**: 通常の角丸16px（4の倍数）で統一

#### Liquid Glass（iOS 26〜）

**不採用理由**: ユーザーから不評

- 2025年6月発表のApple新デザイン言語
- 半透明性、リアルタイムブラー、スペキュラハイライト等
- ユーザーからの評判が悪く、アクセシビリティ上の懸念もあり
- 本プロジェクトのターゲット層（TRPGプレイヤー）には不向き

**代替**: 既存の「モダン × ソフト × レイヤードUI」を継続

---

## 2. スペーシングシステム（Apple HIG準拠）

### 設計原則：Apple流

**8ptグリッドシステム**を基本とし、予測可能で調和的なスペーシングを実現する。

| 原則 | 説明 |
|------|------|
| **8ptグリッド** | 主要スペーシングは8の倍数（8, 16, 24, 32px） |
| **4ptサブグリッド** | 細かい調整に4の倍数（4, 12, 20px） |
| **階層的近接** | 関連性の高さ = 距離の近さ |
| **呼吸するレイアウト** | 余白を恐れず、情報を詰め込まない |
| **一貫性** | 同じ用途には常に同じ値 |

### 現状の課題と移行方針

**現状**: 黄金比（5, 8, 13, 21, 34px）と固定値（4, 8, 12, 16, 24px）が混在  
**移行先**: Apple流8ptグリッド（4, 8, 12, 16, 24, 32, 40, 48px）

---

### 既存トークンの移行マッピング

#### 現在の`spacing.ts`（黄金比ベース）

```typescript
// 現在（削除予定）
xs: 5px   (0.382rem)
sm: 8px   (0.618rem)
md: 13px  (0.8125rem)
lg: 21px  (1.3125rem)
xl: 34px  (2.125rem)
```

#### 新しい`spacing.ts`（8ptグリッド）

```typescript
// 新システム
export const spacing = defineTokens.spacing({
  '1':  { value: '0.25rem' },   // 4px
  '2':  { value: '0.5rem' },    // 8px
  '3':  { value: '0.75rem' },   // 12px
  '4':  { value: '1rem' },      // 16px
  '5':  { value: '1.25rem' },   // 20px
  '6':  { value: '1.5rem' },    // 24px
  '8':  { value: '2rem' },      // 32px
  '10': { value: '2.5rem' },    // 40px
  '12': { value: '3rem' },      // 48px
  '16': { value: '4rem' },      // 64px
});
```

#### 既存コンポーネントの変換表

| 旧トークン | 実寸 | 新トークン | 実寸 | 差分 | 対応 |
|----------|------|-----------|------|------|------|
| `xs` | 5px | `1` | 4px | -1px | ほぼ同等 |
| `sm` | 8px | `2` | 8px | 0px | **完全一致** |
| `md` | 13px | `3` | 12px | -1px | 視覚的に同等 |
| `lg` | 21px | `5` | 20px | -1px | 視覚的に同等 |
| `xl` | 34px | `8` | 32px | -2px | やや小さくなる |

**影響評価**: 最大でも-2pxの差なので、視覚的な影響は最小限。

---

### 移行手順

1. **新しいspacing.tsを作成**（8ptグリッド）
2. **pnpm prepareでPandaCSSを再生成**
3. **既存コンポーネントを順次更新**（変換表に従う）
4. **新規コンポーネントは8ptグリッドのみ使用**

#### 優先順位

| フェーズ | 対象 | 理由 |
|---------|------|------|
| Phase 1 | 新規コンポーネント | 即座に8ptグリッド適用 |
| Phase 2 | よく使うコンポーネント（Button, Chip, Input） | 影響範囲の可視化 |
| Phase 3 | レイアウトコンポーネント（Card, Profile） | 余白の調和確認 |
| Phase 4 | 残りすべて | 完全移行 |

---

#### Apple流8ptグリッドシステム

すべてのスペーシングを**8の倍数**または**4の倍数**に統一。

##### 基本スケール

| トークン | 実寸 | Apple HIG | 用途 |
|---------|------|-----------|------|
| `1` | 4px | Compact spacing | 極小gap（サブグリッド） |
| `2` | 8px | **基本単位** | 小gap、密接な関連要素 |
| `3` | 12px | Medium-compact | 中間調整（サブグリッド） |
| `4` | 16px | **標準spacing** | 標準gap、ボタン内padding |
| `5` | 20px | Medium-large | 中〜大サイズ要素（サブグリッド） |
| `6` | 24px | Large spacing | 大gap、セクション内要素間 |
| `8` | 32px | Extra large | セクション間、カードpadding |
| `10` | 40px | 2XL spacing | 大セクション間 |
| `12` | 48px | 3XL spacing | ページレベルの余白 |
| `16` | 64px | 4XL spacing | 特大セクション間（まれ） |

**トークン命名**: 数値そのまま（`1` = 4px, `2` = 8px...）で直感的に理解可能

---

#### 階層的近接の原則（Apple流）

**距離 = 関連性の逆数**

| 関連度 | 距離（トークン） | 実例 |
|--------|-----------------|------|
| **最密接** | `1` (4px) | アイコン↔︎ラベル、チェックボックス↔︎テキスト |
| **密接** | `2` (8px) | リストアイテム間、ボタン内の縦padding |
| **関連** | `3`-`4` (12-16px) | フォームのラベル↔︎入力欄、カード内要素 |
| **グループ** | `5`-`6` (20-24px) | フォーム要素間、カードpadding |
| **セクション** | `8` (32px) | 異なるセクション間、ページ内ブロック |
| **ページ** | `10`-`12` (40-48px) | ページレベルの余白、ヒーローセクション |

---

#### 用途別ガイドライン

| 用途 | トークン | 実寸 | 理由 |
|------|---------|------|------|
| **アイコン↔︎テキスト** | `1` または `2` | 4-8px | 視覚的な一体感 |
| **リストアイテム間** | `2` | 8px | 密接だが識別可能 |
| **ボタン内padding（縦）** | `2` | 8px | 最小タップ領域確保 |
| **ボタン内padding（横）** | `4` | 16px | 十分な余白 |
| **入力フィールド内padding** | `3` × `2` | 12px × 8px | テキスト呼吸空間 |
| **フォーム要素間** | `5` または `6` | 20-24px | 各項目の独立性 |
| **カード内要素間** | `4` | 16px | グループ内の標準gap |
| **カード全体padding** | `6` または `8` | 24-32px | 内容物との余白確保 |
| **セクション区切り** | `8` | 32px | 明確な分離 |
| **ページセクション間** | `10`-`12` | 40-48px | 大きな構造の分離 |

---

#### 呼吸するレイアウト（Appleの美学）

**小さすぎる余白を恐れない、大きすぎる余白も恐れない**

| 状況 | 推奨 | 避けるべき |
|------|------|-----------|
| 重要なCTA周辺 | `8`-`10` (32-40px) | `4` (16px) - 埋もれる |
| カード密集レイアウト | `4`-`6` (16-24px) | `2` (8px) - 窮屈 |
| ヒーローセクション | `12`-`16` (48-64px) | `6` (24px) - 迫力不足 |
| テキスト段落間 | `3`-`4` (12-16px) | `1` (4px) - 読みにくい |

**Appleの教え**: 余白は贅沢ではなく、情報を呼吸させるための必需品。

---

#### 実装時の注意点

**統一ルール**:
1. 8の倍数を優先（`2`, `4`, `6`, `8`）
2. 微調整が必要な場合のみ4の倍数（`1`, `3`, `5`）
3. 同じ用途には常に同じ値

**禁止**:
- 任意の値（9px, 15px等）の使用
- トークン外のマジックナンバー
- 用途が同じなのに異なる値を使う

**例外**:
- line-height: 1.5, 1.7等（タイポグラフィ）
- border: 1px, 2px（視覚的な境界線）
- transform: translateY(-2px)（微小なインタラクション）

---

## 2. フォーム要素（作業中）

### 設計原則

**ボーダーレスを貫く**:
- 通常時: borderあり（ただし控えめ）
- フォーカス時: border強調 + box-shadow
- 背景色: 入力可能であることを示すため、ページ背景より少し異なる色

**アクセシビリティ**:
- placeholderだけに頼らず、labelを必ず表示
- フォーカス状態は視覚的に明確（コントラスト比3:1以上）
- disabled状態は操作不可を明示

---

### 2.1 Input / Textarea（ボーダーレス版）

#### 設計原則

**このプロジェクトのトーンに準拠**:
- ✅ **borderは必要最小限に** - 影＋背景で表現できる場合はそちらを優先
- ✅ **影で輪郭を表現**（カード・パネル等の大きめ要素）
- ✅ **背景色で状態を示す**
- ✅ **セマンティックトークンを使用**

**borderを使ってよい場面**:
- 小さい要素（16px以下）で視認性が必要な場合（Checkbox/Radio）
- データの区切り（Table、リスト項目の境界線）
- 選択状態の明確な表示（Tab、アクティブなナビゲーション）
- セマンティックHTML（`<hr>`要素等）

---

#### 基本スタイル（通常時）

```typescript
export const input = css({
  w: 'full',
  px: '3',                    // 左右12px（8ptグリッド）
  py: '2',                    // 上下8px（8ptグリッド）
  border: 'none',             // ✅ ボーダーレス
  borderRadius: 'md',
  fontSize: 'sm',
  outline: 'none',
  
  // 背景と影で輪郭を表現
  bg: 'input.default',        // ✅ セマンティックトークン（後で追加）
  shadow: 'input.default',    // ✅ 柔らかい影で輪郭
  
  color: 'text.primary',
  transition: 'all 0.2s ease',
});
```

**新規セマンティックトークン（`semanticTokens.ts`に追加必要）**:
```typescript
colors: {
  input: {
    default: { value: '{colors.neutral.50}' },  // 淡いグレー背景
    hover: { value: '{colors.neutral.100}' },
    focus: { value: '{colors.white}' },
  },
},
shadows: {
  input: {
    default: { value: '0 1px 3px rgba(0, 0, 0, 0.06)' },      // 控えめな影
    hover: { value: '0 2px 4px rgba(0, 0, 0, 0.08)' },        // ホバーで少し強調
    focus: { value: '0 0 0 3px {colors.primary.focusRing}' }, // フォーカスリング
  },
}
```

---

#### ホバー時

```typescript
_hover: {
  bg: 'input.hover',
  shadow: 'input.hover',
}
```

---

#### フォーカス時

```typescript
_focusVisible: {
  bg: 'input.focus',
  outline: '2px solid',
  outlineColor: 'primary.focusRing',
  outlineOffset: '2px',
}
```

**重要**: 
- `_focusVisible`を使用（マウスクリック時は非表示、キーボード操作時のみ表示）
- フォーカスリングは`outline`（ブラウザ標準）を使用
- `box-shadow`での再現は**禁止**（アクセシビリティ的にoutlineが正しい）
- `outlineOffset: '2px'`で要素から少し離して視認性を確保

#### overflow: hidden との競合

`outline`は要素の外側に描画されるため、親コンテナに`overflow: hidden`があると切れる。

**対処法**: 折りたたみアニメーション等で`overflow: hidden`を使う場合、展開時は`overflow: visible`に切り替える。

```typescript
// 折りたたみコンテナの例
export const collapsible = cva({
  base: {
    transition: 'all 0.3s ease-in-out',
  },
  variants: {
    expanded: {
      true: {
        maxHeight: '1000px',
        opacity: 1,
        overflow: 'visible',  // ✅ 展開時はoutlineが見えるように
      },
      false: {
        maxHeight: '0',
        opacity: 0,
        overflow: 'hidden',   // 折りたたみ時のみhidden
      },
    },
  },
});
```

---

#### Placeholder

```typescript
_placeholder: {
  color: 'text.subtle',      // セマンティックトークン使用
  opacity: 0.6,
}
```

---

#### Disabled状態

```typescript
_disabled: {
  bg: 'input.disabled',      // セマンティックトークン（後で追加）
  color: 'text.disabled',    // セマンティックトークン（後で追加）
  shadow: 'none',            // 影を消して「触れない」感を出す
  cursor: 'not-allowed',
  opacity: 0.6,
}
```

**新規セマンティックトークン**:
```typescript
colors: {
  input: {
    disabled: { value: '{colors.neutral.100}' },
  },
  text: {
    disabled: { value: '{colors.neutral.400}' },
  },
}
```

---

#### Textareaの追加仕様

```typescript
export const textarea = css({
  // inputと同じ基本スタイル
  w: 'full',
  px: '3',
  py: '2',
  border: 'none',
  borderRadius: 'md',
  fontSize: 'sm',
  outline: 'none',
  bg: 'input.default',
  shadow: 'input.default',
  color: 'text.primary',
  transition: 'all 0.2s ease',
  
  // Textarea固有
  resize: 'vertical',        // 縦方向のみリサイズ可
  minH: '100px',             // 最小高さ確保
  lineHeight: '1.6',         // 読みやすい行間
  
  _hover: {
    bg: 'input.hover',
    shadow: 'input.hover',
  },
  _focusVisible: {
    bg: 'input.focus',
    shadow: 'input.focus',
  },
  _placeholder: {
    color: 'text.subtle',
    opacity: 0.6,
  },
  _disabled: {
    bg: 'input.disabled',
    color: 'text.disabled',
    shadow: 'none',
    cursor: 'not-allowed',
    opacity: 0.6,
  },
});
```

---

#### ビジュアル比較

**❌ 旧スタイル（トーン不一致）**:
```
┌─────────────────────────┐  ← 1px solid border
│ テキスト                 │     硬い印象
└─────────────────────────┘
```

**✅ 新スタイル（ボーダーレス）**:
```
┌─────────────────────────┐
│ テキスト                 │  ← 柔らかい影で輪郭
└─────────────────────────┘     ソフトな印象
    ↑ 影 + 淡い背景
```

---

### 2.2 Select（ボーダーレス版）

（Ark UIのSelectコンポーネントを使用するため、カスタムスタイルは最小限）

#### トリガーボタン

```typescript
export const selectTrigger = css({
  w: 'full',
  px: '3',
  py: '2',
  border: 'none',              // ✅ ボーダーレス
  borderRadius: 'md',
  fontSize: 'sm',
  
  bg: 'input.default',         // Inputと同じ背景
  shadow: 'input.default',     // Inputと同じ影
  
  cursor: 'pointer',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: '2',
  transition: 'all 0.2s ease',
  
  _hover: {
    bg: 'input.hover',
    shadow: 'input.hover',
  },
  _focusVisible: {
    bg: 'input.focus',
    shadow: 'input.focus',
  },
});
```

---

#### ドロップダウン

```typescript
export const selectContent = css({
  bg: 'bg.card',               // カードと同じ背景
  borderRadius: 'md',
  shadow: 'dropdown.default',  // ✅ セマンティックトークン（後で追加）
  border: 'none',              // ✅ ボーダーレス
  py: '1',                     // 上下4px
  minW: '200px',
  maxH: '300px',
  overflow: 'auto',
  backdropFilter: 'blur(8px)', // 背景ぼかし（オプション）
});

export const selectItem = css({
  px: '3',
  py: '2',
  fontSize: 'sm',
  cursor: 'pointer',
  borderRadius: 'sm',          // 項目にも角丸
  mx: '1',                     // 左右に少し余白
  transition: 'all 0.15s ease',
  
  _hover: {
    bg: 'chip.hover',          // Chipと同じホバー色
    transform: 'translateX(2px)', // 微小な動き
  },
  _selected: {
    bg: 'primary.subtle',
    color: 'primary.foreground.dark',
    fontWeight: 'medium',
  },
});
```

**新規セマンティックトークン**:
```typescript
shadows: {
  dropdown: {
    default: { value: '0 8px 24px rgba(0, 0, 0, 0.12), 0 2px 6px rgba(0, 0, 0, 0.08)' },
    // ドロップダウンは浮遊感を出すため、カードより強い影
  },
}
```

---

### 2.3 Checkbox / Radio（ソフトスタイル版）

#### 設計思想

Checkbox/Radioは小さい要素なので、**完全にborderをなくすと視認性が下がる**。  
そこで：
- ✅ **影を追加してソフトな印象に**
- ✅ **borderは残すが、色を淡く**
- ✅ **未選択時は控えめ、選択時は鮮やかに**

---

#### Checkbox基本スタイル

```typescript
export const checkbox = css({
  w: '4',                     // 16px（8ptグリッド）
  h: '4',
  borderRadius: 'sm',         // 角丸
  border: '1.5px solid',      // 細めのborder
  borderColor: 'checkbox.border.default', // ✅ セマンティックトークン
  bg: 'checkbox.bg.default',
  shadow: 'checkbox.default', // ✅ 影でソフトに
  cursor: 'pointer',
  transition: 'all 0.2s ease',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  
  _hover: {
    borderColor: 'checkbox.border.hover',
    shadow: 'checkbox.hover',
    transform: 'scale(1.05)', // 微小な拡大
  },
  
  _checked: {
    bg: 'primary.default',
    borderColor: 'primary.default',
    shadow: 'checkbox.checked',
  },
  
  _focusVisible: {
    outline: '2px solid',
    outlineColor: 'primary.default',
    outlineOffset: '2px',
  },
});
```

**新規セマンティックトークン**:
```typescript
colors: {
  checkbox: {
    border: {
      default: { value: '{colors.neutral.300}' },  // 淡いグレー
      hover: { value: '{colors.neutral.400}' },
    },
    bg: {
      default: { value: '{colors.white}' },
    },
  },
},
shadows: {
  checkbox: {
    default: { value: '0 1px 2px rgba(0, 0, 0, 0.05)' },       // 極小の影
    hover: { value: '0 2px 4px rgba(0, 0, 0, 0.08)' },         // ホバーで少し強調
    checked: { value: '0 2px 6px rgba(var(--primary-rgb), 0.3)' }, // 選択時は色付き影
  },
}
```

---

#### チェックマーク（✓）の表現

Ark UIを使う場合は内蔵、カスタムする場合：

```typescript
export const checkboxIndicator = css({
  w: '3',                     // 12px
  h: '3',
  color: 'white',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  fontSize: 'xs',
  fontWeight: 'bold',
});
```

---

#### Radio基本スタイル

```typescript
export const radio = css({
  w: '4',                     // 16px
  h: '4',
  borderRadius: 'full',       // 円形
  border: '1.5px solid',      // 細めのborder
  borderColor: 'checkbox.border.default',
  bg: 'checkbox.bg.default',
  shadow: 'checkbox.default', // 影でソフトに
  cursor: 'pointer',
  transition: 'all 0.2s ease',
  position: 'relative',
  
  _hover: {
    borderColor: 'checkbox.border.hover',
    shadow: 'checkbox.hover',
    transform: 'scale(1.05)',
  },
  
  _checked: {
    borderColor: 'primary.default',
    shadow: 'checkbox.checked',
    _after: {
      content: '""',
      position: 'absolute',
      top: '50%',
      left: '50%',
      transform: 'translate(-50%, -50%)',
      w: '2',                 // 8px（中央のドット）
      h: '2',
      borderRadius: 'full',
      bg: 'primary.default',
      shadow: 'inset 0 1px 2px rgba(0, 0, 0, 0.2)', // ドットに奥行き
    },
  },
  
  _focusVisible: {
    outline: '2px solid',
    outlineColor: 'primary.default',
    outlineOffset: '2px',
  },
});
```

---

#### ラベルとの組み合わせ

```typescript
export const checkboxLabel = css({
  display: 'flex',
  alignItems: 'center',
  gap: '2',                   // 8px（8ptグリッド）
  cursor: 'pointer',
  fontSize: 'sm',
  color: 'text.primary',
  transition: 'color 0.15s',
  
  _hover: {
    color: 'text.emphasized',
    '& [data-scope="checkbox"]': {  // チェックボックスもホバー
      borderColor: 'checkbox.border.hover',
      shadow: 'checkbox.hover',
    },
  },
});
```

---

### フォーム要素の共通ルール（ボーダーレス準拠）

| ルール | 詳細 |
|--------|------|
| **基本padding** | `px: '3', py: '2'`（12px × 8px、8ptグリッド） |
| **ボーダー** | `border: 'none'`（Input/Select - 影で十分視認可能）<br>`border: '1.5px solid'`（Checkbox/Radio - 小さいため視認性確保） |
| **影** | ✅ 必ず使用（`shadow: 'input.default'`等） |
| **背景** | ✅ セマンティックトークン（`bg: 'input.default'`） |
| **フォーカスリング** | `outline: '2px solid', outlineColor: 'primary.focusRing', outlineOffset: '2px'`（ブラウザ標準を使用、box-shadow禁止） |
| **トランジション** | `transition: 'all 0.2s ease'`（統一） |
| **border-radius** | `md`（Input/Select）、`sm`（Checkbox）、`full`（Radio） |
| **disabled背景** | `bg: 'input.disabled'` + `shadow: 'none'` |
| **disabled文字色** | `color: 'text.disabled'` + `opacity: 0.6` |
| **placeholderの色** | `color: 'text.subtle'` + `opacity: 0.6` |

---

### エラー状態（ボーダーレス版）

#### Input/Textareaのエラー

```typescript
_invalid: {
  bg: 'input.error',           // ✅ 淡い赤背景
  shadow: 'input.error',       // ✅ 赤い影
  // borderは使わない
  
  _focusVisible: {
    shadow: 'input.errorFocus', // フォーカス時も赤い影
  },
}
```

**新規セマンティックトークン**:
```typescript
colors: {
  input: {
    error: { value: '{colors.danger.50}' },  // 淡い赤背景
  },
},
shadows: {
  input: {
    error: { value: '0 0 0 2px {colors.danger.200}' },      // 赤い影
    errorFocus: { value: '0 0 0 3px {colors.danger.300}' }, // フォーカス時
  },
}
```

---

#### エラーメッセージ

```typescript
export const errorMessage = css({
  display: 'flex',
  alignItems: 'center',
  gap: '1',                    // 4px
  fontSize: 'xs',
  color: 'danger.foreground.dark',
  mt: '1',                     // 4px
  px: '1',                     // 左に少し余白
});

// アイコン付き
export const errorMessageWithIcon = css({
  display: 'flex',
  alignItems: 'flex-start',
  gap: '1',
  fontSize: 'xs',
  color: 'danger.foreground.dark',
  mt: '1',
  px: '1',
  
  '& svg': {
    flexShrink: 0,
    w: '3',                    // 12px（アイコンサイズ）
    h: '3',
    mt: '0.5',                 // テキストと揃える
  },
});
```

---

#### Success状態（オプション）

```typescript
_valid: {
  bg: 'input.success',
  shadow: 'input.success',
}
```

**新規セマンティックトークン**:
```typescript
colors: {
  input: {
    success: { value: '{colors.success.50}' },
  },
},
shadows: {
  input: {
    success: { value: '0 0 0 2px {colors.success.200}' },
  },
}
```

---

### 必要なセマンティックトークン一覧（まとめ）

#### `src/styles/semanticTokens.ts`に追加

```typescript
// 色
colors: {
  input: {
    default: { value: '{colors.neutral.50}' },
    hover: { value: '{colors.neutral.100}' },
    focus: { value: '{colors.white}' },
    disabled: { value: '{colors.neutral.100}' },
    error: { value: '{colors.danger.50}' },
    success: { value: '{colors.success.50}' },
  },
  text: {
    disabled: { value: '{colors.neutral.400}' },
    subtle: { value: '{colors.neutral.500}' },
  },
  checkbox: {
    border: {
      default: { value: '{colors.neutral.300}' },
      hover: { value: '{colors.neutral.400}' },
    },
    bg: {
      default: { value: '{colors.white}' },
    },
  },
},

// 影
shadows: {
  input: {
    default: { value: '0 1px 3px rgba(0, 0, 0, 0.06)' },
    hover: { value: '0 2px 4px rgba(0, 0, 0, 0.08)' },
    // focus: outlineを使用（box-shadowでの再現は禁止）
    error: { value: '0 0 0 2px {colors.danger.200}' },
    success: { value: '0 0 0 2px {colors.success.200}' },
  },
  checkbox: {
    default: { value: '0 1px 2px rgba(0, 0, 0, 0.05)' },
    hover: { value: '0 2px 4px rgba(0, 0, 0, 0.08)' },
    checked: { value: '0 2px 6px rgba(var(--primary-rgb), 0.3)' },
  },
  dropdown: {
    default: { value: '0 8px 24px rgba(0, 0, 0, 0.12), 0 2px 6px rgba(0, 0, 0, 0.08)' },
  },
}
```

---

### フォーム要素の実装チェックリスト

新しいフォーム要素を作成する際の確認項目：

#### 必須（トーン＆視認性）
- [ ] 大きめ要素（Input等）は影＋背景で輪郭を表現しているか？
- [ ] 小さい要素（Checkbox等）は必要に応じてborderを使用しているか？
- [ ] `shadow: 'input.default'`等のセマンティックトークンを使っているか？
- [ ] `bg: 'input.default'`等のセマンティックトークンを使っているか？
- [ ] `transition: 'all 0.2s ease'`を設定しているか？

#### 状態
- [ ] ホバー時の`bg`と`shadow`変化があるか？
- [ ] フォーカス時の`shadow: 'input.focus'`があるか？
- [ ] Disabled時に`shadow: 'none'` + `opacity: 0.6`があるか？
- [ ] エラー時（任意）に`shadow: 'input.error'`があるか？

#### アクセシビリティ
- [ ] `_focusVisible`を使用しているか？（`_focus`ではなく）
- [ ] placeholderだけに頼らず、labelを表示しているか？
- [ ] コントラスト比はWCAG AA基準を満たしているか？

#### Apple流
- [ ] paddingは8ptグリッド（`px: '3', py: '2'`等）か？
- [ ] 微小なインタラクション（`transform`等）があるか？

---

### ビジュアル比較（まとめ）

#### Input/Textarea（大きめ要素）

**❌ 旧スタイル（硬い）**:
```
┌─────────────────────────┐  ← 1px solid border
│ 入力テキスト             │     硬い印象、AI臭い
└─────────────────────────┘
```

**✅ 新スタイル（ソフト）**:
```
  ┌─────────────────────┐
  │ 入力テキスト         │  ← 柔らかい影 + 淡い背景
  └─────────────────────┘     ソフト、レイヤード
 ↑ 影で輪郭を表現（borderなし）
```

#### Checkbox/Radio（小さい要素）

**❌ 旧スタイル（影なし）**:
```
☐  ← 2px solid border、影なし、硬い
```

**✅ 新スタイル（border + 影）**:
```
☐  ← 1.5px border + 影、ホバーで拡大
 ↑ 両方使用してソフトに
```

**理由**: 小さい要素（16px）は影だけでは視認性が低いため、borderも併用。

---

## 3. ボタンのバリアント（Apple流改訂版）

### 既存システム

既に`src/styles/recipes/button.ts`で定義されている：

- **status**: default, primary, success, warning, danger, info
- **variant**: solid, ghost, subtle
- **size**: xs, sm, md, lg

---

### Apple流のボタン原則

| 原則 | 説明 |
|------|------|
| **明確な階層** | primary（主要）> secondary（補助）> tertiary（控えめ） |
| **適切なサイズ** | 最小タップ領域44×44px（アクセシビリティ） |
| **状態の明示** | default, hover, active, disabled, focusを明確に |
| **色の意味** | destructive（危険）は赤、affirmative（肯定）は青/緑 |

---

### バリアント別ガイドライン

#### variant: solid（最優先アクション）

**用途**: ページで最も重要な1つのアクション

```typescript
solid: {
  background: 'var(--button-color-main)',
  color: '{colors.white}',
  shadow: 'sm',                          // 追加推奨
  _hover: {
    background: 'var(--button-color-hover)',
    shadow: 'md',                        // ホバー時に影強調
    transform: 'translateY(-1px)',       // 微小な浮上
  },
}
```

**Apple流の改善点**:
- 影を追加して立体感を出す
- ホバー時に微小な動きを加える

#### variant: ghost（控えめなアクション）

**用途**: 二次的なアクション、キャンセルボタン

```typescript
ghost: {
  color: 'var(--button-color-foreground)',
  background: 'transparent',
  _hover: {
    background: 'var(--button-color-subtle)',
  },
}
```

**適切**: 既存実装で問題なし

#### variant: subtle（中間的なアクション）

**用途**: 軽く強調したいアクション

```typescript
subtle: {
  background: 'var(--button-color-subtle)',
  color: 'var(--button-color-foreground)',
  _hover: {
    background: 'var(--button-color-main)',
    color: '{colors.white}',
  },
}
```

**適切**: 既存実装で問題なし

---

### サイズ別ガイドライン（8ptグリッド対応）

#### 現在のサイズ定義（黄金比ベース）

```typescript
size: {
  xs: { h: '8', px: 'sm', gap: 'xs' },   // sm=8px, xs=5px
  sm: { h: '9', px: 'md', gap: 'xs' },   // md=13px, xs=5px
  md: { h: '10', px: 'lg', gap: 'xs' },  // lg=21px, xs=5px
  lg: { h: '11', px: 'xl', gap: '2' },   // xl=34px, gap=8px
}
```

#### Apple流サイズ定義（8ptグリッド）

| サイズ | 高さ | px（横） | gap | 実寸 | 用途 |
|--------|------|---------|-----|------|------|
| xs | `8` | `3` | `1` | 32px × 12px padding | 密集UI（テーブル内等） |
| sm | `9` | `4` | `2` | 36px × 16px padding | 標準フォーム |
| md | `10` | `5` | `2` | 40px × 20px padding | **推奨デフォルト** |
| lg | `11` | `6` | `2` | 44px × 24px padding | 主要CTA |

**変更点**:
- `px`を8ptグリッド（3, 4, 5, 6）に変更
- `gap`を8ptグリッド（1, 2）に統一
- mdサイズを40pxに（Apple推奨の最小タップ領域に近い）

**Appleのガイドライン**: タップ可能な要素は最低44×44px推奨（アクセシビリティ）

---

### status別ガイドライン

#### primary（主要アクション）

**用途**: ログイン、送信、保存など

```typescript
status: 'primary'
variant: 'solid'
```

**色**: ブランドカラー（青系）

#### danger（危険なアクション）

**用途**: 削除、キャンセル、破壊的操作

```typescript
status: 'danger'
variant: 'solid' または 'ghost'
```

**色**: 赤系  
**重要**: solidは確認ダイアログ内のみ使用。一覧画面では`ghost`で控えめに

#### success（成功・肯定）

**用途**: 承認、完了、次へ

```typescript
status: 'success'
variant: 'solid'
```

**色**: 緑系

#### warning（注意）

**用途**: 警告が必要な操作

```typescript
status: 'warning'
variant: 'subtle'
```

**色**: 黄/オレンジ系

#### default（ニュートラル）

**用途**: キャンセル、閉じる、戻る

```typescript
status: 'default'
variant: 'ghost' または 'subtle'
```

**色**: グレー系

---

### 組み合わせパターン（Apple流）

| シーン | 組み合わせ | 例 |
|--------|-----------|-----|
| **フォーム送信** | primary + solid (md) | ログインボタン |
| **フォームキャンセル** | default + ghost (md) | キャンセルボタン |
| **削除確認ダイアログ** | danger + solid (md) + default + ghost (md) | [削除] [キャンセル] |
| **一覧の削除ボタン** | danger + ghost (sm) | アイテム横の小さな削除 |
| **主要CTA** | primary + solid (lg) | ヒーローセクションのボタン |
| **リストアクション** | default + ghost (sm) | 編集、詳細等 |

---

### ボタン配置のApple流原則

#### 横並びボタン

```
[キャンセル（ghost）]  [送信（primary solid）]
```

- 破壊的でないアクション（キャンセル）を左
- 主要アクション（送信）を右

#### 縦並びボタン

```
[送信（primary solid）]
[キャンセル（ghost）]
```

- 主要アクションを上
- 副次的アクションを下

#### 間隔

- ボタン間: `gap: '3'` (12px) または `gap: '4'` (16px)
- セクションとの分離: `mt: '6'` (24px) または `mt: '8'` (32px)

---

### 実装時のチェックリスト

- [ ] statusとvariantの組み合わせは適切か？
- [ ] sizeは8ptグリッドに準拠しているか？
- [ ] 最小タップ領域（40px以上）を確保しているか？
- [ ] フォーカス状態は視覚的に明確か？
- [ ] disabled状態は操作不可を明示しているか？
- [ ] ページ内で最優先アクションは1つだけか？（複数のsolid primaryは避ける）

---

### 禁止パターン

| 禁止 | 理由 | 代替案 |
|------|------|--------|
| 複数のprimary solid | 優先度が不明確 | 1つだけprimary、他はghost |
| 小さすぎるボタン（32px未満） | タップしづらい | 最低xsサイズ（32px）を使用 |
| dangerをsolid多用 | 攻撃的 | 確認ダイアログ以外はghost |
| 不要なborder多用 | 視覚的ノイズ増加 | 影とbackgroundで表現できる場合はそちらを優先 |

---

## 4. エラー・空状態・ローディング表示

### 設計原則

**ユーザーの不安を和らげる**:
- エラーは明確だが攻撃的でない
- 空状態は次のアクションを促す
- ローディングは進行中であることを示す

**Apple流の配慮**:
- 親切なメッセージ（「何が起きたか」＋「何をすべきか」）
- アイコンで視覚的に理解を助ける
- ブランドトーンを維持（ソフト/パステル）

---

### 4.1 エラー表示

#### パターンA：インラインエラー（フォーム内）

**用途**: フォームバリデーションエラー、個別フィールドのエラー

```typescript
export const inlineError = css({
  display: 'flex',
  alignItems: 'flex-start',
  gap: '1',                     // 4px
  px: '3',                      // 12px
  py: '2',                      // 8px
  bg: 'danger.50',              // 淡い赤背景
  borderRadius: 'md',
  fontSize: 'sm',
  color: 'danger.foreground.dark',
  
  '& svg': {
    flexShrink: 0,
    w: '4',                     // 16px（アイコン）
    h: '4',
    mt: '0.5',                  // テキストと揃える
  },
});
```

**使用例**:
```tsx
<div className={inlineError}>
  <AlertCircle />
  <span>パスワードは8文字以上で入力してください</span>
</div>
```

---

#### パターンB：ページレベルエラー（通信エラー等）

**用途**: API通信エラー、権限エラー、404等

```typescript
export const pageError = css({
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  gap: '4',                     // 16px
  py: '12',                     // 48px
  px: '6',                      // 24px
  textAlign: 'center',
  minH: '400px',                // 十分な高さ確保
});

export const pageError_icon = css({
  w: '16',                      // 64px（大きめアイコン）
  h: '16',
  color: 'danger.default',
  opacity: 0.8,
});

export const pageError_title = css({
  fontSize: 'xl',
  fontWeight: 'semibold',
  color: 'text.primary',
});

export const pageError_message = css({
  fontSize: 'sm',
  color: 'text.secondary',
  maxW: '600px',                // 読みやすい幅に制限
  lineHeight: '1.6',
});

export const pageError_actions = css({
  display: 'flex',
  gap: '3',                     // 12px
  mt: '2',                      // 8px（タイトル/メッセージと距離）
});
```

**使用例**:
```tsx
<div className={pageError}>
  <AlertTriangle className={pageError_icon} />
  <h2 className={pageError_title}>データの読み込みに失敗しました</h2>
  <p className={pageError_message}>
    ネットワーク接続を確認して、もう一度お試しください。
  </p>
  <div className={pageError_actions}>
    <Button variant="ghost" onClick={handleBack}>戻る</Button>
    <Button variant="solid" status="primary" onClick={handleRetry}>再試行</Button>
  </div>
</div>
```

---

### 4.2 空状態（Empty State）

#### パターンA：検索0件

**用途**: シナリオ検索、セッション検索で結果0件

```typescript
export const emptyState = css({
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  gap: '4',                     // 16px
  py: '12',                     // 48px
  px: '6',                      // 24px
  textAlign: 'center',
  minH: '400px',
});

export const emptyState_icon = css({
  w: '16',                      // 64px
  h: '16',
  color: 'neutral.400',         // グレー系（エラーより控えめ）
  opacity: 0.6,
});

export const emptyState_title = css({
  fontSize: 'lg',
  fontWeight: 'semibold',
  color: 'text.primary',
});

export const emptyState_message = css({
  fontSize: 'sm',
  color: 'text.secondary',
  maxW: '600px',
  lineHeight: '1.6',
});

export const emptyState_actions = css({
  display: 'flex',
  gap: '3',
  mt: '2',
});
```

**使用例**:
```tsx
<div className={emptyState}>
  <Search className={emptyState_icon} />
  <h2 className={emptyState_title}>条件に一致する結果が見つかりませんでした</h2>
  <p className={emptyState_message}>
    検索条件を変更するか、新しいシナリオを登録してみませんか？
  </p>
  <div className={emptyState_actions}>
    <Button variant="ghost" onClick={handleReset}>条件をリセット</Button>
    <Button variant="solid" status="primary" onClick={handleCreate}>シナリオを登録</Button>
  </div>
</div>
```

---

#### パターンB：初期状態（データなし）

**用途**: 参加セッション0件、お気に入り0件等

```typescript
// スタイルはemptyStateと同じだが、メッセージトーンが異なる
```

**使用例**:
```tsx
<div className={emptyState}>
  <Calendar className={emptyState_icon} />
  <h2 className={emptyState_title}>参加予定のセッションはありません</h2>
  <p className={emptyState_message}>
    公開卓を探してセッションに参加してみましょう！
  </p>
  <div className={emptyState_actions}>
    <Button variant="solid" status="primary" onClick={handleSearch}>公開卓を探す</Button>
  </div>
</div>
```

---

### 4.3 ローディング表示

#### パターンA：インラインローディング（ボタン内）

**用途**: ボタンクリック後のローディング

```typescript
// 既存のSpinnerコンポーネントを使用
// Button コンポーネントは loading prop で対応済み
<Button loading loadingText="送信中...">
  送信
</Button>
```

---

#### パターンB：ページローディング（全画面）

**用途**: ページ遷移時、大きなデータ取得時

```typescript
export const pageLoading = css({
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  gap: '4',
  minH: '400px',
  py: '12',
});

export const pageLoading_spinner = css({
  w: '12',                      // 48px（大きめ）
  h: '12',
  color: 'primary.default',
  animation: 'spin 1s linear infinite',
});

export const pageLoading_text = css({
  fontSize: 'sm',
  color: 'text.secondary',
});
```

**使用例**:
```tsx
<div className={pageLoading}>
  <Spinner className={pageLoading_spinner} />
  <p className={pageLoading_text}>読み込み中...</p>
</div>
```

---

#### パターンC：スケルトンスクリーン

**用途**: カード一覧等、構造が分かる場合

```typescript
export const skeleton = css({
  bg: 'linear-gradient(90deg, {colors.neutral.100} 25%, {colors.neutral.200} 50%, {colors.neutral.100} 75%)',
  backgroundSize: '200% 100%',
  animation: 'shimmer 1.5s infinite',
  borderRadius: 'md',
});

export const skeletonCard = css({
  bg: 'bg.card',
  borderRadius: 'xl',
  shadow: 'card.default',
  p: '6',
  display: 'flex',
  flexDirection: 'column',
  gap: '4',
});

export const skeletonLine = css({
  h: '4',                       // 16px
  bg: 'linear-gradient(90deg, {colors.neutral.100} 25%, {colors.neutral.200} 50%, {colors.neutral.100} 75%)',
  backgroundSize: '200% 100%',
  animation: 'shimmer 1.5s infinite',
  borderRadius: 'sm',
});
```

**keyframe追加（`preset.ts`）**:
```typescript
keyframes: {
  shimmer: {
    '0%': { backgroundPosition: '200% 0' },
    '100%': { backgroundPosition: '-200% 0' },
  },
}
```

**使用例**:
```tsx
<div className={skeletonCard}>
  <div className={skeleton} style={{ width: '100%', height: '120px' }} />
  <div className={skeletonLine} style={{ width: '60%' }} />
  <div className={skeletonLine} style={{ width: '80%' }} />
  <div className={skeletonLine} style={{ width: '40%' }} />
</div>
```

---

### 4.4 トースト通知（オプション）

**用途**: 保存成功、削除完了等の一時的な通知

```typescript
export const toast = css({
  display: 'flex',
  alignItems: 'center',
  gap: '3',
  px: '4',
  py: '3',
  bg: 'bg.card',
  borderRadius: 'lg',
  shadow: 'dropdown.default',   // 強めの影で浮遊感
  backdropFilter: 'blur(8px)',
  minW: '300px',
  maxW: '500px',
  
  '& svg': {
    flexShrink: 0,
    w: '5',
    h: '5',
  },
});

export const toast_success = css({
  borderLeft: '3px solid',
  borderColor: 'success.default',
});

export const toast_error = css({
  borderLeft: '3px solid',
  borderColor: 'danger.default',
});

export const toast_info = css({
  borderLeft: '3px solid',
  borderColor: 'info.default',
});
```

**使用例**:
```tsx
<div className={css(toast, toast_success)}>
  <CheckCircle color="var(--colors-success-default)" />
  <span>シナリオを保存しました</span>
</div>
```

---

### 4.5 メッセージトーンガイドライン

| 状態 | トーン | 例 |
|------|--------|-----|
| **エラー** | 明確 + 親切 | 「データの読み込みに失敗しました。ネットワーク接続を確認してください。」 |
| **空状態（0件）** | 前向き | 「条件に一致する結果が見つかりませんでした。検索条件を変更してみませんか？」 |
| **空状態（初期）** | 招待的 | 「参加予定のセッションはありません。公開卓を探してみましょう！」 |
| **ローディング** | 簡潔 | 「読み込み中...」 |
| **成功** | 肯定的 | 「保存しました」 |

**禁止**:
- 技術的すぎる用語（「500 Internal Server Error」等）
- ユーザーを責めるトーン（「入力が間違っています」→「正しい形式で入力してください」）
- 曖昧な表現（「エラーが発生しました」のみ）

---

### 4.6 実装チェックリスト

- [ ] エラーメッセージは「何が起きたか」＋「何をすべきか」を含むか？
- [ ] アイコンは適切に選ばれているか？（AlertTriangle, Search, Calendar等）
- [ ] 空状態には次のアクションボタンがあるか？
- [ ] ローディングは進行中であることが明確か？
- [ ] 色はトーンに合っているか？（エラーも柔らかく）
- [ ] スペーシングは8ptグリッドか？

---

### 2.4 Borderを使うその他の場面

#### Table（データテーブル）

データの区切りには**細いborderが適切**。

```typescript
export const table = css({
  w: 'full',
  borderCollapse: 'collapse',
});

export const tableHeader = css({
  borderBottom: '2px solid',    // ヘッダーは少し太く
  borderColor: 'border.default',
});

export const tableRow = css({
  borderBottom: '1px solid',    // 行の区切り
  borderColor: 'border.subtle',
  transition: 'background 0.15s',
  
  _hover: {
    bg: 'bg.subtle',
  },
});

export const tableCell = css({
  px: '4',
  py: '3',
});
```

---

#### Tab（タブナビゲーション）

選択状態を明確に示すには**下線が効果的**。

```typescript
export const tab = css({
  px: '4',
  py: '2',
  fontSize: 'sm',
  fontWeight: 'medium',
  color: 'text.secondary',
  borderBottom: '2px solid',
  borderColor: 'transparent',
  transition: 'all 0.2s ease',
  cursor: 'pointer',
  
  _hover: {
    color: 'text.primary',
    borderColor: 'border.subtle',
  },
  
  _selected: {
    color: 'primary.default',
    borderColor: 'primary.default',
  },
});
```

---

#### 区切り線（hr要素）

セマンティックHTMLとして`<hr>`は**borderを使用**。

```typescript
export const divider = css({
  border: 'none',
  borderTop: '1px solid',       // ✅ hrにはborder使用OK
  borderColor: 'border.subtle',
  my: '4',
});
```

---

### 2.5 Border使用のガイドライン

| 要素 | Border | Shadow | 理由 |
|------|--------|--------|------|
| **Input/Select** | ❌ | ✅ | 十分な大きさがあり、影で視認可能 |
| **Checkbox/Radio** | ✅ (1.5px) | ✅ | 小さいため両方使用 |
| **Card/Panel** | ❌ | ✅ | 影のみで十分立体的 |
| **Table** | ✅ (1px) | ❌ | データ区切りの明確化 |
| **Tab** | ✅ (2px下線) | ❌ | 選択状態の明示 |
| **hr要素** | ✅ (1px) | ❌ | セマンティックHTML |
| **Avatar** | ✅ (2-3px) | ❌ | 画像の輪郭明確化 |

**原則**: 視認性 > デザイントーン。迷ったら視認性を優先。

---

## 5. カード内部構造（header, body, footer）

### 設計原則

**カードは情報の「コンテナ」**:
- 関連する情報を1つの「面」にまとめる
- 階層（header > body > footer）を余白で表現
- 影で他の要素から浮かせる

**Apple流の余白**:
- カード全体padding: `6` (24px) または `8` (32px)
- header↔︎body間: `4` (16px)
- body↔︎footer間: `4`-`6` (16-24px)
- body内要素間: `3`-`4` (12-16px)

---

### 5.1 基本カード構造

```typescript
export const card = css({
  bg: 'bg.card',
  borderRadius: 'xl',          // 大きめの角丸
  shadow: 'card.default',
  transition: 'all 0.3s ease',
  overflow: 'hidden',          // 角丸を子要素に適用
  
  _hover: {
    shadow: 'card.hover',
    transform: 'translateY(-2px)', // 微小な浮上
  },
});
```

---

### 5.2 Header（カード上部）

**用途**: タイトル、アイコン、補助情報、アクションボタン

```typescript
export const card_header = css({
  p: '6',                      // 24px padding
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: '3',                    // 12px
});

export const card_headerTitle = css({
  fontSize: 'lg',
  fontWeight: 'semibold',
  color: 'text.primary',
  display: 'flex',
  alignItems: 'center',
  gap: '2',                    // アイコンとの間隔8px
});

export const card_headerActions = css({
  display: 'flex',
  gap: '2',                    // ボタン間8px
  alignItems: 'center',
});
```

**使用例**:
```tsx
<div className={card}>
  <div className={card_header}>
    <h3 className={card_headerTitle}>
      <Star size={20} />
      シナリオ名
    </h3>
    <div className={card_headerActions}>
      <Button variant="ghost" size="sm">編集</Button>
      <Button variant="ghost" size="sm">削除</Button>
    </div>
  </div>
</div>
```

---

### 5.3 Body（カード本体）

**用途**: メインコンテンツ

```typescript
export const card_body = css({
  px: '6',                     // 左右24px（headerと揃える）
  pb: '6',                     // 下24px
  display: 'flex',
  flexDirection: 'column',
  gap: '4',                    // 要素間16px
});

export const card_bodySection = css({
  display: 'flex',
  flexDirection: 'column',
  gap: '2',                    // セクション内要素8px
});
```

**使用例**:
```tsx
<div className={card}>
  <div className={card_header}>...</div>
  <div className={card_body}>
    <div className={card_bodySection}>
      <span>システム: CoC7版</span>
      <span>プレイ人数: 3-5人</span>
    </div>
    <div className={card_bodySection}>
      <p>シナリオの説明文...</p>
    </div>
  </div>
</div>
```

---

### 5.4 Footer（カード下部）

**用途**: メタ情報、アクションボタン、タグ

```typescript
export const card_footer = css({
  px: '6',
  pb: '6',
  pt: '4',                     // 上は少し狭く（bodyとの分離）
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  gap: '3',
});

export const card_footerMeta = css({
  display: 'flex',
  gap: '4',
  fontSize: 'xs',
  color: 'text.secondary',
});

export const card_footerActions = css({
  display: 'flex',
  gap: '2',
});
```

**使用例**:
```tsx
<div className={card}>
  <div className={card_header}>...</div>
  <div className={card_body}>...</div>
  <div className={card_footer}>
    <div className={card_footerMeta}>
      <span>投稿: 2026/01/15</span>
      <span>★4.5</span>
    </div>
    <div className={card_footerActions}>
      <Button variant="solid" status="primary" size="sm">詳細</Button>
    </div>
  </div>
</div>
```

---

### 5.5 区切り線（Divider）

**カード内でセクションを明確に分けたい場合**

```typescript
export const card_divider = css({
  border: 'none',
  h: '1px',
  bg: 'border.subtle',
  mx: '6',                     // 左右にカードpaddingと同じ余白
  my: '4',                     // 上下16px
});
```

**使用例**:
```tsx
<div className={card}>
  <div className={card_header}>...</div>
  <hr className={card_divider} />
  <div className={card_body}>...</div>
</div>
```

---

### 5.6 カードのバリエーション

#### 小サイズカード（リストアイテム等）

```typescript
export const cardCompact = css({
  bg: 'bg.card',
  borderRadius: 'lg',          // 少し小さめの角丸
  shadow: 'card.default',
  p: '4',                      // 全体padding: 16px
  display: 'flex',
  alignItems: 'center',
  gap: '3',                    // 12px
  transition: 'all 0.2s ease',
  
  _hover: {
    shadow: 'card.hover',
    transform: 'translateY(-1px)',
  },
});
```

#### インタラクティブカード（クリック可能）

```typescript
export const cardInteractive = css({
  bg: 'bg.card',
  borderRadius: 'xl',
  shadow: 'card.default',
  p: '6',
  cursor: 'pointer',
  transition: 'all 0.3s ease',
  
  _hover: {
    shadow: 'card.hover',
    transform: 'translateY(-2px)',
    bg: 'bg.subtle',           // ホバー時に少し背景変化
  },
  
  _active: {
    transform: 'translateY(0)', // クリック時に元に戻る
    shadow: 'card.default',
  },
});
```

---

### 5.7 余白のパターン一覧

| 場所 | トークン | 実寸 | 用途 |
|------|---------|------|------|
| **カード全体padding** | `6` | 24px | 標準カード |
| **カード全体padding（大）** | `8` | 32px | 重要なカード |
| **ヘッダー内要素間** | `3` | 12px | タイトル↔︎アクション |
| **ヘッダー↔︎ボディ** | なし（headerのpbで調整） | - | 自然な分離 |
| **ボディ内要素間** | `4` | 16px | セクション間 |
| **ボディ内セクション内** | `2` | 8px | 関連情報 |
| **ボディ↔︎フッター** | `pt: '4'`（footer） | 16px | 分離 |
| **フッター内要素間** | `3`-`4` | 12-16px | メタ情報間 |
| **区切り線の上下** | `my: '4'` | 16px | セクション分離 |

---

### 5.8 実装チェックリスト

- [ ] カード全体paddingは`6`または`8`か？
- [ ] header, body, footerは適切に分離されているか？
- [ ] 影は`shadow: 'card.default'`を使用しているか？
- [ ] ホバー時に`translateY(-2px)`があるか？
- [ ] 区切り線は`<hr>`要素を使用しているか？
- [ ] スペーシングは8ptグリッドか？

---

## 6. リスト・グリッドレイアウトパターン

### 設計原則

**構造を明確に**:
- グリッドは均等、リストは縦並び
- 要素間の余白で関連性を示す
- レスポンシブ対応（モバイル→デスクトップ）

**Apple流の余白**:
- リストアイテム間: `3`-`4` (12-16px)
- グリッドのgap: `4`-`6` (16-24px)
- セクション間: `8` (32px)

---

### 6.1 縦並びリスト

**用途**: セッション一覧、レビュー一覧等

```typescript
export const verticalList = css({
  display: 'flex',
  flexDirection: 'column',
  gap: '4',                    // 16px
});

export const verticalListItem = css({
  // カード等の既存コンポーネントを使用
});
```

**使用例**:
```tsx
<div className={verticalList}>
  <div className={card}>...</div>
  <div className={card}>...</div>
  <div className={card}>...</div>
</div>
```

---

### 6.2 グリッドレイアウト

**用途**: シナリオカード一覧、画像ギャラリー等

```typescript
export const grid = css({
  display: 'grid',
  gridTemplateColumns: {
    base: '1fr',               // モバイル: 1列
    sm: 'repeat(2, 1fr)',      // タブレット: 2列
    md: 'repeat(3, 1fr)',      // デスクトップ: 3列
    lg: 'repeat(4, 1fr)',      // ワイド: 4列
  },
  gap: '6',                    // 24px
});

export const gridCompact = css({
  display: 'grid',
  gridTemplateColumns: {
    base: '1fr',
    sm: 'repeat(2, 1fr)',
    md: 'repeat(3, 1fr)',
  },
  gap: '4',                    // 16px（密集レイアウト）
});
```

**使用例**:
```tsx
<div className={grid}>
  <div className={card}>シナリオ1</div>
  <div className={card}>シナリオ2</div>
  <div className={card}>シナリオ3</div>
</div>
```

---

### 6.3 水平スクロールリスト

**用途**: タグ選択、カルーセル等

```typescript
export const horizontalScroll = css({
  display: 'flex',
  gap: '3',                    // 12px
  overflowX: 'auto',
  pb: '2',                     // スクロールバー分の余白
  scrollbarWidth: 'thin',      // Firefox用
  
  '&::-webkit-scrollbar': {
    h: '6px',
  },
  '&::-webkit-scrollbar-thumb': {
    bg: 'neutral.300',
    borderRadius: 'full',
  },
});
```

**使用例**:
```tsx
<div className={horizontalScroll}>
  <Chip>タグ1</Chip>
  <Chip>タグ2</Chip>
  <Chip>タグ3</Chip>
</div>
```

---

### 6.4 マルチカラムレイアウト（2列等）

**用途**: フォーム、設定画面等

```typescript
export const twoColumn = css({
  display: 'grid',
  gridTemplateColumns: {
    base: '1fr',               // モバイル: 1列
    md: 'repeat(2, 1fr)',      // デスクトップ: 2列
  },
  gap: '6',                    // 24px
});

export const threeColumn = css({
  display: 'grid',
  gridTemplateColumns: {
    base: '1fr',
    md: 'repeat(2, 1fr)',
    lg: 'repeat(3, 1fr)',
  },
  gap: '6',
});
```

---

### 6.5 フレックスラップレイアウト（可変幅）

**用途**: タグ一覧、チップ一覧等

```typescript
export const flexWrap = css({
  display: 'flex',
  flexWrap: 'wrap',
  gap: '2',                    // 8px（密集）
});

export const flexWrapSpaced = css({
  display: 'flex',
  flexWrap: 'wrap',
  gap: '3',                    // 12px
});
```

---

### 6.6 スタックレイアウト（縦積み）

**用途**: フォーム要素、セクション縦並び等

```typescript
export const stack = css({
  display: 'flex',
  flexDirection: 'column',
  gap: '6',                    // 24px（セクション間）
});

export const stackCompact = css({
  display: 'flex',
  flexDirection: 'column',
  gap: '4',                    // 16px（要素間）
});

export const stackTight = css({
  display: 'flex',
  flexDirection: 'column',
  gap: '2',                    // 8px（関連要素）
});
```

---

### 6.7 レスポンシブブレイクポイント

PandaCSSのデフォルトブレイクポイントを使用：

| トークン | サイズ | 説明 |
|---------|--------|------|
| `base` | 0px~ | モバイル |
| `sm` | 640px~ | タブレット縦 |
| `md` | 768px~ | タブレット横 |
| `lg` | 1024px~ | デスクトップ |
| `xl` | 1280px~ | ワイドスクリーン |

---

### 6.8 ギャップサイズの使い分け

| 用途 | gap | 実寸 | 理由 |
|------|-----|------|------|
| **関連性が高い** | `2` | 8px | タグ、チップ、小要素 |
| **標準的な間隔** | `3`-`4` | 12-16px | リストアイテム、フォーム要素 |
| **セクション間** | `6` | 24px | カードグリッド、セクション |
| **大きなセクション間** | `8` | 32px | ページ内の主要ブロック |

---

### 6.9 実装チェックリスト

- [ ] レスポンシブブレイクポイントを設定しているか？
- [ ] gapは8ptグリッドか？
- [ ] モバイルファーストで設計しているか？
- [ ] スクロール可能な場合、スクロールバーのスタイルを調整しているか？
- [ ] グリッドの列数は適切か？（多すぎる/少なすぎるを避ける）

---

## 設計書完成状況

### ✅ 完了項目（最優先）

1. **スペーシングシステム** - Apple 8ptグリッド完全準拠
2. **フォーム要素** - ボーダーレス版、セマンティックトークン定義済み
3. **ボタンのバリアント** - Apple流、8ptグリッド対応、使用パターン明記

### ✅ 完了項目（次点）

4. **エラー・空状態・ローディング** - 全パターン定義、メッセージトーン明記
5. **カード内部構造** - header/body/footerの余白ルール、バリエーション
6. **リスト・グリッドレイアウト** - レスポンシブ対応、gapサイズ使い分け

---

## 次のアクション

### A. 既存メモリへの統合
この詳細化内容を`ui-design-system.md`に統合する

### B. 実装への反映
1. `src/styles/semanticTokens.ts` に新トークンを追加
2. `src/styles/tokens/spacing.ts` を8ptグリッドに変更
3. `pnpm prepare` でPandaCSS再生成
4. 既存コンポーネントを順次更新

### C. 追加の詳細化（補完項目）
- アイコンのサイズと配置ルール
- 数値・日付表示の統一フォーマット
- 各状態のスタイル（disabled, loading, error, success）

---

## 実装時の優先順位

| Phase | 対象 | 理由 |
|-------|------|------|
| Phase 1 | セマンティックトークン追加 | 全体の基盤 |
| Phase 2 | spacing.ts変更 | 8ptグリッド導入 |
| Phase 3 | 新規コンポーネント | 新スタイル適用 |
| Phase 4 | 既存コンポーネント更新 | 段階的移行 |

---

## まとめ

**設計書は完成しました。** 次は実装フェーズに移行するか、既存メモリへの統合を行います。
