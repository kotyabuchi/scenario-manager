# Toast コンポーネント 要件定義書

**作成日**: 2026-01-26
**TDDフェーズ**: 要件定義
**Pencilデザイン**: docs/designs/scenarios.pen > Components > Toast/*

---

## 1. 概要

### 1.1 目的
操作の結果（成功/エラー）を一時的に通知するトーストコンポーネント。
ユーザーアクションのフィードバックに使用する。

### 1.2 使用場所
- フォーム送信成功/失敗
- データ保存完了
- エラー通知
- 再利用性: 高

### 1.3 Ark UI / 既存コンポーネントとの関係
- ベース: Ark UI Toast（または独自実装）
- スタイリング: PandaCSS

---

## 2. Props設計

| Prop | 型 | デフォルト | 説明 |
|------|-----|-----------|------|
| `title` | `string` | - | タイトル |
| `description` | `string` | - | 詳細説明 |
| `status` | `"success" \| "error" \| "info" \| "warning"` | `"info"` | ステータス |
| `duration` | `number` | `5000` | 表示時間（ms） |
| `onClose` | `() => void` | - | 閉じた時のコールバック |

---

## 3. Pencilデザイン詳細

### 3.1 Toast/Success (WXzP0)
```
コンテナ:
  fill: #FFFFFF
  cornerRadius: 8px
  shadow: 0 4px blur:12px #00000015
  padding: 16px
  width: 320px
  gap: 12px

アイコン:
  背景: #D1FAE5（淡い緑）, 24x24, cornerRadius: 12px
  アイコン: check, 14px, #10B981

コンテンツ:
  タイトル: "Success", #1F2937, 14px, fontWeight: 500
  説明: "Your changes have been saved.", #6B7280, 13px
  gap: 2px

閉じるボタン:
  x アイコン, 16px, #9CA3AF
```

### 3.2 Toast/Error (faq3s)
```
アイコン:
  背景: #FEE2E2（淡い赤）, 24x24, cornerRadius: 12px
  アイコン: alert-triangle, 14px, #EF4444

タイトル: "Error", #1F2937, 14px, fontWeight: 500
説明: "Something went wrong.", #6B7280, 13px
```

---

## 4. インタラクション

- 自動的に指定時間後に消える
- 閉じるボタンで即座に消える
- 画面端に表示（通常は右上）

---

## 5. テスト観点

- [ ] success状態で正しく表示される
- [ ] error状態で正しく表示される
- [ ] タイトルと説明が表示される
- [ ] 閉じるボタンで消える
- [ ] duration後に自動で消える

---

## 6. TDD対象一覧

| 対象 | 種別 | ファイルパス | 状態 |
|------|------|-------------|------|
| Toast | コンポーネント | `src/components/elements/toast/toast.tsx` | 未実装 |
| Toaster | プロバイダー | `src/components/elements/toast/toaster.tsx` | 未実装 |
