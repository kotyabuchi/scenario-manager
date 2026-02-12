# ダッシュボード リニューアル計画

## Context

現在のホームページ (`src/app/(main)/home/`) は「参加予定のセッション」「新着シナリオ」の2セクションのみのシンプルな実装。`docs/designs/mocks/dashboard_pc/` と `dashboard_sp/` のHTMLモックに基づき、リッチなダッシュボードにリニューアルする。

**モックの全セクションを完全再現**する。DB連携可能な部分は実データ、不可能な部分（お知らせ等）はハードコードで対応。

**スコープ外**: requirements-v1.md に記載の「おすすめ」セクションは、レコメンドロジックの設計が未確定のため今回のスコープに含めない。将来対応として別途計画する。

## 決定事項

| 項目 | 決定 | 理由 |
|------|------|------|
| 統計カード | シナリオ数・プレイヤー数・完了セッション数 | キャンペーンテーブルは存在しないため完了セッション数で代替 |
| アクティビティ | 既存タイムスタンプから導出 | 専用ログテーブルなし。participants/sessions/scenariosのタイムスタンプを活用 |
| カレンダー | game_schedulesからセッション日程表示 | Client Componentで月ナビゲーション |
| お知らせ | ハードコード | データソースなし |
| ユーザーID解決 | page.tsxでDB user_idを取得してからadapterに渡す | auth.user.id (discord_id) != users.user_id (ULID) |
| アイコン | lucide-react（Material Icons不使用） | プロジェクトルール |
| レイアウト | PC: 12列Grid (8+4), SP: 1列 | モック準拠 |

## 前提条件

なし。必要なDBテーブルは全て存在する。

---

## Batch 1: データ層 (adapter.ts + interface.ts)

### Step 1-1. interface.ts に新しい型を追加

**対象**: `src/app/(main)/home/interface.ts`

追加する型:
- `DashboardStats` - scenarioCount, playerCount, completedSessionCount
- `ActivityItem` - id, type (participant_joined | scenario_updated | session_completed | review_created), description, actorName, targetName, timestamp
- `CalendarSessionDate` - scheduleDate, sessionId, sessionName
- 各コンポーネントのProps型 (HeroSectionProps, StatsSectionProps, ActivityTimelineProps, MiniCalendarProps)
- 既存の `UpcomingSession` に `schedule` フィールド追加 (GameScheduleRow | null)

### Step 1-2. adapter.ts に新しいクエリを追加

**対象**: `src/app/(main)/home/adapter.ts`

追加する関数:
1. **`getDashboardUser(authId: string)`** - users テーブルから nickname, image, user_id を取得 (WHERE discord_id = authId)。React `cache()` でラップし、同一リクエスト内での layout.tsx との重複呼び出しを排除する
2. **`getDashboardStats(userId: string)`** - 3つの COUNT クエリを Promise.all で並列実行
   - `scenarios` WHERE `created_by_id = userId` → シナリオ数
   - 自分が keeper（GM）を務めた `game_sessions` の session_id を取得し、その `session_participants` の DISTINCT user_id をカウント → プレイヤー数（自分がGMとして迎えたユニークプレイヤー数）
   - `game_sessions` WHERE `keeper_id = userId AND session_phase = 'COMPLETED'` → 完了セッション数
3. **`getRecentActivity(userId: string)`** - 複数テーブルから最近の活動を取得・マージ・timestamp降順ソート (上限5件)
   - session_participants.applied_at → 「〇〇さんが参加」
   - scenarios.updated_at → 「シナリオ更新」
   - game_sessions (COMPLETED) → 「セッション完了」
   - user_reviews.created_at → 「レビュー投稿」
4. **`getSessionDatesForRange(userId: string, startDate: string, endDate: string)`** - game_schedules + game_sessions + session_participants から指定期間のセッション日程を一括取得。startDate/endDate は ISO日付文字列（例: "2026-01-01"）。page.tsx から当月±1ヶ月の3ヶ月分を1回の呼び出しで取得する

既存関数の修正:
- `getUpcomingSessions` の select に `schedule:game_schedules(*)` を追加し、日程データも含める
- `getUpcomingSessions` の `.or()` フィルタを修正: 現在の実装は `game_session_id.in.(...),session_phase.eq.RECRUITING,...` がフラットにOR結合されており、ユーザーが参加していないセッションも返すバグがある。`.in('game_session_id', sessionIds)` と `.in('session_phase', ['RECRUITING', 'PREPARATION', 'IN_PROGRESS', 'COMPLETED'])` のAND結合に修正する。COMPLETEDセッションも取得対象に含め、UI側で視覚的に区別する（Step 3-3参照）

### Step 1-3. formatRelativeTime ユーティリティ追加

**対象**: `src/lib/formatters.ts`

`formatRelativeTime(isoDateString: string): string` 関数を追加。計算は UTC ベースで統一（サーバーサイド専用、Supabase のタイムスタンプは ISO 8601/UTC）:
- < 1分: "たった今"
- < 1時間: "N分前"
- < 24時間: "N時間前"
- 1日前: "昨日"
- < 7日: "N日前"
- < 30日: "N週間前"
- それ以上: "N月前" or 日付表示

---

## Batch 2: セマンティックトークン追加

### Step 2-1. semanticTokens.ts にダッシュボード用トークンを追加

**対象**: `src/styles/semanticTokens.ts`

以下のセマンティックトークンを新規追加する:

```typescript
hero: {
  gradient: {
    from: { value: '{colors.primary.700}' },  // コントラスト4.5:1以上を確保
    to: { value: '{colors.primary.600}' },
  },
},
stats: {
  blue: { value: '{colors.blue.100}' },
  green: { value: '{colors.primary.100}' },
  amber: { value: '{colors.orange.100}' },  // amber未定義のためorange.100で代替
  iconBlue: { value: '{colors.blue.600}' },
  iconGreen: { value: '{colors.primary.600}' },
  iconAmber: { value: '{colors.orange.600}' },
},
```

既存トークンで対応済み: `bg.card`, `text.title`, `text.secondary`, `card.default`, `card.hover`, `overlay.light`

---

## Batch 3: コンポーネント群

**styles.ts の方針**: 各コンポーネントの実装時に、対応するスタイルを `src/app/(main)/home/styles.ts` へ段階的に追加する。命名規則は `sectionName_elementName`（camelCase + アンダースコア区切り）。まずページレイアウト用スタイル（`pageContainer`, `pageGrid`, `mainColumn`, `sidebarColumn`）を Step 3-1 で定義し、以降の各 Step で使用するスタイルを順次追加する。

### Step 3-1. HeroSection.tsx 作成（サーバーコンポーネント）

**新規**: `src/app/(main)/home/_components/HeroSection.tsx`

**styles.ts に追加**: ページレイアウト (`pageContainer` maxW 1280px mx auto px 6 py 8, `pageGrid` CSS Grid lg:grid-cols-12 gap-8, `mainColumn` lg:col-span-8 flex col gap-10, `sidebarColumn` lg:col-span-4 flex col gap-8) + ヒーロー (`hero_container` flex md:flex-row gap 6, `hero_title` text 3xl bold text.title, `hero_subtitle` text.secondary, `hero_countdownCard` gradient bg (トークン hero.gradient.from/to) white text rounded-2xl shadow, `hero_countdownDays` bg overlay.light rounded-xl backdrop-blur)

- h1 "ようこそ、{name}さん" + p サブタイトル
- カウントダウンカード (nextSession が存在する場合のみ):
  - primary グラデーション背景 + 装飾円
  - 「次のセッション」ラベル (Calendar アイコン)
  - セッション名
  - 日程バッジ (Clock アイコン)
  - カウントダウン表示 (サーバーサイド計算):
    - N > 0: 「あとN日」
    - N = 0 (当日): 「今日」
    - N < 0 (過去日): カウントダウン非表示、日程バッジのみ表示
- nextSession が null → 歓迎メッセージのみ表示

### Step 3-2. StatsSection.tsx 作成（サーバーコンポーネント）

**新規**: `src/app/(main)/home/_components/StatsSection.tsx`

**styles.ts に追加**: `stats_grid` (3列/SP横スクロール snap-x), `stats_card`, `stats_iconCircle`, `stats_value`, `stats_label`

3つの統計カード:
1. シナリオ数 - `BookOpen` アイコン (lucide), 青背景円
2. プレイヤー数 - `Users` アイコン (lucide), 緑背景円
3. 完了セッション数 - `Trophy` アイコン (lucide), amber背景円

SP: 横スクロール + snap-x

### Step 3-3. UpcomingSessions.tsx 大幅リデザイン

**対象**: `src/app/(main)/home/_components/UpcomingSessions.tsx`

**styles.ts に追加**: `sessions_header`, `sessions_accentBar`, `sessions_card`, `sessions_thumbnail`, `sessions_badge`, `sessions_avatarGroup`, `sessions_date`

- セクションヘッダー: 緑アクセントバー + 「予定されているセッション」 + 「すべて見る」リンク
- 各セッションカード:
  - サムネイル画像 (scenario.scenarioImageUrl, fallbackプレースホルダー)
  - ステータスバッジ: RECRUITING→success「募集中」, PREPARATION→warning「準備中」, COMPLETED→neutral「終了」
  - システム名ラベル
  - セッション名
  - 参加者アバターグループ (先頭3名 + "+N" オーバーフロー)
  - 日時表示
- 終了セッション: opacity 0.75, グレースケールサムネイル, 取り消し線タイトル

### Step 3-4. ActivityTimeline.tsx 作成（サーバーコンポーネント）

**新規**: `src/app/(main)/home/_components/ActivityTimeline.tsx`

**styles.ts に追加**: `activity_container`, `activity_timelineLine`, `activity_item`, `activity_iconCircle`, `activity_text`, `activity_timestamp`

- セクションヘッダー: アクセントバー + 「最近のアクティビティ」
- カードコンテナ + 縦タイムライン線
- 各アイテム:
  - type別アイコン円: participant_joined→`UserPlus`/青, scenario_updated→`Pencil`/amber, session_completed→`CheckCircle`/緑, review_created→`Bookmark`/gray
  - 説明テキスト (primary色でアクター名ハイライト)
  - 相対時間 (formatRelativeTime使用)
- 空の場合: 「最近のアクティビティはありません」

### Step 3-5. QuickActions.tsx 作成（サーバーコンポーネント）

**新規**: `src/app/(main)/home/_components/QuickActions.tsx`

**styles.ts に追加**: `quickActions_container`, `quickActions_primaryButton`, `quickActions_secondaryButton`

- 「クイックアクション」見出し
- Primary ボタン: 「シナリオを登録する」→ `/scenarios/new` (FileEdit + ArrowRight アイコン)
- Secondary ボタン: 「セッションを作成」→ `/sessions/new` (PlusSquare + Plus アイコン)
- SP: 2列グリッドでインライン配置（サイドバーではなくメインフロー内）

### Step 3-6. MiniCalendar.tsx 作成（クライアントコンポーネント）

**新規**: `src/app/(main)/home/_components/MiniCalendar.tsx`

**styles.ts に追加**: `calendar_container`, `calendar_header`, `calendar_dayHeaders`, `calendar_dayCell`

- `'use client'` - 月ナビゲーション用 useState
- props: sessionDates (3ヶ月分、サーバーから一括渡し)
- 7列グリッドカレンダー (日〜土)
- 月/年表示 + prev/next ボタン (ChevronLeft, ChevronRight)
- セッション日: primary色ドット表示
- 月外日: 薄いグレー
- aria-label 対応

### Step 3-7. SystemNotice.tsx 作成（サーバーコンポーネント）

**新規**: `src/app/(main)/home/_components/SystemNotice.tsx`

**styles.ts に追加**: `notice_container`, `notice_title`

- 「お知らせ」見出し
- ハードコードの通知カード (info系背景色, ボールドタイトル + 説明テキスト)

---

## Batch 4: ページ組み立て

### Step 4-1. page.tsx 全面書き換え

**対象**: `src/app/(main)/home/page.tsx`

データ取得フロー:
```
1. const authUser = await supabase.auth.getUser()
2. const dbUserResult = await getDashboardUser(authUser.id)  // discord_id → user_id
3. const dbUser = dbUserResult.data
4. Promise.all([
     getUpcomingSessions(dbUser.userId),
     getNewScenarios(),
     getDashboardStats(dbUser.userId),
     getRecentActivity(dbUser.userId),
     getSessionDatesForRange(dbUser.userId, startOfPrevMonth, endOfNextMonth),  // 当月±1ヶ月の3ヶ月分
   ])
```

レイアウト:
```html
<pageContainer>
  <HeroSection userName={nickname} nextSession={sessions[0]} />
  <pageGrid>
    <mainColumn>
      <StatsSection stats={stats} />
      <UpcomingSessions sessions={sessions} />
      <ActivityTimeline activities={activities} />
      <NewScenarios scenarios={scenarios} />
    </mainColumn>
    <sidebarColumn>
      <QuickActions />
      <MiniCalendar sessionDates={calendarDates} />
      <SystemNotice />
    </sidebarColumn>
  </pageGrid>
</pageContainer>
```

SP表示順制御: CSS `order` プロパティで全コンポーネントの表示順を制御:
1. Hero (order: 1)
2. Stats (order: 2)
3. UpcomingSessions (order: 3)
4. ActivityTimeline (order: 4)
5. QuickActions (order: 5) — サイドバーからメインフローへ移動
6. NewScenarios (order: 6)
7. MiniCalendar (order: 7) — サイドバーからメインフロー下部へ移動
8. SystemNotice (order: 8) — 最下部

### Step 4-2. NewScenarios.tsx セクションヘッダー追加

**対象**: `src/app/(main)/home/_components/NewScenarios.tsx`

- アクセントバー + 「新着おすすめシナリオ」ヘッダー追加
- ScenarioCard の再利用は維持

---

## Batch 5: レスポンシブ & アクセシビリティ

### Step 5-1. レスポンシブ確認・調整

- lg ブレークポイント: 12列Grid ↔ 1列
- sm: セッションカード横並び ↔ 縦並び
- md: シナリオGrid 3列 ↔ 1列
- SP: stats横スクロール + snap、QA 2列グリッド

### Step 5-2. アクセシビリティ

- 見出し階層: h1(ようこそ) → h2(各セクション)
- カレンダー: aria-label, role="grid"
- アバター: alt テキスト
- Quick Actions: `<Link>` styled as button
- カラーコントラスト: WCAG AA (4.5:1 通常テキスト, 3:1 大テキスト)

---

## ファイル一覧

### 新規ファイル

| ファイル | 目的 |
|---------|------|
| `src/app/(main)/home/_components/HeroSection.tsx` | 歓迎 + カウントダウン |
| `src/app/(main)/home/_components/StatsSection.tsx` | 統計カード3枚 |
| `src/app/(main)/home/_components/ActivityTimeline.tsx` | タイムライン |
| `src/app/(main)/home/_components/QuickActions.tsx` | 登録・作成ボタン |
| `src/app/(main)/home/_components/MiniCalendar.tsx` | カレンダー (CC) |
| `src/app/(main)/home/_components/SystemNotice.tsx` | お知らせ |
| `src/lib/formatters.test.ts` | formatRelativeTime テスト |
| `src/app/(main)/home/adapter.test.ts` | adapter 関数テスト |

### 変更ファイル

| ファイル | 変更内容 |
|---------|---------|
| `src/app/(main)/home/page.tsx` | 全面書き換え |
| `src/app/(main)/home/adapter.ts` | 4関数追加 + 既存修正 |
| `src/app/(main)/home/interface.ts` | 型追加 |
| `src/app/(main)/home/styles.ts` | コンポーネントと同時に段階的追加 |
| `src/styles/semanticTokens.ts` | ダッシュボード用トークン追加 |
| `src/app/(main)/home/_components/UpcomingSessions.tsx` | デザイン大幅変更 |
| `src/app/(main)/home/_components/NewScenarios.tsx` | ヘッダー追加 |
| `src/lib/formatters.ts` | formatRelativeTime 追加 |

---

## 検証方法

### 自動テスト

新規テスト:
- `src/lib/formatters.test.ts` - `formatRelativeTime` のユニットテスト（各時間帯の境界値、エッジケース）
- `src/app/(main)/home/adapter.test.ts` - adapter 関数のテスト（`getDashboardStats`, `getRecentActivity`, `getSessionDatesForRange` の基本動作確認）

```bash
pnpm check           # lint + format
pnpm build           # ビルド確認
pnpm vitest          # 既存テスト + 新規テスト通過確認
```

### 手動確認
- [ ] PC: 12列グリッド (8+4) レイアウト
- [ ] SP: シングルカラム、正しいセクション順序
- [ ] カウントダウン: 「あとN日」の正確性
- [ ] 統計カード: DBデータの正確性
- [ ] セッション一覧: サムネイル・バッジ・アバター・日時表示
- [ ] アクティビティ: タイムスタンプ順、正しいアイコン
- [ ] カレンダー: 月ナビゲーション動作、セッション日ハイライト
- [ ] クイックアクション: リンク先正確
- [ ] 空データ: 各セクションの empty state
- [ ] キーボードナビゲーション
- [ ] カラーコントラスト (WCAG AA)
