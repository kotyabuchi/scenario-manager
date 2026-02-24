# コード差分レビュー

> **反映ステータス**: 反映済み（2026-02-23）
> **反映内容**: 必須 1件 + 推奨 1件 + 検討 1件（全件対応）

> **レビュー日時**: 2026-02-23
> **対象範囲**: HEAD からの未コミット変更（staged + unstaged + untracked）
> **変更ファイル数**: 43 files
> **総合評価**: C
> **レビューモード**: シリアル

## 変更サマリー

セッション作成フォームをセクション分割し、参加者検索とシナリオ統合検索モーダルを新設する大幅なUI再構成が入っています。併せて、サーバーアクションにシナリオID検索とスマートフィルタ適用が追加され、Button/ModalのAPI拡張とz-index調整が行われました。旧コンポーネント群は新しいセクション構成へ移行され、関連テスト/Storybookも移動・再作成されています。

### 変更ファイル

| ファイル | 追加 | 削除 | 種別 |
|----------|------|------|------|
| `AGENTS.md` | +108 | -0 | 新規 |
| `.claude/requirements/requirements-session-flow.md` | +16 | -16 | 変更 |
| `src/app/(main)/sessions/_components/UpcomingTab.tsx` | +4 | -7 | 変更 |
| `src/app/(main)/sessions/new/_components/MemberListItem.stories.tsx` | +0 | -58 | 削除 |
| `src/app/(main)/sessions/new/_components/MemberListItem.tsx` | +0 | -74 | 削除 |
| `src/app/(main)/sessions/new/_components/MemberSearchInput.stories.tsx` | +0 | -45 | 削除 |
| `src/app/(main)/sessions/new/_components/MemberSearchInput.test.tsx` | +0 | -154 | 削除 |
| `src/app/(main)/sessions/new/_components/MemberSearchInput.tsx` | +0 | -144 | 削除 |
| `src/app/(main)/sessions/new/_components/ScenarioSearchModal.stories.tsx` | +0 | -46 | 削除 |
| `src/app/(main)/sessions/new/_components/ScenarioSearchModal.test.tsx` | +0 | -174 | 削除 |
| `src/app/(main)/sessions/new/_components/ScenarioSearchModal.tsx` | +0 | -235 | 削除 |
| `src/app/(main)/sessions/new/_components/ScenarioSelectedCard.stories.tsx` | +0 | -79 | 削除 |
| `src/app/(main)/sessions/new/_components/ScenarioSelectedCard.tsx` | +0 | -82 | 削除 |
| `src/app/(main)/sessions/new/_components/SessionForm.stories.tsx` | +6 | -0 | 変更 |
| `src/app/(main)/sessions/new/_components/SessionForm.test.tsx` | +4 | -6 | 変更 |
| `src/app/(main)/sessions/new/_components/SessionForm.tsx` | +41 | -340 | 変更 |
| `src/app/(main)/sessions/new/_components/memberStyles.ts` | +0 | -124 | 削除 |
| `src/app/(main)/sessions/new/_components/scenarioCardStyles.ts` | +0 | -74 | 削除 |
| `src/app/(main)/sessions/new/_components/scenarioSearchStyles.ts` | +0 | -97 | 削除 |
| `src/app/(main)/sessions/new/_components/styles.ts` | +64 | -2 | 変更 |
| `src/app/(main)/sessions/new/actions.ts` | +189 | -5 | 変更 |
| `src/app/(main)/sessions/new/schema.ts` | +1 | -1 | 変更 |
| `src/app/(main)/sessions/new/_components/sections/basic-info/BasicInfoSection.tsx` | +53 | -0 | 新規 |
| `src/app/(main)/sessions/new/_components/sections/participants/MemberListItem.stories.tsx` | +52 | -0 | 新規 |
| `src/app/(main)/sessions/new/_components/sections/participants/MemberListItem.tsx` | +66 | -0 | 新規 |
| `src/app/(main)/sessions/new/_components/sections/participants/MemberSearchInput.stories.tsx` | +39 | -0 | 新規 |
| `src/app/(main)/sessions/new/_components/sections/participants/MemberSearchInput.test.tsx` | +118 | -0 | 新規 |
| `src/app/(main)/sessions/new/_components/sections/participants/MemberSearchInput.tsx` | +184 | -0 | 新規 |
| `src/app/(main)/sessions/new/_components/sections/participants/ParticipantsSection.tsx` | +72 | -0 | 新規 |
| `src/app/(main)/sessions/new/_components/sections/participants/memberStyles.ts` | +107 | -0 | 新規 |
| `src/app/(main)/sessions/new/_components/sections/scenario/ScenarioSearchModal.stories.tsx` | +41 | -0 | 新規 |
| `src/app/(main)/sessions/new/_components/sections/scenario/ScenarioSearchModal.test.tsx` | +166 | -0 | 新規 |
| `src/app/(main)/sessions/new/_components/sections/scenario/ScenarioSearchModal.tsx` | +422 | -0 | 新規 |
| `src/app/(main)/sessions/new/_components/sections/scenario/ScenarioSelectSection.tsx` | +76 | -0 | 新規 |
| `src/app/(main)/sessions/new/_components/sections/scenario/ScenarioSelectedCard.stories.tsx` | +72 | -0 | 新規 |
| `src/app/(main)/sessions/new/_components/sections/scenario/ScenarioSelectedCard.tsx` | +73 | -0 | 新規 |
| `src/app/(main)/sessions/new/_components/sections/scenario/scenarioCardStyles.ts` | +66 | -0 | 新規 |
| `src/app/(main)/sessions/new/_components/sections/scenario/scenarioSearchStyles.ts` | +276 | -0 | 新規 |
| `src/app/(main)/sessions/new/_components/sections/schedule/ScheduleSection.tsx` | +124 | -0 | 新規 |
| `src/components/elements/button/button.tsx` | +15 | -7 | 変更 |
| `src/components/elements/modal/modal.tsx` | +3 | -1 | 変更 |
| `src/components/elements/modal/styles.ts` | +27 | -13 | 変更 |
| `src/styles/tokens/zIndex.ts` | +1 | -1 | 変更 |

## 評価詳細

### 1. コーディング規約準拠 OK
大きな規約違反（any、console、非セマンティックHTMLなど）は見当たりません。スタイルは分離され、PandaCSSトークン利用に沿っています。

### 2. 設計・保守性 WARN
`ParticipantsSection` がフォーム配列の値と表示データを別状態で管理しており、既存値の再hydration時に表示が崩れる可能性があります（詳細は指摘一覧）。

### 3. セキュリティ OK
認証チェックや検索クエリの下限チェックが維持されており、明確なリスクは見当たりません。

### 4. パフォーマンス OK
検索はデバウンス付きで、スマートフィルタは最大20件での参照に留まっています。

### 5. UX・アクセシビリティ WARN
検索入力の`aria-controls`が対応する`id`を持たず、SR向けの紐付けが不完全です。

### 6. バグ・ロジックエラー NG
`ToggleGroup` のAPI使用が不一致で、型エラー/描画欠落につながります。

## 指摘一覧

### 必須（マージ前に修正すべき）

| # | 観点 | ファイル:行 | 指摘事項 | 推奨対応 |
|---|------|------------|---------|---------|
| 1 | バグ・ロジックエラー | `src/app/(main)/sessions/_components/UpcomingTab.tsx:31-109` | `ToggleGroup` が `value: string[]` と `ToggleItem.icon` を要求するのに対し、`value` に文字列を渡し、`item` プロパティを使用しているため、型エラーとアイコン未表示が発生します。 | `viewToggleItems` を `{ value, icon, label }` に戻し、`value={[currentView]}` と `details.value[0]` で制御する。 |

### 推奨（対応が望ましい）

| # | 観点 | ファイル:行 | 指摘事項 | 推奨対応 |
|---|------|------------|---------|---------|
| 1 | UX・アクセシビリティ | `src/app/(main)/sessions/new/_components/sections/scenario/ScenarioSearchModal.tsx:295-313` | 検索入力のクリアボタンが `aria-controls="scenario-search-input"` を指定していますが、入力に対応する `id` がありません。SR向けの関連付けが欠落します。 | 入力に `id="scenario-search-input"` を追加するか、`aria-controls` を削除する。 |

### 検討（余裕があれば）

| # | 観点 | ファイル:行 | 指摘事項 | 推奨対応 |
|---|------|------------|---------|---------|
| 1 | 設計・保守性 / UX | `src/app/(main)/sessions/new/_components/sections/participants/ParticipantsSection.tsx:20-73` | `memberUsers` がフォームの `invitedMembers` から再構築されないため、初期値や再描画時に参加者が表示されない可能性があります。 | `fields` の変更に追従して `memberUsers` を初期化する、または `invitedMembers` の詳細を上位から渡す設計にする。 |

## 良い点

- セッション作成UIのセクション分割で責務が明確になり、テストやStorybookの範囲も揃っています。
- シナリオ検索にID/URL入力とスマートフィルタを統合したことで操作フローが簡潔になっています。
- Button/Modalの拡張が汎用化され、他画面への再利用がしやすい構成です。

## 総合所見

主要なUI再構成と検索体験の改善が進んでいますが、`ToggleGroup` のAPI不一致は即時修正が必要です。アクセシビリティ面の小さな修正と、参加者リストの再hydration設計を整えることで、品質と信頼性が一段上がります。
