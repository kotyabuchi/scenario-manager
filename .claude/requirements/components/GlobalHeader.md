# GlobalHeader コンポーネント 要件定義書

**作成日**: 2026-01-26
**TDDフェーズ**: 要件定義
**Pencilデザイン**: docs/designs/scenarios.pen > Components > GlobalHeader/*

---

## 1. 概要

### 1.1 目的
アプリケーション全体で共通して使用するヘッダーコンポーネント。
ロゴ、ナビゲーション、ユーザーメニューを含む。

### 1.2 使用場所
- 全ページ共通レイアウト
- 再利用性: 高（レイアウトコンポーネントとして1箇所で使用）

### 1.3 Ark UI / 既存コンポーネントとの関係
- ベース: 独自実装
- スタイリング: PandaCSS
- 配置: `src/components/blocks/`

---

## 2. Props設計

| Prop | 型 | デフォルト | 説明 |
|------|-----|-----------|------|
| `currentPath` | `string` | - | 現在のパス（アクティブリンク判定） |
| `user` | `User \| null` | - | ログインユーザー情報 |
| `onRegisterClick` | `() => void` | - | シナリオ登録ボタンクリック時 |

---

## 3. Pencilデザイン詳細

### 3.1 GlobalHeader/Default (meAr4)
```
コンテナ:
  fill: #FFFFFF
  height: 64px
  width: 1440px（フル幅）
  padding: 0 32px
  justifyContent: space_between
  alignItems: center
  shadow: 0 2px blur:8px #0000000D

ロゴ:
  gap: 8px
  alignItems: center

  アイコンフレーム:
    fill: #D1FAE5
    cornerRadius: 8px
    width: 32px, height: 32px

    アイコン:
      icon: book-open (lucide)
      size: 18px
      fill: #10B981

  テキスト:
    text: "シナプレ管理くん"
    fill: #10B981
    fontSize: 18px
    fontWeight: 700

ナビゲーション:
  gap: 24px

  リンク:
    layout: vertical
    gap: 4px

    テキスト（非アクティブ）:
      fill: #6B7280
      fontSize: 14px
      fontWeight: 500

    テキスト（アクティブ）:
      fill: #10B981
      fontSize: 14px
      fontWeight: 600

    アンダーライン（アクティブ）:
      fill: #10B981
      height: 2px
      cornerRadius: 1px
      width: fill_container

    アンダーライン（非アクティブ）:
      opacity: 0

ユーザーエリア:
  gap: 12px
  alignItems: center

  登録ボタン:
    Button/Primary コンポーネント
    icon: plus, 16px
    text: "シナリオを登録", 13px
    height: 36px

  アバター:
    fill: #E5E7EB
    cornerRadius: 18px（円形）
    width: 36px, height: 36px
```

---

## 4. ナビゲーション項目

| パス | ラベル |
|------|--------|
| `/` | ホーム |
| `/scenarios` | シナリオ |
| `/sessions` | セッション |
| `/schedules` | スケジュール |
| `/users` | ユーザー |

---

## 5. レスポンシブ対応

### 5.1 デスクトップ（>= 1024px）
- 全要素を水平に表示
- ナビゲーションはテキストリンク

### 5.2 タブレット（768px - 1023px）
- ロゴはアイコンのみ
- ナビゲーションはコンパクト表示

### 5.3 モバイル（< 768px）
- ハンバーガーメニュー化
- ナビゲーションはドロワー表示

---

## 6. インタラクション

### 6.1 ロゴ
- クリックでホームに遷移

### 6.2 ナビゲーションリンク
- ホバーでテキスト色変更
- アクティブ時にアンダーライン表示

### 6.3 登録ボタン
- 未ログイン時: ログインモーダル表示
- ログイン時: シナリオ登録画面に遷移

### 6.4 アバター
- クリックでユーザーメニュードロップダウン

---

## 7. アクセシビリティ

- `<header>` 要素を使用
- `<nav>` でナビゲーション領域をマーク
- `aria-current="page"` for アクティブリンク
- スキップリンク（メインコンテンツへ）

---

## 8. テスト観点

- [ ] ロゴが正しく表示される
- [ ] ナビゲーションリンクが表示される
- [ ] 現在のパスに対応するリンクがアクティブになる
- [ ] 登録ボタンが表示される（ログイン時）
- [ ] アバターが表示される（ログイン時）
- [ ] ロゴクリックでホームに遷移
- [ ] ナビゲーションリンクが正しく遷移

---

## 9. TDD対象一覧

| 対象 | 種別 | ファイルパス | 状態 |
|------|------|-------------|------|
| GlobalHeader | コンポーネント | `src/components/blocks/global-header/global-header.tsx` | 未実装 |
