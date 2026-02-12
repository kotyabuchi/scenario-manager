# コード差分レビュー

> **レビュー日時**: 2026-02-12
> **対象範囲**: HEAD (`d766b5f`) からの未コミット変更（staged + unstaged + untracked）
> **変更ファイル数**: 25 files（tracked: 10, untracked: 15）
> **総合評価**: C

## 変更サマリー

ダッシュボード（ホーム画面）の大規模リデザイン。ヒーローセクション、セッション一覧、アクティビティタイムライン、ミニカレンダー、お知らせ、新着シナリオの6セクションを持つ新しいレイアウトに刷新。adapter.ts に4つの新規データ取得関数を追加し、Storybook ストーリーとユニットテストも整備。

### 変更ファイル

| ファイル | 追加 | 削除 | 種別 |
|----------|------|------|------|
| `package.json` | +1 | -0 | 変更 |
| `pnpm-lock.yaml` | +12 | -0 | 変更 |
| `src/app/(main)/home/_components/NewScenarios.tsx` | +41 | -17 | 変更 |
| `src/app/(main)/home/_components/UpcomingSessions.tsx` | +147 | -79 | 変更 |
| `src/app/(main)/home/adapter.ts` | +317 | -0 | 変更 |
| `src/app/(main)/home/interface.ts` | +43 | -7 | 変更 |
| `src/app/(main)/home/page.tsx` | +62 | -35 | 変更 |
| `src/app/(main)/home/styles.ts` | +653 | -9 | 変更 |
| `src/lib/formatters.ts` | +28 | -0 | 変更 |
| `src/styles/semanticTokens.ts` | +30 | -0 | 変更 |
| `src/app/(main)/home/_components/ActivityTimeline.tsx` | +74 | -0 | 新規 |
| `src/app/(main)/home/_components/HeroSection.tsx` | +83 | -0 | 新規 |
| `src/app/(main)/home/_components/MiniCalendar.tsx` | +181 | -0 | 新規 |
| `src/app/(main)/home/_components/SystemNotice.tsx` | +23 | -0 | 新規 |
| `src/app/(main)/home/_components/_mocks.ts` | +460 | -0 | 新規 |
| `src/app/(main)/home/loading.tsx` | +157 | -0 | 新規 |
| `src/app/(main)/home/__tests__/adapter.test.ts` | +125 | -0 | 新規 |
| `src/lib/__tests__/formatters.test.ts` | +75 | -0 | 新規 |
| `src/app/(main)/home/_components/ActivityTimeline.stories.tsx` | +42 | -0 | 新規 |
| `src/app/(main)/home/_components/Dashboard.stories.tsx` | +100 | -0 | 新規 |
| `src/app/(main)/home/_components/HeroSection.stories.tsx` | +44 | -0 | 新規 |
| `src/app/(main)/home/_components/MiniCalendar.stories.tsx` | +42 | -0 | 新規 |
| `src/app/(main)/home/_components/SystemNotice.stories.tsx` | +30 | -0 | 新規 |
| `src/app/(main)/home/_components/UpcomingSessions.stories.tsx` | +56 | -0 | 新規 |
| `.claude/skills/review-impl/SKILL.md` | - | - | 新規（開発ツール） |

## 評価詳細

### 1. コーディング規約準拠 NG

**重大な規約違反が2件あります。**

- **`react-icons` の新規導入**: `ActivityTimeline.tsx` で `react-icons/io5` を使用。プロジェクト規約 (`icons.md`) は **lucide-react の使用を必須**としており、他のアイコンライブラリの使用は禁止されています。`package.json` に `react-icons` が新規追加されており、バンドルサイズ増加・ライブラリ統一性の両面で問題です。
- **`loading.tsx` でインラインスタイルを大量使用**: `style={{ width: '200px', height: '32px' }}` 等のインラインスタイルが約20箇所。`coding-standards.md` の禁止事項「インラインスタイル（style属性）」に該当。PandaCSS の `css()` で個別スタイルを定義するか、スケルトン用のバリアント付きレシピ(cva)で対応すべき。

### 2. 設計・保守性 WARN

全体的な設計は良好だが、いくつかの懸念があります。

- **型キャスティングの多用**: `adapter.ts` で `camelCaseKeys(s as Record<string, unknown>) as UpcomingSession` のような二重キャストが3箇所。Supabase の型推論限界に起因するが、型安全性の穴を作っている。
- **リレーション型の as キャスト**: `adapter.ts:232,269` で `p.user as { nickname: string } | null` のように Supabase リレーション結果をキャストしている。
- **`SystemNotice` のハードコードデータ**: notices配列がコンポーネント内にハードコード。動的データが入るまでの仮実装なら、コメントでその旨を明記すべき。

### 3. セキュリティ OK

重大なセキュリティ問題は見当たりません。

- データ取得は認証済みユーザーIDを起点としている
- `next/image` コンポーネントを使用しており、画像URLの基本的な保護がある
- Server Component でのデータフェッチでクライアントへの不必要なデータ露出を防いでいる

### 4. パフォーマンス WARN

- `getRecentActivity` が最大6回のDBクエリを実行（2回の並列 + 4回の並列）。データ量が少ないうちは問題ないが、スケール時にレイテンシが増大する可能性がある。
- `page.tsx` で `Promise.all` で4つのデータソースを並列取得しており、ウォーターフォールを回避している（良い）。
- `MiniCalendar` の `useMemo` によるSet化は適切。

### 5. UX・アクセシビリティ WARN

- `MiniCalendar` で `<table>` + `scope="col"` + `aria-label` を使用しており、カレンダーのアクセシビリティは概ね良好。
- ボタンに `type="button"` と `aria-label` が設定されている。
- 空状態のハンドリングが各コンポーネントで適切に実装されている。
- ただし、`UpcomingSessions` のセッションカードはカード全体が `<Link>` でラップされているが、フォーカス時のビジュアルインジケータが `shadow` の変化のみで不十分。キーボードユーザーにはフォーカスリングが必要。

### 6. バグ・ロジックエラー NG

**重大なバグが1件あります。**

- `adapter.ts:239` の `timestamp: p.applied_at ?? p.user_id` — `applied_at` が null の場合に **user_id（ULID文字列）をタイムスタンプとして使用**してしまう。ソート処理で不正な日時比較が発生し、表示順序が壊れる。

## 指摘一覧

### 必須（マージ前に修正すべき）

| # | 観点 | ファイル:行 | 指摘事項 | 推奨対応 |
|---|------|------------|---------|---------|
| 1 | 規約 | `ActivityTimeline.tsx:1-6` | `react-icons/io5` を使用している。プロジェクト規約では `lucide-react` のみ許可 | `lucide-react` の同等アイコンに置き換え。`package.json` から `react-icons` を削除 |
| 2 | バグ | `adapter.ts:239` | `p.applied_at ?? p.user_id` — user_id をタイムスタンプのフォールバックに使用している | `p.applied_at ?? new Date().toISOString()` または `applied_at` が null の場合にスキップする |
| 3 | 規約 | `loading.tsx:11-14` 他 | インラインスタイル `style={{ ... }}` を約20箇所で使用（`coding-standards.md` 禁止事項） | PandaCSS の `css()` でスケルトンサイズバリアントを定義するか、スケルトン用 cva レシピを作成 |

### 推奨（対応が望ましい）

| # | 観点 | ファイル:行 | 指摘事項 | 推奨対応 |
|---|------|------------|---------|---------|
| 4 | 規約 | `styles.ts:367` | `border: '[2px solid white]'` がハードコード | `border: '[2px solid token(colors.white)]'` または `borderWidth: '[2px]', borderStyle: 'solid', borderColor: 'white'` に分離 |
| 5 | 設計 | `adapter.ts:104,138` | `camelCaseKeys(s as Record<string, unknown>) as UpcomingSession` の二重キャスト | ジェネリックヘルパー `camelCaseKeys<T>` の型推論改善を検討 |
| 6 | a11y | `UpcomingSessions.tsx:86-165` | セッションカードの `<Link>` にフォーカスリングスタイルが未設定 | `_focusVisible: { outline: 'focusRing' }` を `sessions_card` スタイルに追加 |
| 7 | 設計 | `SystemNotice.tsx:3-9` | notices データがコンポーネント内にハードコード | コメントで仮実装である旨を明記するか、propsで受け取る設計に変更 |
| 8 | a11y | `MiniCalendar.tsx:155` | `<tr key={weekIndex}>` — React keyにindexを使用 | 週の開始日をkeyに使用: `key={week[0].dateStr}` |

### 検討（余裕があれば）

| # | 観点 | ファイル:行 | 指摘事項 | 推奨対応 |
|---|------|------------|---------|---------|
| 9 | パフォ | `adapter.ts:150-284` | `getRecentActivity` が最大6回のDBクエリを実行 | Supabase RPCまたはEdge Functionでサーバー側集約を検討 |
| 10 | 設計 | `HeroSection.tsx:22-23` | `new Date(timeStr).getHours()` がサーバーのローカルタイムゾーンに依存 | 明示的なタイムゾーン処理の導入を検討（UTC→JSTの変換等） |
| 11 | 設計 | `_mocks.ts` | モックデータが460行と大きい | テストユーティリティとしてファクトリパターン（`createMockSession(overrides)` 等）の導入を検討 |

## 良い点

- **並列データフェッチ**: `page.tsx` で `Promise.all` を使い、4つのデータソースを並列取得。ウォーターフォールを適切に回避。
- **型安全性**: `interface.ts` で DB行型（`GameSessionRow` 等）からの型導出パターンに準拠。独自型の再定義を避けている。
- **Result型パターン**: `adapter.ts` 全体で `ok()`/`err()` パターンを徹底。エラーハンドリングが統一的。
- **テスト可能な設計**: `mergeAndSortActivities` を純粋関数として抽出し、`adapter.test.ts` で単体テスト。`formatRelativeTime` にもテストを追加。
- **スタイル分離の徹底**: 700行のスタイル定義が `styles.ts` に集約され、命名規則 `コンポーネント名_要素名` に準拠。
- **Storybook の充実**: 全6コンポーネント + ページ全体のストーリーを作成。Empty/Default/WithCompleted のバリエーション網羅。
- **セマンティックトークンの活用**: 新規トークン（`hero.*`, `notice.*`, `stats.*`, `badge.*`）を `semanticTokens.ts` に定義し、ハードコードを避けている。
- **セマンティックHTML**: `<section>`, `<h2>`, `<h3>`, `<table>`, `<hr>` を適切に使用。
- **`isNil` の使用**: `HeroSection.tsx` で `ramda` の `isNil` を使ったnullチェック。

## 総合所見

ダッシュボードのリデザインとして全体的なアーキテクチャは良好で、コンポーネント分離、型安全性、テスト、Storybookの整備が充実している。しかし **3つの必須修正事項** があるため **C評価** とする。

1. **`react-icons` の使用は即座に修正が必要**。lucide-react に統一し、新規依存を削除すべき。
2. **`adapter.ts:239` のタイムスタンプフォールバックバグ**は本番データで不正なソート結果を引き起こす可能性がある。
3. **`loading.tsx` のインラインスタイル**はPandaCSSパターンに移行すべき。スケルトン用のユーティリティスタイル定義を検討。

これらを修正すれば B評価（軽微な改善後マージ可能）に引き上げられる。
