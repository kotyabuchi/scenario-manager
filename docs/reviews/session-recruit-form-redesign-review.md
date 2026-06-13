# セッション募集フォーム リデザイン レビューレポート

> **レビュー日時**: 2026-02-18
> **対象ファイル**: `docs/plans/session-recruit-form-redesign.md`
> **総合評価**: B
> **反映ステータス**: 反映済み（2026-02-18）
> **反映内容**: 必須 4件 + 推奨 6件 + 検討 4件

## サマリー

モック準拠のセクション構造化、既存コンポーネント活用、Batch分割の粒度いずれも適切で、実装可能性の高い計画。ただし、スキーマの`recruitedPlayerCount`のmin値不整合、デバウンス実装の技術的誤認、参加者コンポーネントのテスト・Storybook欠落、モック上の「下書き保存」未対応など、実装前に対処すべき点がいくつかある。

## 評価詳細

### 1. 技術的妥当性 WARN

**良い点**:
- `register` 維持と `Controller` への移行判断が的確。`NumberInput`（`onValueChange`コールバック式）や `Switch`（Ark UI）は `Controller` が正解
- `useFieldArray` による `invitedMembers` の動的配列管理は React Hook Form のベストプラクティス
- `useWatch` による文字数カウンタは `register` と干渉しない正しいアプローチ
- 既存 `searchScenarios` アダプターの再利用判断は適切

**問題点**:

- **デバウンス実装の誤認**: Step 2-4, 3-4で「`useTransition` + 300ms デバウンス検索」と記載されているが、`useTransition` はデバウンス機能を持たない。`useTransition` はstate更新を低優先度にマークするだけで、連続入力時にリクエストを間引く機能はない。`setTimeout` + `clearTimeout` パターン、または `useDeferredValue` との併用が必要
- **`recruitedPlayerCount` の min 値不整合**: Step 1-2 で `NumberInput` に `min: 0` を指定しているが、既存スキーマ（`schema.ts:54`）は `min(1)` を定義。モック（`code.html:250`）も `value="0"` + 「0人の場合、募集は開始されません」と表示。スキーマ変更が必要だが計画に明記されていない
- **`useState` による日程ラジオ管理**: Step 1-2 で `useState<'later' | 'specify'>` を使用するが、`form-rules.md` は `useState` でのフォーム状態管理を禁止。React Hook Form の `watch` で代替すべき

### 2. 網羅性・考慮漏れ WARN

**良い点**:
- セクション4つの分割（基本情報/参加者/シナリオ/日程・その他）がモックと一致
- テスト戦略が具体的（セレクタ更新の差分テーブルが秀逸）
- `invitedMembers` の参加状態を `CONFIRMED` に設定する判断が適切（作成者が明示追加→承認不要）

**問題点**:

- **「下書き保存」ボタンの未対応**: モック（基本状態/シナリオ選択状態の両方）に「下書き保存」ボタンが存在するが、計画ではスコープ外の明記がない。意図的な除外ならば「決定事項」テーブルに記載すべき
- **自分自身の追加防止**: `MemberSearchInput` の `excludeUserIds` に自分自身の `userId` も含めるべき（作成者はKEEPERとして自動追加されるため）
- **MemberListItem のスタイル一覧不完全**: Step 2-5 で `members_list`, `members_searchArea`, `members_item` を追加するが、モックにある検索ドロップダウン（候補リスト）のスタイルが含まれていない
- **エラー時のロールバック**: Step 2-3 でセッション作成後に `session_participants` への一括 INSERT が失敗した場合のロールバック戦略がない。トランザクションの使用を検討すべき

### 3. セキュリティ WARN

**良い点**:
- `searchUsersAction` に認証チェックを含む設計
- 上限10件の結果制限

**問題点**:

- **ユーザー検索のレート制限**: `searchUsersAction` はクライアントから直接呼び出されるServer Actionだが、レート制限が計画されていない。ユーザー列挙攻撃の可能性がある。最低でもクエリ文字列の最小長（2文字以上）を設定すべき
- **`scenarioId` のURL指定タブ**: Step 3-5 で「URLで指定」タブは disabled だが、将来実装時にURL解析によるSSRF攻撃リスクがある。計画段階で注記しておくことを推奨

### 4. UX・アクセシビリティ WARN

**良い点**:
- モック準拠のカード型レイアウト
- `FormField` コンポーネント使用によるラベル + エラー + ヒントの一貫性
- 手動テスト項目にキーボード操作の確認が含まれている

**問題点**:

- **検索ドロップダウンのARIA**: `MemberSearchInput` のドロップダウンはカスタム実装だが、`role="listbox"`, `aria-activedescendant`, `aria-expanded` などのARIA属性について言及がない。WCAG 2.1 AA準拠には combobox パターンの実装が必要。Ark UI の `Combobox` コンポーネントの使用を推奨
- **ScenarioSearchModal のキーボード操作**: モーダル内のシナリオリストでの矢印キー移動、Enterでの選択について言及がない
- **文字数カウンタのスクリーンリーダー対応**: `aria-live="polite"` の付与が必要
- **NumberInput の初期値「0」の意味**: モックでは「0人の場合、募集は開始されません」と注記があるが、現在のスキーマは `min: 1` で `nullish()`。0が「未定」を意味するのか「0人募集」なのか曖昧

### 5. 保守性・拡張性 OK

**良い点**:
- 既存コンポーネントの最大限の再利用（15コンポーネント）
- `types.ts` でシナリオ選択関連の型を分離
- `useFieldArray` パターンは将来のメンバー管理機能拡張に適している
- 決定事項テーブルで「Sub GM は将来対応」と明記

**懸念点**（軽微）:
- `ScenarioSummary` 型を `_components/types.ts` に配置しているが、`interface.ts`（ページレベルの型定義ファイル）に配置する方がディレクトリ構造の慣例に沿う

### 6. プロジェクト整合性 WARN

**良い点**:
- `coding-standards.md` の命名規則（`form_sectionHeader` 等のアンダースコア区切り）に準拠
- `react-rules.md` のコンポーネント定義パターン（アロー関数 + `export const`）に準拠
- `error-handling.md` の Result 型パターンに準拠
- `icons.md` の Phosphor Icons 使用に準拠（`NoteBlank`, `CalendarBlank`, `At` 等）

**問題点**:

- **`useState` でフォーム状態管理の禁止抵触**: `form-rules.md` で禁止されている `useState` によるフォーム関連状態の管理が Step 1-2 の日程ラジオに使用されている。`watch('scheduledAt')` や追加のフォームフィールドで管理すべき
- **スタイルのハードコード値**: Step 1-1 で `fontSize: '[18px]'`, `fontSize: '[22px]'`, `fontSize: '[12px]'` などの arbitrary values を使用。`styling-rules.md` はマジックナンバー禁止で、トークン使用を推奨。`fontSize: 'lg'`, `fontSize: 'sm'` 等のトークンを使うべき
- **`border` の使用**: Step 1-1 の `form_divider` で `borderTop: '1px solid'` を定義しているが、`styling-rules.md` の「ボーダーレス」原則では `<hr>` 要素の使用が推奨されている。`<hr>` は使用しているが、スタイルに `border` を明示的に定義する必要がないか確認すべき

### 7. 実行可能性 OK

**良い点**:
- 各 Batch の見積が具体的（ファイル数 + 行数）
- 依存関係が明確（Batch 1→2→3→4 の順序依存）
- Review Checkpoint が全4 Batch に含まれている

**Batch 粒度チェック**:

| Batch | ファイル数 | 行数 | Step数 | 評価 |
|-------|-----------|------|--------|------|
| 1 | 6 | ~300 | 5 | ✅ 理想的 |
| 2 | 8 | ~350 | 6 | ✅ 上限内 |
| 3 | 8 | ~400 | 6 | ⚠ 上限に近い |
| 4 | 5 | ~200 | 4 | ✅ 理想的 |

Batch 3 は上限に近いが許容範囲内。

**Review Checkpoint フォーマット**: テンプレートの `- [ ]` チェックボックス形式ではなく `- ` テキスト形式になっている。軽微だが統一が望ましい。

## 改善提案

### 必須（実装前に対処すべき）

| # | 視点 | 指摘事項 | 推奨対応 |
|---|------|---------|---------|
| 1 | 技術的妥当性 | デバウンス実装の誤認。`useTransition` はデバウンス機能を持たない | `setTimeout`/`clearTimeout` パターンまたは `useDebounce` カスタムフックを使用。`useTransition` は非同期処理のUI遷移にのみ使用 |
| 2 | 技術的妥当性 | `recruitedPlayerCount` の min 値不整合（計画: 0, スキーマ: 1） | スキーマを `min(0)` に変更する Step を追加するか、計画を `min: 1` に修正。モックとの整合性も確認 |
| 3 | プロジェクト整合性 | `useState<'later' \| 'specify'>` が `form-rules.md` の `useState` 禁止ルールに抵触 | スキーマに `scheduleType` フィールドを追加して `register` で管理するか、`watch` ベースの条件付きレンダリングに変更 |
| 4 | UX・アクセシビリティ | `MemberSearchInput` のドロップダウンにARIA属性がない | Ark UI の `Combobox` コンポーネントの使用を検討。カスタム実装の場合は `role="combobox"` + `role="listbox"` パターンを明記 |

### 推奨（対応が望ましい）

| # | 視点 | 指摘事項 | 推奨対応 |
|---|------|---------|---------|
| 1 | 網羅性 | 「下書き保存」ボタンがモックにあるが計画に未記載 | 決定事項テーブルに「下書き保存: スコープ外（Phase 2 で対応）」と明記 |
| 2 | セキュリティ | `searchUsersAction` にレート制限・最小クエリ長がない | `query.length < 2` の場合は空配列を即座に返す。Server Action レベルでの呼び出し頻度制限を検討 |
| 3 | 網羅性 | 参加者INSERT失敗時のロールバックがない | Supabase の RPC（PostgreSQL function）でトランザクション管理するか、失敗時の部分データクリーンアップロジックを追加 |
| 4 | 網羅性 | `excludeUserIds` に自分自身を含めるべき | `MemberSearchInput` の Props に `currentUserId` を追加するか、`excludeUserIds` に現在のユーザーIDを含める |
| 5 | テスト | `MemberSearchInput`、`MemberListItem` の単体テスト・Storybook が欠落 | Batch 4 に `MemberSearchInput.test.tsx`、`MemberSearchInput.stories.tsx`、`MemberListItem.stories.tsx` を追加 |
| 6 | プロジェクト整合性 | スタイルに arbitrary values (`[18px]`, `[22px]`, `[12px]`) を多用 | PandaCSS トークン（`fontSize: 'lg'`, `'xl'`, `'xs'` 等）に置換 |

### 検討（余裕があれば）

| # | 視点 | 指摘事項 | 推奨対応 |
|---|------|---------|---------|
| 1 | 保守性 | `ScenarioSummary` 型を `_components/types.ts` に配置 | `interface.ts`（ページレベルの型定義慣例）への配置を検討 |
| 2 | UX | 文字数カウンタのスクリーンリーダー対応 | `aria-live="polite"` を付与 |
| 3 | UX | シナリオ検索モーダル内のキーボード操作詳細 | 矢印キー移動、Enter選択、Escape閉じるの仕様を明記 |
| 4 | 実行可能性 | Review Checkpoint のフォーマットがテンプレートと微妙に異なる | `- [ ]` チェックボックス形式に統一 |

## 総合所見

全体として質の高い計画書。特にBatch分割の粒度、既存コンポーネント15個の再利用判断、テスト更新の具体的な差分テーブル（Step 1-4）は実装効率を大きく高める。決定事項テーブルでの技術選定根拠の明記、Controller vs register の使い分け判断も的確。

必須指摘4件はいずれも実装前の計画修正で対処可能な範囲であり、根本的な設計変更は不要。特にデバウンス実装の修正（#1）と `useState` 禁止ルール対応（#3）は、実装フェーズで手戻りになりやすいため優先的に対処すべき。
