# セッション日程調整（可用枠提出 + 複数枠確定）リデザイン計画 レビューレポート

> **反映ステータス**: 反映済み（2026-02-26）
> **反映内容**: 必須 2件 + 推奨 10件 + 検討 6件
> **反映先**: `docs/plans/session-availability-confirmation-redesign.md`

> **レビュー日時**: 2026-02-26（第2回レビュー）
> **対象ファイル**: `docs/plans/session-availability-confirmation-redesign.md`
> **総合評価**: B

## サマリー

前回レビュー（2026-02-26 第1回）の指摘を反映し、型導出のSSoT準拠・RLSポリシー設計・Review Checkpoint・ファイル一覧・検証方法が追加された。計画全体の完成度は高い。ただし、**Batch 2 Step 2-3 が Batch 3 に前方依存**している点が未解消であり、実行順序に問題がある。また、UIアーキテクチャで言及された `AvailabilitySlotEditor` のBatch割り当てが欠落しており、一部のエッジケース（0件提出時、`minPlaytimeMinutes = null`）の明文化が不十分。これらは軽微な修正で解決可能であり、反映すれば実装に着手できる。

## 評価詳細

### 1. 技術的妥当性 WARN

**良い点**:
- Supabase生成型をSSoTとし、UI ViewModel のみ独自定義を許容する型設計が `typescript-rules.md` に完全準拠
- `current_app_user_id()` SQL関数でRLS式を再利用する設計はDRYで保守性が高い
- 集計ロジックを純関数として分離し、単体テスト＋ベンチマークで品質担保する方針は堅実
- 楽観的更新（`useOptimistic` + `useTransition`）は `react-rules.md` 準拠
- パフォーマンス基準（参加者10人 × 各20枠 → 500ms以内）が明記されている

**指摘事項**:

| # | 深刻度 | 指摘 |
|---|--------|------|
| 1 | 必須 | **Batch 2 Step 2-3 が Batch 3 に前方依存**。Step 2-3「おすすめ取得 Adapter」は明示的に「Batch 3 の純関数呼び出し」と記載しているが、Batch 3 は未実装。Batch 実行は順次であるため、Step 2-3 を Batch 3 の後（例: Batch 3 末尾に移動）にすべき |
| 2 | 推奨 | combo 推薦の母集団サイズ `N` が未定義。`MAX_SINGLE_CANDIDATES_FOR_COMBO = 10` 等の定数を「実装前の最終確認事項」に追加すべき |
| 3 | 検討 | `current_app_user_id()` SQL関数の `SECURITY DEFINER` / `SECURITY INVOKER` の選択が未記載。RLS内で使用するため `SECURITY DEFINER` + `search_path = ''` が推奨 |

### 2. 網羅性・考慮漏れ WARN

**良い点**:
- WITHDRAWNユーザーの除外が決定事項に明記
- 日跨ぎ枠のハンドリングが計画全体で一貫（JST固定、`timestamptz`保存）
- 段階移行（旧フロー残置）でロールバックリスクを低減
- タイムゾーン、`schedule_phase`、確定枠の自由入力可否、同時編集が決定事項に明記

**指摘事項**:

| # | 深刻度 | 指摘 |
|---|--------|------|
| 4 | 必須 | **提出枠 0 件時のおすすめロジック**が未定義。全ユーザーが未提出の場合、`getScheduleRecommendations` は空配列を返すのか、「提出が不足しています」メッセージを返すのか明記すべき |
| 5 | 推奨 | **`minPlaytimeMinutes = null` 時のおすすめロジック分岐**が未定義。シナリオ未設定の場合 null になるが、`meetsMinPlaytime` フラグの算出方法（常に true? フィールド省略?）を明記すべき |
| 6 | 推奨 | **提出枠の同一ユーザー同時編集（複数タブ）**の挙動が未記載。確定枠は「Last-write-wins」と記載あるが、提出枠も同様であることを明記すべき |
| 7 | 検討 | 提出枠の **過去日時チェック**が未記載。Phase 1 で許容するかバリデーションで弾くかを明記すべき |

### 3. セキュリティ OK

**良い点**:
- RLSポリシーが `session_availability_slots` / `game_schedule_slots` 両テーブルで詳細に設計済み
- `auth.uid()` → `users.user_id` の解決を `current_app_user_id()` で明確に分離
- Server Actions で認可チェック + Zod バリデーションの二重防御
- backfill 前の UUID 妥当性 preflight チェックが計画に含まれている
- 提出枠上限100件でDoS緩和

**指摘事項**:

| # | 深刻度 | 指摘 |
|---|--------|------|
| 8 | 検討 | レート制限が未検討。件数上限（100）で基本的に十分だが、Phase 2 検討事項として記録を推奨 |

### 4. UX・アクセシビリティ OK

**良い点**:
- PC/SP レスポンシブ設計が明確（サイドバー常時表示/ドロワー切替）
- キーボード操作（矢印キー、Enter/Space、Tab）が Batch 4-6 の各 Step で計画済み
- `aria-live` リージョン（polite/assertive の使い分け）が適切
- ローディング状態（スケルトン、スピナー、disabled）が各画面で計画済み
- 見学者グループ分離による境界注記は説明可能性が高い

**指摘事項**:

| # | 深刻度 | 指摘 |
|---|--------|------|
| 9 | 推奨 | **ドロワー開閉時のフォーカス管理**が未記載。SP のドロワー表示時にフォーカスをトラップし、閉じた際にトリガー要素に戻す処理が WCAG 2.1 AA 準拠に必要。Ark UI Drawer 使用を明記すると実装時の迷いが減る |
| 10 | 推奨 | **楽観的更新の失敗時 UX** が未記載。保存失敗時のロールバック後にユーザーへどうフィードバックするか（トースト通知? インラインエラー?）を明記すべき |
| 11 | 検討 | バッジ/マーカーの **色のみに依存しない情報伝達**（`accessibility.md` 準拠）への言及が不足。バッジに件数テキストを併記する方針を明記すると安心 |

### 5. 保守性・拡張性 OK

**良い点**:
- 共通レイアウト骨格（`AvailabilityWorkspaceLayout`）で提出/確定UIを統一し重複排除
- 集計ロジックが純関数として分離されており、テスト容易性が高い
- 定数化（`MAX_AVAILABILITY_SLOTS_PER_USER`, `MAX_COMBO_RECOMMENDATIONS`）で変更容易
- Phase 1 / Phase 2 の段階移行で技術的負債を管理

**指摘事項**:

| # | 深刻度 | 指摘 |
|---|--------|------|
| 12 | 検討 | `RecommendationItem.rankingScore` の型が3フィールド（`priorityBucket`, `durationMinutes`, `compactnessScore`）だが、ソート基準（評価順リスト: 6項目）とフィールドが1:1対応していない。ソート関数内で完結させるか、フィールド名をソート基準と対応させると保守性向上 |

### 6. プロジェクト整合性 OK

**良い点**:
- ファイル配置が `CLAUDE.md` のディレクトリ構造パターンに完全準拠
- 型導出が `typescript-rules.md` の Single Source of Truth 原則に準拠（前回指摘反映済み）
- Server Actions パターン（認可 → バリデーション → adapter → Result型）が既存実装（`schedule/actions.ts`）と一致
- PandaCSS スタイル分離（`styles.ts`）が `styling-rules.md` 準拠
- 参加者ロール分類が既存 DB enum `participant_type` をそのまま使用（前回指摘反映済み）
- 楽観的更新の適用箇所が決定事項に明記（前回指摘反映済み）

**指摘事項**:

| # | 深刻度 | 指摘 |
|---|--------|------|
| 13 | 推奨 | `AvailabilitySlotEditor`（枠追加・編集）がUIアーキテクチャの「提出UI専用」セクションに記載されているが、**ファイル一覧にも Batch 実装計画にも含まれていない**。Batch 5 Step 5-2 に統合するか、別 Step として追加すべき |
| 14 | 推奨 | `DesktopSidebarPanel` / `MobileSidebarDrawer` がUIアーキテクチャの「共通骨格」に記載されているが、ファイル一覧に個別コンポーネントとして含まれていない。`AvailabilityWorkspaceLayout` 内に内包する想定なら明記すべき |
| 15 | 検討 | `resolveCurrentAppUserIdByAuthUid()` 補助関数の実装場所・Batch が未記載。`src/db/helpers.ts` 等に配置し Batch 1 で実装する旨を追記すべき |

### 7. 実行可能性 WARN

**良い点**:
- 7 Batch 構成で各 Batch に Review Checkpoint が配置されている（前回指摘反映済み）
- ファイル一覧が新規/変更で分類されている（前回指摘反映済み）
- 検証方法が具体的コマンド付きで記載されている（前回指摘反映済み）
- テスト計画が DB/Adapter、集計ロジック、UI（提出/確定）、セッション詳細と分類されている
- 手動テストチェックリストが具体的

**指摘事項**:

| # | 深刻度 | 指摘 |
|---|--------|------|
| 16 | 必須 | **Batch 2-3 の依存関係が逆転**（#1 と同根）。Step 2-3（おすすめ Adapter）は Batch 3（集計ロジック純関数）の完成を前提としている。**推奨**: Step 2-3 を Batch 3 の末尾（Step 3-3）に移動し、Batch 2 は可用枠/確定枠 Adapter のみとする |
| 17 | 推奨 | **Batch 4 の推定規模**。3 コンポーネント × 各3ファイル = 9 ファイル。推定行数 400-600 行。上限（15ファイル / 500行）の境界。必要に応じて Layout+Calendar と Panel+StickyBar に分割を検討 |
| 18 | 推奨 | **Storybook ストーリー作成が計画に含まれていない**。`coding-standards.md` ではコンポーネントと同階層にストーリーを配置するパターンが記載。共通UIコンポーネントのストーリーをどの Batch で作成するか明記すべき |
| 19 | 検討 | **SP ドロワーの実装手段が未指定**。Ark UI の Dialog（drawer mode）か、カスタム実装かを明記すると実装時の迷いが減る |

## 改善提案

### 必須（実装前に対処すべき）

| # | 視点 | 指摘事項 | 推奨対応 |
|---|------|---------|---------|
| 1 | 技術的妥当性 / 実行可能性 | Batch 2 Step 2-3 が Batch 3 に前方依存している | Step 2-3 を Batch 3 の末尾（Step 3-3）に移動。Batch 2 は可用枠/確定枠 Adapter のみとする |
| 4 | 網羅性 | 提出枠 0 件時のおすすめロジックが未定義 | 空配列を返し、確定 UI 側で「提出が不足しています」メッセージを表示する方針を追記 |

### 推奨（対応が望ましい）

| # | 視点 | 指摘事項 | 推奨対応 |
|---|------|---------|---------|
| 2 | 技術的妥当性 | combo 母集団サイズ N が未定義 | `MAX_SINGLE_CANDIDATES_FOR_COMBO = 10` を「実装前の最終確認事項」に追加 |
| 5 | 網羅性 | `minPlaytimeMinutes = null` 時のロジック未定義 | null の場合は `meetsMinPlaytime = true`（常に達成扱い）とし、ランキングは duration 降順のみで判定する方針を追記 |
| 6 | 網羅性 | 提出枠の同時編集（複数タブ）の挙動未記載 | 確定枠と同様に「後勝ち（Last-write-wins）」を明記 |
| 9 | UX | ドロワーのフォーカストラップ/復元が未記載 | Ark UI Dialog（drawer mode）使用を明記しフォーカス管理を自動化する方針を追記 |
| 10 | UX | 楽観的更新失敗時のフィードバック未記載 | 「トースト通知でエラーメッセージを表示し、ロールバック後の状態を維持」を追記 |
| 13 | プロジェクト整合性 | `AvailabilitySlotEditor` の Batch 割り当て欠落 | Batch 5 Step 5-2 に統合するか、ファイル一覧に追加 |
| 14 | プロジェクト整合性 | `DesktopSidebarPanel` / `MobileSidebarDrawer` のファイル一覧欠落 | `AvailabilityWorkspaceLayout` 内に内包する旨を明記 |
| 15 | プロジェクト整合性 | `resolveCurrentAppUserIdByAuthUid()` の実装場所未指定 | `src/db/helpers.ts` に配置し Batch 1 で実装する旨を追記 |
| 17 | 実行可能性 | Batch 4 が理想規模を超える見込み | 必要に応じて Batch 4-A（Layout+Calendar）/ 4-B（Panel+StickyBar）に分割を検討 |
| 18 | 実行可能性 | Storybook ストーリー作成が計画に含まれていない | 各 UI Batch（4-6）の末尾に共通コンポーネントの Storybook ストーリー作成を追記 |

### 検討（余裕があれば）

| # | 視点 | 指摘事項 | 推奨対応 |
|---|------|---------|---------|
| 3 | 技術的妥当性 | `current_app_user_id()` の SECURITY DEFINER/INVOKER 未記載 | `SECURITY DEFINER` + `search_path = ''` を推奨としてマイグレーション Step に追記 |
| 7 | 網羅性 | 過去日時の提出枠チェック未記載 | Phase 1 では許容（テスト容易性のため）、Phase 2 でバリデーション追加を検討事項として記載 |
| 8 | セキュリティ | レート制限未検討 | Phase 2 検討事項として記録 |
| 11 | UX | バッジの色のみ依存の情報伝達 | バッジに件数テキストを併記する方針を追記 |
| 12 | 保守性 | `rankingScore` フィールドとソート基準の不一致 | ソート関数内で完結させるか、フィールド名をソート基準と1:1対応させる |
| 19 | 実行可能性 | SP ドロワーの実装手段未指定 | Ark UI Dialog（drawer mode）使用を明記 |

## 総合所見

本計画は、前回レビューの主要指摘（型SSoT準拠、RLS設計、Review Checkpoint、ファイル一覧、検証方法）が適切に反映され、完成度が大幅に向上している。以下の点が特に優れている:

1. **型設計の一貫性**: Supabase 生成型を SSoT とし、UIビューモデルのみ独自定義を許容する方針が全体で統一
2. **関心の分離**: 集計ロジックを純関数として切り出し、DB操作（adapter）・認可（actions）・UIから独立
3. **段階移行**: 旧フローを即削除せず、Phase 1 では導線切り替えのみ、Phase 2 で整理する慎重なアプローチ
4. **アクセシビリティ**: キーボード操作、`aria-live`、フォーカス管理が各 Batch で具体的に計画
5. **RLS 設計**: `current_app_user_id()` SQL 関数でルールを DRY に保つ設計
6. **パフォーマンス基準**: ベンチマーク条件と許容レスポンスタイムが明記

最大の修正点は **Batch 2-3 間の前方依存の解消**（Step 2-3 を Batch 3 に移動）であり、構造的な変更は不要。必須指摘 2 件を反映すれば実装に着手可能。
