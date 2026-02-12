# ダッシュボード リニューアル計画 レビューレポート

> **レビュー日時**: 2026-02-12
> **対象ファイル**: `docs/plans/dashboard-redesign.md`
> **総合評価**: B
>
> **反映ステータス**: 反映済み（2026-02-12）
> **反映内容**: 必須 4件 + 推奨 6件 + 検討 4件（全件反映）

## サマリー

HTMLモックに基づくダッシュボードリニューアルの計画は、全体的に構成が明確でBatch分割も適切。データ層→スタイル→コンポーネント→組み立ての順序は実装しやすい。ただし、データ取得の矛盾点、カラートークンのハードコード、テスト計画の欠如など、実装前に解消すべき課題がいくつか存在する。

## 評価詳細

### 1. 技術的妥当性 WARN

**良い点**:
- ユーザーID解決の問題（discord_id ≠ user_id）を正しく認識し、`getDashboardUser`で対処
- データ取得の`Promise.all`による並列化は適切
- MiniCalendarの3ヶ月分一括渡し方式でクライアント↔サーバー往復を削減する設計は良い

**問題点**:

1. **`getSessionDatesForMonth`の引数と「3ヶ月分」の矛盾**: 関数シグネチャは `(userId, year, month)` で単月だが、コメントで「3ヶ月分」と記載。page.tsxの疑似コードでも1回のみ呼び出し。3ヶ月分のデータ取得方法（関数を3回呼ぶ / 関数内で3ヶ月分取得する / 引数にrangeを追加する）が不明確。

2. **`getDashboardStats`の「プレイヤー数」定義が曖昧**: 「session_participantsのDISTINCT user_id (keeperとして関わったセッション) → プレイヤー数」は矛盾。session_participantsは参加者テーブルで、keeperとは異なる。以下のどちらかを明確化すべき:
   - (a) 自分がkeeper（GM）を務めたセッションの参加プレイヤー数 → `game_sessions WHERE keeper_id = userId` → そのsession_idで `session_participants` の DISTINCT user_id をカウント
   - (b) 自分が参加したセッションの総ユニークプレイヤー数 → 自分が参加した全セッションの `session_participants` のDISTINCT user_id

3. **既存`getUpcomingSessions`のクエリロジック問題**: 現在の`.or()`フィルタはセッションID条件とフェーズ条件をORで結合しており、ユーザーが参加していないセッションも返す可能性がある。計画ではselect修正のみ言及しているが、このバグも合わせて修正すべき。

4. **MainLayoutとの重複DB呼び出し**: `layout.tsx`が既に`discord_id → dbUser`を取得しているが、`page.tsx`でも`getDashboardUser`で同一クエリを実行する。React `cache()`やデータ共有の仕組みで最適化すべき。

### 2. 網羅性・考慮漏れ WARN

1. **要件定義の「おすすめ」セクション未対応**: requirements-v1.mdでは4セクション（今週の予定、新着シナリオ、おすすめ、最近の活動）が定義されている。計画ではstats/calendar/notice/quick-actionsを追加するが、「おすすめ」は実装されない。意図的な除外であれば計画に明記すべき。

2. **COMPLETED/CANCELLEDセッションの扱い**: UpcomingSessionsの計画では「終了セッション: opacity 0.75, グレースケールサムネイル」を記述しているが、現在のクエリはRECRUITING/PREPARATION/IN_PROGRESSのみ取得。COMPLETEDセッションを表示するにはクエリの修正が必要。

3. **エラーハンドリング**: 新規adapter関数（4つ）にResult型パターンを使う旨の記載がない。既存パターン準拠なら問題ないが明記が望ましい。

4. **カウントダウン計算のエッジケース**: 「あとN日」のサーバーサイド計算で、当日（0日）のケースや過去日のケースの表示が未定義。

### 3. セキュリティ OK

- 認証チェックは既存のpattern（`supabase.auth.getUser()`）を踏襲
- `getDashboardUser`で`discord_id`から`user_id`を解決するフローは適切
- 全データ取得がサーバーサイド（Server Component）で実行され、クライアントにクエリが露出しない
- ハードコードのお知らせは静的データであり、セキュリティリスクなし

### 4. UX・アクセシビリティ WARN

**良い点**:
- 見出し階層（h1→h2）が明記されている
- カレンダーのaria-label、role="grid"が計画されている
- アバターのalt属性が言及されている
- WCAG AAカラーコントラスト確認が検証項目に含まれている

**問題点**:

1. **SP表示順のCalendar/Noticeの位置が未定義**: 計画のSP表示順は「Hero → Stats → Activity → QuickActions → Sessions → Scenarios」だが、MiniCalendarとSystemNoticeのSP配置が記載されていない。SPモックを見ると、Calendarはページ下部に配置されているようだが明記が必要。

2. **Quick Actionsの`<Link>` styled as button**: リンク先がページ遷移（`/scenarios/new`, `/sessions/new`）なので`<Link>`は正しいが、ボタン風スタイルは`role`属性の明示がないとスクリーンリーダーに混乱を与える可能性。実際にはArkUI Buttonの`asChild`パターンで`<Link>`をラップするのが既存パターンに合致する。

3. **カウントダウンカードのカラーコントラスト**: グラデーション背景 + 白テキストのコントラスト比が4.5:1を満たすかの検証が必要。primary.500の白テキストは不合格（2.51:1）であることが既知。primary.600以上であれば改善するが、グラデーションの明るい側でコントラスト不足になる可能性。

### 5. 保守性・拡張性 OK

- コンポーネント分割（1ファイル1コンポーネント）はプロジェクト規約に準拠
- styles.tsの命名規則（`sectionName_elementName`）はcoding-standards.mdに準拠
- MiniCalendarのみClient Componentに分離し、他はServer Componentで統一する設計は適切
- 新しい型定義をinterface.tsに集約する方針は既存パターンと整合

### 6. プロジェクト整合性 WARN

1. **カラーハードコード**: 計画内の以下の色指定はstyling-rules.md（「ハードコードされた値を直接スタイルに書かない」）に抵触:
   - `hero_countdownCard`: `gradient bg (primary.600 → primary.500)` — CSS gradientはsemantic tokenで表現しにくいが、少なくともtokenの参照値を使うべき
   - `hero_countdownDays`: `bg white/10` — `overlay`系トークンを使うか新規定義が必要
   - `backdrop-blur` — これ自体はCSS propertyなので問題ないが、値のトークン化を検討

2. **`amber`色の不在**: StatsSection計画で「amber背景円」と記載しているが、プロジェクトのカラーパレットに`amber`は未定義。`orange`系トークンを使うか、新規追加が必要。semanticTokens.tsに追加する場合はStep 2-2で明記すべき。

3. **`formatRelativeTime`のロケール**: 日本語表示（「N分前」「昨日」等）だが、将来のi18n対応は考慮不要か。現状はハードコードで問題ないが判断を記載すべき。

### 7. 実行可能性 WARN

1. **テスト計画の欠如**: 6個の新規ファイルと7個の変更ファイルに対して、新規テストの作成が計画に含まれていない。TDD workflowでは最低限`formatRelativeTime`のユニットテストと、adapter関数のテストが必要。手動確認のみでは品質保証が不十分。

2. **Batch間の暗黙的依存**: Batch 2（styles.ts）はBatch 3（コンポーネント群）で使用されるスタイルを定義するため、Batch 3の実装要件が固まっていない段階でstyles.tsを「全面書き換え」すると、Batch 3実装中に頻繁な修正が発生する。styles.tsはコンポーネントと同時に段階的に追加する方が効率的。

3. **Step 2-2の曖昧さ**: 「既存トークンでカバー可能か確認し、不足があれば追加」は実行可能な手順ではない。具体的に不足するトークン（gradient用、amber/gold用等）を列挙すべき。

## 改善提案

### 必須（実装前に対処すべき）

| # | 視点 | 指摘事項 | 推奨対応 |
|---|------|---------|---------|
| 1 | 技術的妥当性 | `getSessionDatesForMonth`の「3ヶ月分」取得方法が未定義 | 関数を`getSessionDatesForRange(userId, startDate, endDate)`に変更するか、page.tsxで3回呼び出す方針を明記 |
| 2 | 技術的妥当性 | 「プレイヤー数」の定義が矛盾 | keeper対象か参加者対象か明確化し、クエリ仕様を修正 |
| 3 | 技術的妥当性 | 既存`getUpcomingSessions`の`.or()`クエリバグ | `.in()`フィルタのみに修正し、フェーズフィルタを削除または適切にANDで結合 |
| 4 | プロジェクト整合性 | gradient/white10等のカラーハードコード | semantic tokenを新規追加するか、既存トークンの組み合わせで表現する方針を決定 |

### 推奨（対応が望ましい）

| # | 視点 | 指摘事項 | 推奨対応 |
|---|------|---------|---------|
| 1 | 実行可能性 | 新規テスト計画なし | `formatRelativeTime`のユニットテスト、adapter関数の最低限のテストを計画に追加 |
| 2 | 網羅性 | COMPLETEDセッション表示のクエリ未修正 | UpcomingSessionsで表示するフェーズの範囲とクエリを明記 |
| 3 | 技術的妥当性 | MainLayoutとの重複DB呼び出し | `getDashboardUser`にReact `cache()`を適用するか、layout.tsxの取得関数を共通化 |
| 4 | UX | SP表示でのCalendar/Noticeの位置未定義 | SPモックに合わせてCSS `order`値を全コンポーネント分記載 |
| 5 | プロジェクト整合性 | `amber`色がカラーパレットに未定義 | `orange`系を使うか、Step 2-2でamber系トークン追加を明記 |
| 6 | 実行可能性 | styles.ts全面書き換え後のコンポーネント実装時の手戻り | Batch 2をBatch 3に統合し、コンポーネントとスタイルを同時に実装するか、styles.tsをコンポーネント単位で段階追加 |

### 検討（余裕があれば）

| # | 視点 | 指摘事項 | 推奨対応 |
|---|------|---------|---------|
| 1 | 網羅性 | requirements-v1の「おすすめ」セクション未実装 | 今回のスコープ外として明記するか、将来対応のTODOとして計画に注記 |
| 2 | 網羅性 | カウントダウンの当日・過去日ケース未定義 | 当日=「今日」、過去=非表示など、エッジケース仕様を追記 |
| 3 | UX | カウントダウンカードのgradient上コントラスト | primary.700→primary.600のgradientに変更して4.5:1を確実にクリア |
| 4 | 保守性 | `formatRelativeTime`の時間計算精度 | タイムゾーン考慮（サーバーサイドのみなので問題は限定的だが）、UTCベースの計算を明記 |

## 総合所見

計画全体のアーキテクチャ設計は堅実で、Batch分割もデータ層→UI層→統合の順で合理的。ユーザーID解決問題（discord_id vs user_id）の認識と対処は適切であり、これは既存コードのバグ修正にもつながる。Server Component中心の設計でパフォーマンスを意識している点も良い。

主な改善点は「曖昧な仕様の具体化」に集約される。特に「3ヶ月分のカレンダーデータ取得方法」「プレイヤー数の定義」「カラートークンの扱い」は実装時に手戻りを招くため、計画段階で解決すべき。テスト計画の追加も、プロジェクトのTDDワークフローを鑑みると強く推奨される。

必須指摘4件を解消すれば、実装に着手可能な品質に達する。
