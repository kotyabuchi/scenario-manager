# コード差分レビュー

> **反映ステータス**: 反映済み（2026-02-25）
> **反映内容**: 必須 1件 + 推奨 1件 + 検討 1件

> **レビュー日時**: 2026-02-25
> **対象範囲**: HEAD からの未コミット変更（staged + unstaged + untracked）
> **変更ファイル数**: 7 files
> **総合評価**: B
> **レビューモード**: シリアル（手動。Task系サブエージェント未使用）

## 変更サマリー

セッション詳細ページのヘッダー右上の曖昧な「編集」ボタンを廃止し、フェーズに応じた主アクション/補助アクション/その他メニューに再編している。あわせて、基本情報・参加者・会場/ツール・GMメモの各セクションに編集/管理ボタンを配置するUI整理が行われている。

### 変更ファイル

| ファイル | 追加 | 削除 | 種別 |
|----------|------|------|------|
| `src/app/(main)/sessions/[id]/_components/SessionActions.tsx` | +207 | -63 | 変更 |
| `src/app/(main)/sessions/[id]/_components/SessionDetailContent.tsx` | +15 | -1 | 変更 |
| `src/app/(main)/sessions/[id]/_components/sections/basic-info/BasicInfoSection.tsx` | +30 | -1 | 変更 |
| `src/app/(main)/sessions/[id]/_components/sections/gm-notes/GMNotesSection.tsx` | +22 | -1 | 変更 |
| `src/app/(main)/sessions/[id]/_components/sections/participants/ParticipantsSection.tsx` | +17 | -1 | 変更 |
| `src/app/(main)/sessions/[id]/_components/sections/tools/ToolsSection.tsx` | +12 | -1 | 変更 |
| `src/app/(main)/sessions/[id]/styles.ts` | +29 | -0 | 変更 |

## 評価詳細

### 1. コーディング規約準拠 OK

TypeScript/React/PandaCSS の既存パターンに沿っており、スタイルは `styles.ts` に集約されている。`console` の追加や危険な型回避も見当たらない。

### 2. 設計・保守性 WARN

`SessionActions` の責務整理（主CTA/補助CTA/その他）は改善されている一方、`ParticipantsSection` の `申請管理` 表示条件がフェーズ非依存になっており、合意した条件表とのズレが残る。

### 3. セキュリティ OK

新規の入力値は既存 Server Action (`updateSessionPhaseAction`) を利用しており、認可/バリデーションはサーバー側で継続して行われる。

### 4. パフォーマンス OK

UI再構成が中心で、DBアクセスや重いレンダリング処理の追加はない。`useTransition` の利用も適切。

### 5. UX・アクセシビリティ WARN

ヘッダーに複数ボタンを載せたことで、既存 `PageHeader` の固定高さレイアウトと衝突し、モバイルでボタンがはみ出す/重なる可能性がある。

### 6. バグ・ロジックエラー OK

型チェックは通過しており、フェーズ遷移の追加は既存の Server Action を使っているためロジック破綻は見つからなかった。

## 指摘一覧

### 必須（マージ前に修正すべき）

| # | 観点 | ファイル:行 | 指摘事項 | 推奨対応 |
|---|------|------------|---------|---------|
| 1 | UX・アクセシビリティ | `src/app/(main)/sessions/[id]/_components/SessionActions.tsx:373` | ヘッダー内に主CTA+補助CTA+メニューを横並びで描画するようになったが、`PageHeader` 側は固定高さ `56px` のまま (`src/components/blocks/PageHeader/styles.ts:7`)。小画面で2行目が必要になるとヘッダー外へはみ出し、ボタンが内容と重なる可能性が高い。 | `PageHeader` を可変高さ + wrap 対応にするか、セッション詳細ページ側でモバイル時はボタンを折りたたむ（例: 主CTAのみ/下部固定CTA）レイアウトにする。 |

### 推奨（対応が望ましい）

| # | 観点 | ファイル:行 | 指摘事項 | 推奨対応 |
|---|------|------------|---------|---------|
| 1 | 設計・保守性 / UX・アクセシビリティ | `src/app/(main)/sessions/[id]/_components/sections/participants/ParticipantsSection.tsx:62` | `申請管理` ボタンの表示条件が `userRole === 'manager'` のみで、フェーズに依存していない。合意した条件表では `RECRUITING/PREPARATION` 中心の導線だったため、`IN_PROGRESS/COMPLETED/CANCELLED` でも表示され続ける。 | `ParticipantsSection` に `sessionPhase` を渡し、`RECRUITING` / `PREPARATION` のときだけ表示する（または明示的に「履歴を見る」等の文言へ切替）。 |

### 検討（余裕があれば）

| # | 観点 | ファイル:行 | 指摘事項 | 推奨対応 |
|---|------|------------|---------|---------|
| 1 | バグ・ロジックエラー / テスト | `src/app/(main)/sessions/[id]/_components/SessionActions.tsx:73` | フェーズ別CTAの条件分岐が大きく増えたが、今回差分では `SessionActions` のコンポーネントテストや Storybook ケース追加がない。 | 少なくとも `manager/participant/guest × phase` の代表ケースを Storybook またはコンポーネントテストで追加し、CTA表示条件の退行を防ぐ。 |

## 良い点

- ヘッダーの曖昧な `編集` を排除し、フェーズ主導の操作に整理したのはユーザー行動の明確化として良い。
- `募集を締める` を既存の `updateSessionPhaseAction` に接続しており、認可・バリデーション・楽観ロックの仕組みを再利用できている。
- 各セクションに編集/管理ボタンを移したことで、`ページ上部 = 進行操作 / セクション = データ編集` の責務分離が見えやすくなった。

## 総合所見

UIの方向性は要件整理に沿っており、実装方針自体は妥当。マージ前に優先して直すべき点は、ヘッダー固定高さとの衝突によるモバイル崩れリスクで、ここが解消されれば品質はかなり安定する。次点として `ParticipantsSection` の `申請管理` 表示条件をフェーズ連動に揃えると、合意した条件表との整合性が取れる。
