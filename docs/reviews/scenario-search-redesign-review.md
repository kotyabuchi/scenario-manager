# シナリオ検索画面 PC/SPレイアウト リデザイン計画 レビューレポート

> **反映ステータス**: 反映済み（2026-02-08）
> **反映内容**: 必須 0件 + 推奨 4件 + 検討 0件

> **レビュー日時**: 2026-02-08（第3回レビュー）
> **対象ファイル**: `docs/plans/scenario-search-redesign.md`
> **総合評価**: A
> **前回レビュー**: 2026-02-08（第2回） - 必須3件+推奨5件+検討5件 → **全件反映済み**

## サマリー

第2回レビューの必須指摘3件（パーサー統一、sort URL同期、3ボタンフッターJSX）がすべて的確に反映されており、計画の品質は実装可能なレベルに到達している。パーサーのSSOT統一（Step 2.0）とFilterStateBase共通インターフェース（Step 2.4）の追加は特に優れた設計改善。**必須指摘はなし**だが、実コードとの細かい不整合が数点残っている。

## 評価詳細

### 1. 技術的妥当性 OK

**良い点**:
- Step 2.0 のパーサー統一設計が的確。`searchParams.ts` を SSOT とし、`filterParsers`（Client用）と `searchParamsParsers`（Server用: filterParsers + sort）の2層構造で明確に責務分離
- `duration` → `minPlaytime/maxPlaytime` 変換の `DURATION_MAP` を `toSearchParams` 関数に統合し、変換ロジックの分散を解消
- `sort` の URL 同期を `useQueryState` で実現する方針が明記済み
- `FilterStateBase` 共通インターフェースの `commit?` オプショナルメソッドにより、immediate/draft 両モードを型安全にカバー
- `committedKey = JSON.stringify(committed)` パターンの統一使用（useFilterDraft内、ScenariosContent内）

**軽微な懸念**:

1. **DURATION_MAP の値が実コードと不一致**: 計画書の `DURATION_MAP`（Step 2.0, L276-280）では `'~1h'`, `'1~3h'`, `'3~6h'`, `'6h~'` をキーとしている。これは `DURATION_OPTIONS`（`interface.ts:33-37`）の値と一致する。しかし、**現在の `ScenariosContent.tsx:73-78` の `durationMap`** では `'1h'`, `'1-3h'`, `'3-6h'`, `'6h+'` をキーとしている。FilterPanel は `DURATION_OPTIONS` の `value` をそのまま `setDuration()` に渡すため、実際にURLに保存される値は `~1h` 等だが、`buildApiQueryString` が受け取る際に `durationMap['~1h']` は `undefined` になり、**変換が無視される**（既存バグの可能性）。計画書の `DURATION_MAP` は `DURATION_OPTIONS` と整合しており正しいが、実装時に `ScenariosContent.tsx` 側の既存 `durationMap` も同時に修正されることを確認すべき。

2. **`useFilterState` の `applyFilter` / `applyFilterDebounced` の除去**: 計画書の Step 2.3 では `mode: 'immediate'` の追加のみ言及しているが、`FilterStateBase` 共通インターフェースには `applyFilter` が含まれていない。現在の `useFilterState` が返す `applyFilter`（L156）は FilterPanel から直接使用されていないが、将来の拡張で使う可能性がある。除去するか残すかを明示するとよい。

### 2. 網羅性・考慮漏れ OK

**良い点**:
- 3ボタンフッターのJSX（Step 3.7, L1511-1547）が具体的に記載され、前回の必須指摘 #3 を完全に解消
- SP ドラフト操作フローの「条件をリセット」ラベルとその挙動説明が明確
- Phase 1 完了基準テーブル（L159-166）の追加、フィードバックループの明記
- Phase 0 の別コミット/別PR方針の明記（L99）
- Step 4.3 のstyles.ts分割の検討アイテム追加

**軽微な懸念**:

3. **FilterPanel 内のクリアボタンとの重複**: 現在の `FilterPanel.tsx:172-182` にはバリアントが `sidebar` または `bottomsheet` の場合に「フィルターをクリア」ボタンが表示される。計画では FilterBottomSheet に3ボタンフッターを追加するが、FilterPanel 内の既存クリアボタンとの関係が未記載。`showSystems` のように props で制御するか、variant `bottomsheet` 時のクリアボタン非表示化が必要。

4. **`useFilterDraft` の `setSystems` と既存 `useFilterState` の非対称性**: 計画の `useFilterDraft`（Step 2.1）には `setSystems`（L413-415）が存在するが、既存の `useFilterState`（L144-158の return）には `setSystems` がない（`toggleSystem` のみ）。SearchTopBar は `draftState.setSystems` を使用する（L1024）ため `useFilterDraft` 専用だが、`FilterStateBase` 共通インターフェースに `setSystems` が含まれていない（L555-568）。これは意図的であれば問題ないが、将来 FilterPanel が `setSystems` を使いたい場合の拡張パスが不明。

### 3. セキュリティ OK

- フロントエンドUI変更のみ。API呼び出しの構造変更なし
- `buildApiQueryString` は URLSearchParams で構築しておりインジェクションリスクなし
- nuqs パーサーによる入力バリデーションが維持される

### 4. UX・アクセシビリティ OK

**良い点**:
- 前回推奨の ARIA 属性がすべて反映済み（`aria-busy`, `role="status"`, `aria-label="検索中"`）
- MobileSearchBar に `aria-label="シナリオ名で検索"` が追加済み（L1067）
- サイドバー折りたたみ時の `aria-label="フィルターを展開"` / 展開時の `aria-label="フィルターを閉じる"` が適切
- 「条件をリセット」のラベル変更でユーザーの意図齟齬を軽減

**軽微な懸念**:

5. **サイドバー折りたたみ/展開のキーボード操作**: `sidebarToggle` はネイティブ `<button>` 要素であり基本的なキーボードアクセシビリティは確保されているが、展開状態を `aria-expanded` で示すとスクリーンリーダーの読み上げが改善する。

### 5. 保守性・拡張性 OK

**良い点**:
- `FilterStateBase` 共通インターフェースにより、新しい FilterState 実装を追加する際の互換性が型レベルで保証
- `showSystems` prop による表示制御は Open/Closed 原則に沿った拡張パターン
- Step 4.3 のスタイル分割方針で将来の保守性に配慮

**軽微な懸念**:

6. **`inline` バリアントの残存**: 計画では FilterChipBar（タブレット用）を廃止するが、`FilterPanelVariant` 型定義（`interface.ts:13`）の `'inline'` バリアントは削除対象に含まれていない。使用箇所がなくなるため、クリーンアップ対象に追加すべき。

### 6. プロジェクト整合性 OK

**良い点**:
- Biome 無効化コメント形式（`// biome-ignore`）への統一が反映済み
- セマンティックトークンの適切な活用（`sidebar.bg`, `sidebar.toggleBg` 等の新規追加）
- 既存の `card.default` shadow の再利用でトークン増殖を回避
- PandaCSS の cva パターンでサイドバーの collapsed/expanded 状態を管理

**軽微な懸念**:

7. **`searchTopBar_keywordInput` のハードコードスタイル**: `border: 'none'`（L836）はプロジェクトのデザインシステムでは input 系コンポーネントに対して `bg` による差異化を推奨している（`styling-rules.md`）。`border: 'none'` は実質的にデフォルトの挙動と同じため不要かもしれないが、明示的に書くことで意図が伝わるので問題は軽微。

### 7. 実行可能性 OK

**良い点**:
- Phase 0-5 の依存関係が明確で、Phase 0 の独立実施方針も明記
- ファイル変更一覧が詳細（新規4 + 変更17 + リネーム1 + 削除16）
- テスト項目が充実（12項目、レスポンシブ・isPending・Enterキー含む）
- 完了基準テーブルが Phase 1 に追加済み

## 改善提案

### 必須（実装前に対処すべき）

なし。

### 推奨（対応が望ましい）

| # | 視点 | 指摘事項 | 推奨対応 |
|---|------|---------|---------|
| 1 | 技術的妥当性 | `ScenariosContent.tsx` の既存 `durationMap` キー（`'1h'`, `'1-3h'` 等）が `DURATION_OPTIONS` の値（`'~1h'`, `'1~3h'` 等）と不一致（既存バグ疑い） | 実装時に `DURATION_MAP` のキーを `DURATION_OPTIONS` の `value` と一致させることを確認。計画書に注記を追加するか、Step 2.0 の変更範囲に `buildApiQueryString` のキー修正を含める |
| 2 | 網羅性 | FilterPanel 内の「フィルターをクリア」ボタンと FilterBottomSheet の3ボタンフッターが重複する | FilterBottomSheet 使用時は FilterPanel の variant `bottomsheet` でクリアボタンを非表示にする制御を Step 2.4 または Step 3.7 に追記 |
| 3 | 保守性 | `FilterPanelVariant` 型の `'inline'` がタブレット廃止後に未使用になる | Step 4.2 の不要import確認に `'inline'` バリアント削除を追加 |
| 4 | UX | サイドバートグルボタンに `aria-expanded` 属性がない | `<button aria-expanded={!isCollapsed}>` を SearchSidebar のトグルボタンに追加 |

### 検討（余裕があれば）

| # | 視点 | 指摘事項 | 推奨対応 |
|---|------|---------|---------|
| 1 | 技術的妥当性 | `useFilterState` の `applyFilter` / `applyFilterDebounced` が `FilterStateBase` に含まれない | 残すか除去するかを明記。ドラフト導入後はドラフト外の即時適用ケースがないため、除去してもよい |
| 2 | 網羅性 | `useFilterDraft` の `setSystems` が `FilterStateBase` に含まれない | 必要に応じて共通インターフェースに追加するか、SearchTopBar 専用として割り切るかを明記 |

## 総合所見

第2回レビューの全指摘事項（必須3件、推奨5件、検討5件）が的確に反映されており、計画は実装可能な品質に達している。特に以下の改善が秀逸：

- **Step 2.0 パーサー統一**: `filterParsers` と `searchParamsParsers` の2層構造で SSOT 原則を実現しつつ、Client/Server の責務分離を維持
- **FilterStateBase 共通インターフェース**: `commit?` オプショナルメソッドにより、immediate/draft 両モードの型安全な共存を実現
- **Phase 0 独立実施方針**: レビュー粒度とロールバック容易性の改善

残る推奨指摘4件はいずれも軽微であり、実装中に対応可能なレベル。最も注意すべきは推奨 #1 の `DURATION_MAP` キー不整合で、これは既存コードのバグ疑いを含むため、実装初期に確認・修正することを推奨する。

計画全体として、ドラフト/確定パターンの導入は検索UXを大きく改善するポテンシャルがあり、コンポーネントの責務分離（SearchTopBar, SearchSidebar, MobileSearchBar）も明確。そのまま実装に進めてよい。
