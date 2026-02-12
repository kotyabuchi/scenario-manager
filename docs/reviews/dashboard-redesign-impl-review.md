# ダッシュボード リニューアル 実装レビュー

> **反映ステータス**: 反映済み（2026-02-12）
> **反映内容**: 必須 1件 + 推奨 5件（推奨1,2,3,4,5） + 検討 0件

> **レビュー日時**: 2026-02-12
> **対象計画**: `docs/plans/dashboard-redesign.md`
> **計画充足度**: 85% (11/13 Steps)
> **サービス品質**: B

## サマリー

計画13ステップのうち11ステップが完了、2ステップがスコープ外として除外（StatsSection、QuickActions）。データ層・ヒーロー・セッション一覧・アクティビティ・カレンダー・お知らせの主要コンポーネントは高品質で実装済み。ActivityTimelineでは`lucide-react`にfillアイコンがないため`react-icons/io5`を追加導入しており、技術的妥当性のある判断。残る改善点はrgba()ハードコードのトークン化、SP表示順のorder適用、Suspense/loading.tsx追加など。

---

## Part A: 計画充足度

### Batch 1: データ層 (adapter.ts + interface.ts)

| Step | 仕様 | 状態 | 備考 |
|------|------|:----:|------|
| 1-1 | interface.ts に新しい型を追加 | DONE | ActivityItem, CalendarSessionDate, Props型群すべて実装済み。`DashboardStats`/`StatsSectionProps`はスコープ外除外に伴い不要 |
| 1-2 | adapter.ts に新しいクエリを追加 | DONE | `getDashboardUser`（cache付き）、`getRecentActivity`、`getSessionDatesForRange`実装済み。`getUpcomingSessions`の`.in()`修正も完了。`getDashboardStats`はスコープ外除外に伴い不要 |
| 1-3 | formatRelativeTime ユーティリティ追加 | DONE | 仕様通りの時間帯分類を実装。UTCベース計算も対応済み |

### Batch 2: セマンティックトークン追加

| Step | 仕様 | 状態 | 備考 |
|------|------|:----:|------|
| 2-1 | semanticTokens.ts にダッシュボード用トークン追加 | DONE | `hero.gradient.from/to`、`stats.*`トークンが計画通り追加済み |

### Batch 3: コンポーネント群

| Step | 仕様 | 状態 | 備考 |
|------|------|:----:|------|
| 3-1 | HeroSection.tsx 作成 | DONE | カウントダウン計算、当日/過去日のエッジケース対応、日程フォーマットすべて実装済み |
| 3-2 | StatsSection.tsx 作成 | N/A | スコープ外として除外（実装途中で不要と判断） |
| 3-3 | UpcomingSessions.tsx リデザイン | DONE | バッジ（4フェーズ）、サムネイル、アバターグループ、完了セッションの視覚的区別すべて実装 |
| 3-4 | ActivityTimeline.tsx 作成 | DONE | 機能実装済み。lucide-reactにfillアイコンがないため`react-icons/io5`を追加導入（技術的判断） |
| 3-5 | QuickActions.tsx 作成 | N/A | スコープ外として除外（実装途中で不要と判断） |
| 3-6 | MiniCalendar.tsx 作成 | DONE | Client Component、月ナビゲーション、セッション日ドット表示、aria-label対応すべて完了 |
| 3-7 | SystemNotice.tsx 作成 | DONE | ハードコード通知、info系背景色で実装済み |

### Batch 4: ページ組み立て

| Step | 仕様 | 状態 | 備考 |
|------|------|:----:|------|
| 4-1 | page.tsx 全面書き換え | PARTIAL | StatsSection/QuickActionsはスコープ外除外に伴い省略。サイドバーにCalendar+Noticeを統合カードとして配置（計画と異なるがUX上は合理的）。SP表示順のorder適用なし |
| 4-2 | NewScenarios.tsx セクションヘッダー追加 | DONE | アクセントバー + ヘッダー + 「すべて見る」リンク追加済み |

### Batch 5: レスポンシブ & アクセシビリティ

| Step | 仕様 | 状態 | 備考 |
|------|------|:----:|------|
| 5-1 | レスポンシブ確認・調整 | PARTIAL | Grid 12列↔1列は実装済み。SP用orderスタイルは`styles.ts`に定義されているが`page.tsx`で未使用。stats横スクロールはStatsSection未実装のため評価不可 |
| 5-2 | アクセシビリティ | PARTIAL | 見出し階層（h1→h2→h3）は正しい。カレンダーの`aria-label`あり。ただし計画のカレンダー`role="grid"`は未実装 |

### 計画レビュー指摘の対応状況

`docs/reviews/dashboard-redesign-review.md` に基づく:

| # | 指摘事項 | 対応状態 |
|---|---------|---------|
| 必須1 | `getSessionDatesForMonth`の3ヶ月分取得方法 | 対応済: `getSessionDatesForRange(userId, startDate, endDate)`に変更 |
| 必須2 | プレイヤー数の定義が矛盾 | N/A: StatsSection自体がスコープ外除外 |
| 必須3 | `getUpcomingSessions`の`.or()`クエリバグ | 対応済: `.in()`で正しくAND結合 |
| 必須4 | gradient/white10のカラーハードコード | 部分対応: gradient用トークン追加済み。ただし`hero_countdownDate`/`hero_countdownDays`に`rgba()`ハードコードが残存 |
| 推奨1 | テスト計画追加 | 部分対応: `formatRelativeTime`テストあり。adapter/コンポーネントテストなし |
| 推奨2 | COMPLETEDセッション表示 | 対応済: クエリ修正+UI視覚的区別実装 |
| 推奨3 | MainLayoutとの重複DB呼び出し | 対応済: `getDashboardUser`にReact `cache()`適用 |
| 推奨4 | SP表示でのCalendar/Noticeの位置 | 部分対応: orderスタイル定義済みだが未適用 |
| 推奨5 | `amber`色未定義 | 対応済: `orange`系で代替するトークン追加 |
| 推奨6 | styles.tsの段階的追加 | 対応済: コンポーネントと同時にスタイル追加 |
| 検討1 | おすすめセクション | 対応済: 計画にスコープ外と明記 |
| 検討2 | カウントダウンの当日・過去日 | 対応済: 当日=「!今日」、過去=カウントダウン非表示 |
| 検討3 | gradientコントラスト | 対応済: primary.700→600のgradient |
| 検討4 | formatRelativeTimeのUTC計算 | 対応済: JSDocでUTCベース明記 |

---

## Part B: サービス品質

### B1. エラーハンドリング OK

- すべてのadapter関数が`Result<T>`型を返し、`try-catch`で包んでいる
- `page.tsx`で各Result の`.success`チェックを行い、失敗時はフォールバック（空配列）を返している
- `isNil`によるnullチェックが適切に使用されている（HeroSection, UpcomingSessions）
- `getDashboardUser`失敗時に`return null`で安全にフォールバック

### B2. エッジケース・空状態 OK

- UpcomingSessions: 0件時に「参加予定のセッションはまだありません」+ 公開卓を探すリンク
- NewScenarios: 0件時に「新着シナリオはまだありません」
- ActivityTimeline: 0件時に「最近のアクティビティはありません」
- HeroSection: nextSessionがnull時は歓迎メッセージのみ、scheduleDate=null時はカウントダウンカード非表示
- カウントダウン: 当日（daysUntil=0）は「今日」、過去日（daysUntil<0）はカード非表示

### B3. ローディング・Suspense WARN

- page.tsxが全データを`Promise.all`で並列取得してから一括描画。Suspenseバウンダリやストリーミングの分離なし
- データ取得が遅い場合、ページ全体が白画面になるリスクあり
- `loading.tsx`やスケルトンUIが未作成

**推奨**: 重いデータ（activity、calendar）をSuspenseで分離するか、`loading.tsx`でスケルトンを表示

### B4. セキュリティ OK

- `supabase.auth.getUser()`による認証チェックあり
- `getDashboardUser`でdiscord_id→user_idの解決を経由してデータ取得
- すべてのデータ取得がServer Component内で実行。クライアントにクエリやuser_idが露出しない
- MiniCalendarはClient ComponentだがsessionDatesのみを受け取り、認証情報は含まない

### B5. パフォーマンス WARN

- `getRecentActivity`で**6回のDB呼び出し**が発生（keeper sessions → user scenarios → 4種類の活動データ）。前2つはPromise.allの外で逐次実行されており、最適化の余地あり
- page.tsxの4つのadapter呼び出しは`Promise.all`で並列化されている（適切）
- `getDashboardUser`にReact `cache()`が適用されており、layout.tsxとの重複排除済み（適切）
- 各adapter関数で毎回`createDbClient()`を呼んでいる点は既存パターンに準拠

**推奨**: `getRecentActivity`内のkeeper/scenario取得をPromise.allに統合して並列化

### B6. アクセシビリティ WARN

- 見出し階層: h1（ようこそ）→ h2（各セクション）→ h3（カレンダー、お知らせ）で正しい
- カレンダー: `aria-label="セッションカレンダー"`、ナビボタンに`aria-label="前の月"/"次の月"`あり
- アバター: Image要素にalt属性（ニックネーム）あり
- 計画で指定された`role="grid"`がカレンダーに未適用
- セッションカードがLink要素でラップされているが、内部のh3に`id`がなくnav補助が不十分

**指摘**: カレンダーグリッドに`role="grid"`と`role="row"`/`role="gridcell"`を追加すべき

### B7. テストカバレッジ WARN

- `formatRelativeTime`: ユニットテスト完備（8ケース、境界値含む）
- adapter.test.ts: 計画に記載されていたが**未作成**
- Storybook: 6ファイル作成済み（HeroSection, UpcomingSessions, ActivityTimeline, MiniCalendar, SystemNotice, Dashboard）
- E2Eテスト: ダッシュボード専用のテストなし（既存のhome.spec.tsが存在する可能性はあるが未確認）

**推奨**: adapter関数の基本動作テスト（特に`getRecentActivity`のマージ・ソートロジック）を追加

### B8. プロジェクト規約準拠 WARN

1. **`react-icons/io5` の追加導入**: `icons.md`ルールでは`lucide-react`を指定しているが、lucide-reactにfillアイコンがないため`react-icons/io5`を追加。技術的に妥当な判断だが、`icons.md`に例外として明記しておくと良い
2. **`hero_countdownDate`/`hero_countdownDays`にrgba()ハードコード**: `styling-rules.md`では「ハードコードされた値を直接スタイルに書かない」。overlay系トークンまたは新規トークンの定義が必要
   - `rgba(0,0,0,0.1)` → `overlay.backdrop`等
   - `rgba(255,255,255,0.1)` → `overlay.light`等の薄い版
   - `rgba(255,255,255,0.2)` → 同上
   - `rgba(255,255,255,0.9)` → `overlay.light`に近いが微妙に異なる
3. **`notice_card`に`color-mix()`ハードコード**: `[color-mix(in oklch, token(colors.info.100) 50%, transparent)]`
4. **`sidebarDivider`に`token(colors.gray.100)`直接参照**: セマンティックトークン（`border.subtle`等）を使用すべき
5. **スタイル名の命名**: `emptyState`、`emptyStateIcon`、`emptyStateText`が`コンポーネント名_要素名`形式でない（共有スタイルとして意図的かもしれないが明記なし）

---

## 改善提案

### 必須（リリース前に対処すべき）

| # | 種別 | ファイル | 指摘事項 | 推奨対応 |
|---|------|---------|---------|---------|
| 1 | Part B8 | `styles.ts` | 4箇所でrgba()がハードコード（hero_countdownDate, hero_countdownDays） | overlayトークンの拡張、または新規ダッシュボード用トークンを定義 |

### 推奨（対応が望ましい）

| # | 種別 | ファイル | 指摘事項 | 推奨対応 |
|---|------|---------|---------|---------|
| 1 | Part B3 | `page.tsx` | Suspense/ストリーミングなし。データ取得完了まで白画面 | `loading.tsx`追加、または重いセクションをSuspenseで分離 |
| 2 | Part B5 | `adapter.ts` | `getRecentActivity`で6回のDB呼び出し（うち2回が逐次） | keeper/scenario取得をPromise.allに統合して並列化 |
| 3 | Part A | `page.tsx` | SP表示順のorderスタイルが定義済みだが未適用 | Gridの各セクションにorderスタイルを適用 |
| 4 | Part B6 | `_components/MiniCalendar.tsx` | カレンダーに`role="grid"`が未適用（計画Step 5-2で指定） | グリッドコンテナに`role="grid"`を追加 |
| 5 | Part B7 | （未作成） | adapter.test.ts が計画で予定されていたが未作成 | `getRecentActivity`のマージ・ソートロジックのテスト追加 |
| 6 | Part B8 | `styles.ts` | `notice_card`に`color-mix()`、`sidebarDivider`に`token()`直接参照 | セマンティックトークンで表現 |

### 検討（余裕があれば）

| # | 種別 | ファイル | 指摘事項 | 推奨対応 |
|---|------|---------|---------|---------|
| 1 | Part A | `page.tsx` | サイドバーのCalendar+Noticeが統合カード化（計画と異なる） | UX上は合理的だが、計画との差異を認識しておく |
| 2 | Part B6 | `_components/UpcomingSessions.tsx` | セッションカード内のh3にidがない | ナビゲーション補助のためaria-labelledbyの検討 |
| 3 | Part B5 | `adapter.ts` | getRecentActivity内で各テーブル5件ずつ取得→マージ後5件に切り詰め | 最終的に5件しか使わないため、各テーブル3件で十分な場合が多い |

---

## 良い点

- **Result型の一貫した使用**: すべてのadapter関数がResult型を返し、page.tsxで統一的にエラーハンドリングしている
- **React cache()の適用**: getDashboardUserにcache()を適用し、layout.tsxとの重複DB呼び出しを効率的に排除
- **エッジケースの丁寧な処理**: HeroSectionのカウントダウン（当日/過去日）、空状態のUI、nullチェック（isNil）が網羅的
- **セマンティックトークンの活用**: 大部分のスタイルでセマンティックトークンを使用しており、デザインシステムとの整合性が高い
- **UpcomingSessionsのクエリバグ修正**: 計画レビューで指摘された`.or()`の問題を`.in()`+`.in()`のAND結合に正しく修正
- **Storybookの充実**: 6コンポーネントにStorybookストーリーが作成されており、ビジュアルテストの基盤が整っている
- **MiniCalendarのアクセシビリティ**: aria-labelやボタンのaria-labelが適切に設定されている

## 総合所見

ダッシュボードリニューアルの主要セクション（ヒーロー、セッション一覧、アクティビティ、カレンダー、お知らせ、新着シナリオ）は高品質で実装されている。計画13ステップ中11ステップが完了し、2ステップ（StatsSection/QuickActions）はスコープ外として除外。実装済み部分のコード品質は良好で、Result型・cache()・isNilの一貫した使用、Storybookの充実など、プロジェクト規約への準拠度も高い。

残る改善点はrgba()ハードコードのトークン化が主で、修正すればサービス品質Aに到達可能。

**次のアクション**:
1. rgbaハードコードをセマンティックトークン化
2. SP表示順のorder適用
3. loading.tsx or Suspense追加（推奨）
4. icons.mdに`react-icons`の例外ケースを追記（推奨）
