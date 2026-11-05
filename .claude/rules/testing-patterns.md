# テスト安定化パターン（プロジェクト固有のノウハウ）

E2E（Playwright）と UT（Vitest）を**グリーンに保つ**ための、このプロジェクトで実証済みの知見。
新規テスト作成・既存テスト修正・UIリデザイン時に必ず参照すること。

> 出典: 2026-06 のテストグリーン化作業（E2E 63失敗 → 286 passed）。経緯は `.claude/PROGRESS.md` の「E2Eテスト失敗の分類と対応方針」参照。

---

## 1. 共通品質ゲートと実行範囲

PR前の標準入口は `pnpm quality:changed --base <比較元ref>`。readonly lint → 型 → pure/unit/tools → 全体の静的台帳検査 → 関連runner → 保存receipt再照合の順で実行する。比較元・HEAD・index・working bytesを固定し、途中変更は失敗にする。検査前の整形には `pnpm check`、検査自体には変更しない `check:ci` を使う。

| コマンド | 用途 |
|---------|------|
| `pnpm quality:changed --base HEAD` | 作業中の変更を検査。既定は部分実行と全件shadowの比較も行う |
| `pnpm quality:changed --base <ref> --all` | 共通品質前段と全required・全legacy-local |
| `pnpm quality:changed --base <ref> --no-shadow` | 関連実行のみ。全件比較なしと記録し、全体保証と扱わない |
| `pnpm e2e:ledger:check --base <ref>` | 抽出・台帳・全登録・不足baselineの静的整合 |
| `pnpm e2e:verify:all` | runtime単独の全件検証。lint/型/静的M1の代替ではない |
| `pnpm test:unit` / `pnpm test:e2e-tools` | DB不要のunit / 抽出・台帳・runner基盤の回帰 |
| `pnpm e2e:ledger:staged` | index上の台帳schema・ID・参照だけを検査 |

- ownerが専用local SupabaseとNext productionを起動する。Next 43100、Supabase 57321/57322、Storybook 6007を使い、既存プロセスを流用・killしない。終了後は所有runのprocess/container/network/volume/lockと認証情報を回収する。復旧は `docs/testing/e2e-environment.md` を参照。
- `test:e2e` / `test:e2e:dev` / `:ui` / `:headed` は旧設定の個別調査用であり、品質ゲートの成功証拠にしない。共通ゲートに共有cloud key/email/passwordを渡さない。
- `test-results/quality/changed.json` は最新品質サマリー。照合にはunique ID配下のplan/receipt/inputs-start/inputs-endを使い、latestの成功を流用しない。
- skip/fixme/xfail/retry後成功/中断/登録不足/cleanup不足は必須caseの成功にしない。legacyの既存例外は明示目録の一致だけを確認し、requiredの成功件数に混ぜない。deferred-liveと旧integrationは未実行として残す。
- docs-onlyは独立NoOp証明が成立した場合だけ許す。unknownな変更や未解決の依存は全requiredへ戻し、未検証領域の存在を表示する。
- hookの台帳検査はindexのJSONだけが対象。未stageのtestやTS型検査をcommit内容の証明にしない。通常の `git add` → `git commit` を使う。別indexを使うpath限定commitは明示的に拒否する。PR前とCIの全体ゲートは省略しない。

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

## 3. 専用DB・fixtureと検証の責務

品質ゲートはrun専用local Supabaseを空DBからmigration/seedで復元し、ULID・actor・対象行をfixtureのjournalで管理する。共有cloudの既存データを前提にしない。

- 更新テストは所有fixtureだけを操作し、失敗してもjournalとowner cleanupを実行する。他ユーザーや別runのデータを掃除しない。
- 拒否・権限・原子性はintegration/DB側、画面の操作・エラー表示・再試行はStorybook/browser側で検証する。layerを増やしただけで業務assertionを実証したことにしない。
- 固定 `waitForTimeout` を避け、期待するUI/DB状態を待つ。既存skipを減らす際は失敗原因と解消の根拠を記録し、例外目録を正規のmigrationで更新する。
- 新caseはstable case/variant/binding IDと対象contractに結び、独立した反例で失敗するassertionをレビューする。成功件数、操作数、fingerprintの変化だけでは検証の質を判断しない。

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

- **失敗を分類してから変更する**: 共通receiptのphase・required key・safe reportを確認し、実行不足、fixture不備、selectorのずれ、実装不具合を分ける。旧共有DBの成功で代替しない。
- **失敗は `test-results/<test名>/error-context.md`（ARIAスナップショット）で原因分類**: 「データが無い」のか「セレクタがズレた」のか「実バグ」かを、スナップショット内の実要素で判別する。
- **dev/prod 両モードで再現するか確認**: prod ビルド固有か切り分けるなら `pnpm test:e2e:dev` で同テストを回して比較する。
