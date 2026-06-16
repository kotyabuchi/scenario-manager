# テスト安定化パターン（プロジェクト固有のノウハウ）

E2E（Playwright）と UT（Vitest）を**グリーンに保つ**ための、このプロジェクトで実証済みの知見。
新規テスト作成・既存テスト修正・UIリデザイン時に必ず参照すること。

> 出典: 2026-06 のテストグリーン化作業（E2E 63失敗 → 286 passed）。経緯は `.claude/PROGRESS.md` の「E2Eテスト失敗の分類と対応方針」参照。

---

## 1. E2E 実行・ポート運用

| コマンド | 用途 | サーバー |
|---------|------|---------|
| `pnpm test:e2e` | 正規・決定論的（CI相当） | `next build && next start -p 3100`（本番ビルド） |
| `pnpm test:e2e:dev` | 高速反復・デバッグ | 既存 `pnpm dev`(3000) を再利用（`E2E_REUSE=1`） |
| `pnpm test:e2e:ui` / `:headed` | 対話デバッグ | dev 再利用 |

- **E2E 専用ポートは 3100**（dev の 3000 と分離）。`pnpm dev` を立てたまま `pnpm test:e2e` を回せる。
- **`pnpm dev` は 3000 固定**。使用中なら `predev`（`scripts/check-port.mjs`）が**即失敗**する（3001 へ勝手にフォールバックさせない）。ポートが詰まったら `netstat -ano | findstr :3000` → `taskkill /PID <PID> /F`。
- 起動前に `kill-port 3100 9323`（`pretest:e2e`）。HTMLレポーターは `open: 'never'`（9323 自動起動でハングさせない。閲覧は `pnpm exec playwright show-report`）。
- **CI とローカルは同じ本番ビルド起動**に統一済み。「ローカルで通れば CI でも通る」。dev サーバー流用はコンパイル遅延・HMR で**フレークの温床**なのでデバッグ時のみ。
- 検証後は残留プロセス（next-server / chromium）が無いか確認。詳細は `agent-strategy.md`。

---

## 2. E2E セレクタの鉄則

UIリデザインで**最も壊れるのがセレクタ**。次を守ると stale 化に強い。

- **role + アクセシブル名を第一候補**にする: `getByRole('button'|'link'|'menuitem'|'combobox'|'option', { name })`。CSSクラス依存は避ける。
- **PandaCSS のクラスは使うな**: `className={styles.x}` はアトミックなハッシュ列になり「`styles.x`」という文字列は**含まれない**。`page.locator('[class*="voteSection"]')` のような部分一致は必ず壊れる。→ role / `aria-*` / `data-testid` を使う。
- **レスポンシブ重複は `.filter({ visible: true })`**: 同じテキスト/見出しが PC版・モバイル版で2つDOMに存在し strict-mode 違反になる。可視要素に限定する。
- **ナビは viewport 非依存に**: PC=ヘッダー nav / モバイル=BottomNav。`page.getByRole('navigation').getByRole('link', { name, exact: true }).filter({ visible: true })` で可視な方を選ぶ。
- **同名要素が複数あるなら `.first()`**: 例）詳細ページのアクションリンクが本体＋メニュー内に重複。
- **Ark UI コンポーネントの内部要素**:
  - Select の選択肢: `page.locator('[data-scope="select"][data-part="item"]').filter({ hasText: label })`。トリガーは role=`combobox`（aria-label 付き）。
  - Menu/SpeedDial の項目: `getByRole('menuitem', { name })`。
- **見出し/ラベルは実物を確認してから書く**: リデザインで「参加予定のセッション→予定されているセッション」「新着シナリオ→新着おすすめシナリオ」のように頻繁に変わる。`error-context.md`（test-results 配下の ARIA スナップショット）で実際のアクセシブル名を確認する。

---

## 3. 共有DB起因のフレーク対策

E2E は現状**共有のクラウド Supabase** に対して実行され、並列実行（4 workers）と相まってフレークが出やすい。

- **グローバルな集計値を厳密比較しない**: 投票数・件数などは他データ/並列実行で変動する。`toBe(initialCount + 1)` のような絶対値アサートは脆い。
- **per-user な状態でアサートする**: 投票なら「自分が投票したか」= `aria-pressed`。ユーザー単位で決定論的。
- **状態を変異させるテストは自己クリーンアップ**: 既存 `e2e/helpers/cleanup.ts`（`cleanupE2ESession`）+ `afterAll` を使い、変異を必ず元に戻す。クリーンアップ漏れは後続テストを汚染する。
- **固定 `waitForTimeout` を避ける**: `await expect(locator).toHaveText(期待値)` 等で「サーバー反映（aria-live 更新）」を明示的に待つ。固定待ち→reload はコミット前リロードでフレークになる。
- **真にデータ分離が要る場合のみ** Docker+seed（`supabase db reset`）を検討。現状 `feedback-detail` の「投票後リロード保持」のみ `test.fixme`（共有投票状態の競合）。将来タスクは PROGRESS 参照。

---

## 4. 外部ネットワーク依存テスト

- **Server Action 経由のサーバー側 fetch は `page.route()` で傍受できない**（ブラウザ層ではないため）。
- 外部サイト（TALTO/BOOTH）にアクセスするテストは**明示オプトイン**にする: `E2E_LIVE_IMPORT=1` のときのみ実行し、既定スイートでは skip（`import.spec.ts` Tier2 が実例）。既定の決定論性と外部非依存を保つ。

---

## 5. a11y / コンポーネントの落とし穴（実バグ由来）

テスト整備中に発見した**実アプリのバグ**。同種の実装で再発させないこと。

- **`Button asChild`**: `asChild` 指定時は子要素をそのまま Slot に渡す（prefix/suffix のフラグメントで包むと Ark の Slot が単一子要素要求で壊れ**何も描画されない**）。Linkボタンは `<Button asChild><Link/></Button>`。`button.tsx` で対応済み。
- **`Select`（Ark UI）**: フォーム送信用の**隠し native `<select>`（HiddenSelect）にも `aria-label` を伝播**する。トリガーだけに付けると axe の `select-name` 違反。`select.tsx` で対応済み。
- **`NumberInput`（Ark UI）**: アクセシブル名は **`aria-label` を `<input>` に転送**して付ける。**`id` を外部から上書きしない**（Ark が内部 id を採番し増減ボタンの `aria-controls` が参照しているため、id 上書きで `aria-valid-attr-value` 違反になる）。
- **`FormField` の使い分け**: 単一入力は `id` を渡して `<label htmlFor>` 関連付け、複数入力グループは `id` 無しで `<fieldset><legend>`。ただし**Ark系（NumberInput/Select 等、内部 id を持つ）には FormField の `htmlFor` を当てず、コンポーネント側の `aria-label` で名前を付ける**。
- **フォームのクライアント検証エラー表示**: RHF の `formState.errors` を各セクションコンポーネントに**必ず渡す**（`externalErrors ?? formState.errors`）。渡し忘れると必須未入力でもエラーが画面に出ない（`SessionForm` で実際に発生）。
- **a11y E2E（axe）は実コンポーネントのバグ検出器**として有効。`disableRules(['color-contrast'])` 済みでも `label` / `select-name` / `aria-valid-attr-value` 等は実バグを拾う。

---

## 6. 進め方の原則

- **インフラを作る前に実測する**: 「seed が要る」等の仮説は、まず `pnpm test:e2e` フル実行＋ `error-context.md` 精査でスコープを確定してから。今回「B=seedデータ依存」は誤診で、実体は staleセレクタだった（重い Docker+seed 構築を回避）。
- **失敗は `test-results/<test名>/error-context.md`（ARIAスナップショット）で原因分類**: 「データが無い」のか「セレクタがズレた」のか「実バグ」かを、スナップショット内の実要素で判別する。
- **dev/prod 両モードで再現するか確認**: prod ビルド固有か切り分けるなら `pnpm test:e2e:dev` で同テストを回して比較する。
