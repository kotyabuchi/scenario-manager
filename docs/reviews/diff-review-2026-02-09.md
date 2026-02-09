# コード差分レビュー

> **反映ステータス**: 反映済み（2026-02-09）
> **反映内容**: 必須 0件 + 推奨 2件 + 検討 1件

> **レビュー日時**: 2026-02-09
> **対象範囲**: HEAD からの未コミット変更（staged + unstaged + untracked）
> **変更ファイル数**: 25 files（src/ 配下: 17 files） + 削除ファイル 51 files（.agents/）
> **総合評価**: B

## 変更サマリー

SystemMessage のリファクタリング（統合 atom + Alert コンポーネント再利用）、シナリオ検索 UI のレイアウト改善（SearchSidebar sticky 位置調整、スケルトンローディング導入）、ページネーション安定性修正（tiebreaker ソート追加、offset リセットタイミング修正）が主な変更。加えて、不要な `.agents/` ディレクトリの削除と開発用 Agentation ツールバーの追加が含まれる。

### 変更ファイル

| ファイル | 追加 | 削除 | 種別 |
|----------|------|------|------|
| `src/store/systemMessage.ts` | +39 | -29 | 変更 |
| `src/hooks/useSystemMessage.ts` | +17 | -39 | 変更 |
| `src/components/blocks/SystemMessage/SystemMessage.tsx` | +10 | -35 | 変更 |
| `src/components/blocks/SystemMessage/SystemMessage.stories.tsx` | +151 | - | 新規 |
| `src/components/elements/alert/alert.tsx` | +11 | -6 | 変更 |
| `src/styles/recipes/alert.ts` | +5 | -6 | 変更 |
| `src/components/elements/alert/alert.stories.tsx` | +2 | -2 | 変更 |
| `src/app/(main)/scenarios/_components/ScenariosContent.tsx` | +4 | -8 | 変更 |
| `src/app/(main)/scenarios/_components/SearchSidebar/SearchSidebar.tsx` | +12 | -12 | 変更 |
| `src/app/(main)/scenarios/_components/SearchSidebar/styles.ts` | +14 | -9 | 変更 |
| `src/app/(main)/scenarios/_components/SearchTopBar/styles.ts` | +1 | -1 | 変更 |
| `src/app/(main)/scenarios/_components/styles.ts` | +1 | -5 | 変更 |
| `src/app/(main)/scenarios/_components/ScenarioList.tsx` | +2 | -5 | 変更 |
| `src/app/(main)/scenarios/_components/ScenarioCardSkeleton.tsx` | +57 | - | 新規 |
| `src/app/(main)/scenarios/adapter.ts` | +2 | -1 | 変更 |
| `src/app/(main)/_components/SignupModalWrapper.tsx` | +6 | -6 | 変更 |
| `src/app/(main)/scenarios/new/_components/ScenarioForm.tsx` | +8 | -5 | 変更 |
| `src/app/(main)/sessions/new/_components/SessionFormContainer.tsx` | +3 | -3 | 変更 |
| `src/hooks/useDiscordAuth.ts` | +10 | -6 | 変更 |
| `src/app/layout.tsx` | +2 | - | 変更 |
| `package.json` | +1 | - | 変更 |

## 評価詳細

### 1. コーディング規約準拠 WARN

- 命名規則、Import 順序、スタイル分離パターンは適切に守られている
- `console.log` の使用が `alert.stories.tsx:41` に存在するが、Storybook のストーリーファイル内のためルール上は許容される
- **指摘**: `SystemMessage/styles.ts` にリファクタリング前の旧スタイル定義（`messageItem`, `icon`, `messageText`, `closeButton`）が未使用のまま残存。また `messageItem` の `error` バリアントは `MessageLevel` 型の `'error'` → `'danger'` 変更と整合しない
- **指摘**: `scenarios/_components/styles.ts:335` に `resultsLoadingOverlay` スタイルが未使用のまま残存

### 2. 設計・保守性 OK

- SystemMessage の統合 atom パターン（Discriminated Union による action dispatch）は Jotai のベストプラクティスに沿っており、3 つの個別 atom から 1 つに統合した設計は保守性が向上
- `useSystemMessage` フックが `messages`（読み取り）と操作関数（書き込み）を 1 つのフックにまとめたことで、`SystemMessage.tsx` が `useAtomValue` / `useSetAtom` を直接使う必要がなくなり、依存関係が明確化
- `Alert` コンポーネントの再利用により、SystemMessage 独自のアイコン・スタイルロジックの重複が解消
- `ScenarioCardSkeleton` は適切に分離され、再利用可能な構造

### 3. セキュリティ OK

- 入力バリデーションに問題なし
- 機密情報のハードコードなし
- XSS/インジェクションリスクなし

### 4. パフォーマンス OK

- ローディングオーバーレイの削除とスケルトン導入はパフォーマンス上の劣化なし
- `useCallback` の依存配列は適切（`dispatch` 単一参照）
- `adapter.ts` のタイブレーカーソート追加は DB 側のオーバーヘッドは最小限（既存インデックスの primary key を使用）

### 5. UX・アクセシビリティ OK

- `ScenarioCardSkeletonGrid` に `role="status"`, `aria-busy="true"`, `aria-label="検索中"` が適切に設定
- `SystemMessage` の `role="alert"`, `aria-live="polite"` は維持
- Alert アイコンに明示的な `size="20"` を指定し、表示の一貫性を確保
- SearchSidebar のトグルボタンに `aria-label`, `aria-expanded` が適切に設定

### 6. バグ・ロジックエラー OK

- `buildApiQueryString` の修正: 空パラメータ時も `?` を返す動作は URLSearchParams の仕様と一致し問題なし
- `setOffset(0)` のフェッチ前移動: フィルター変更時に即座にページネーションがリセットされ、旧データとの不整合を防止
- `scenario_id` タイブレーカーソート: ページネーション時の重複キー問題を根本解決

## 指摘一覧

### 必須（マージ前に修正すべき）

| # | 観点 | ファイル:行 | 指摘事項 | 推奨対応 |
|---|------|------------|---------|---------|
| - | - | - | なし | - |

### 推奨（対応が望ましい）

| # | 観点 | ファイル:行 | 指摘事項 | 推奨対応 |
|---|------|------------|---------|---------|
| 1 | 規約 | `SystemMessage/styles.ts:17-82` | Alert 移行後の未使用スタイル残存（`messageItem`, `icon`, `messageText`, `closeButton`）。`messageItem` の `error` バリアントは型定義と不整合 | `container` のみ残して他を削除 |
| 2 | 規約 | `scenarios/_components/styles.ts:334-344` | ローディングオーバーレイ削除後の未使用スタイル `resultsLoadingOverlay` が残存 | 定義とコメントを削除 |

### 検討（余裕があれば）

| # | 観点 | ファイル:行 | 指摘事項 | 推奨対応 |
|---|------|------------|---------|---------|
| 3 | 設計 | `layout.tsx:1,31` | `agentation` は devDependency だが Server Component でトップレベル import。現在の構成では tree-shaking で問題ないが、CI 環境変更時にビルド失敗のリスク | `next/dynamic` での遅延ロード、または別ファイルに分離して条件付き import |

## 良い点

- SystemMessage の統合 atom パターンは Jotai の Discriminated Union dispatch を活用した良い設計。複数の書き込み atom を 1 つに統合することで、atom の数を減らしつつ型安全性を維持
- `MessageLevel` の `'error'` → `'danger'` 変更により、Alert コンポーネントの `status` 型と統一。型レベルでの不整合リスクを排除
- スケルトンローディングの導入で、「読み込み中...」テキストからカードレイアウトのプレースホルダーに改善。Cumulative Layout Shift (CLS) の低減にも寄与
- `adapter.ts` のタイブレーカーソートは、ページネーションの根本的な安定性問題を解決する正しいアプローチ
- 呼び出し側（`SignupModalWrapper`, `ScenarioForm`, `SessionFormContainer`, `useDiscordAuth`）すべてが `addMessage(level, message)` 形式に統一され、API の一貫性が確保

## 総合所見

全体として品質の高いリファクタリング。SystemMessage の Alert コンポーネント再利用と統合 atom パターンは、コードの重複削減と保守性向上に寄与している。検索 UI の改善（スケルトン、サイドバーレイアウト、ページネーション安定性）も適切。必須指摘はなく、推奨事項の 2 件（未使用スタイルの削除）を対応すればマージ可能。
