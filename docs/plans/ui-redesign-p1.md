# UI全面リデザイン P1: デザイントークン刷新 + 左サイドバー導入 + レイアウト再構成

## Context

`.claude/requirements/requirements-ui-redesign.md` に基づくUI刷新のフェーズ1。プライマリパレットを現行の濃いブランドグリーン（#059568基調）からパステルグリーン系（#5FAA7F基調）へ全面刷新し、デスクトップナビゲーションをトップヘッダーから左サイドバー（240px/64px折りたたみ）に変更、`(main)` レイアウトをサイドバー構成に再編する。

現状の調査結果:
- トークンは `src/styles/tokens/colors.ts`（生パレット）→ `src/styles/semanticTokens.ts`（semantic参照）→ `src/styles/preset.ts` で合成。semanticTokens内に `colors.primary.500` 参照が24箇所、コンポーネント側に直接参照が約54箇所/26ファイル存在する
- 影トークン `shadows.button.primary` / `shadows.fab.default` / `shadows.landing.heroCta` と `colors.primaryShadow.25` に旧緑 `rgba(5,149,104,…)` がハードコードされている
- `GlobalHeader`（`src/components/blocks/GlobalHeader/`）はデスクトップナビ+モバイルトップバーを兼ね、`styles.ts` に oklch 生値のハードコードが多数ある（規約違反、今回置換）
- `BottomNav` は md未満のみ表示で中央FAB（`primary.default` + 白文字）持ち。`SpeedDialFAB` は md以上のみ表示（`bg: primary.500` + 白文字）で、Panel/hook/share は BottomNav と共有
- 既存の semantic `sidebar.*` トークンはシナリオ検索パネル（`scenarios/_components/SearchSidebar`）が使用中のため流用不可。新規トークン群が必要
- `(auth)` グループに layout.tsx は無し（`auth/callback` と `logout/page.tsx` のみ）→ 影響なし。ランディング `src/app/page.tsx` は `(main)` 外でサイドバー対象外
- e2e の `e2e/navigation.spec.ts` / `e2e/auth/navigation.spec.ts` が `header nav` セレクタに依存（デスクトップビューポートで実行されるため要更新）

## 決定事項

| 項目 | 方針 | 理由 |
|------|------|------|
| 白文字を載せるアクション面 | semantic層で `primary.600`(#347A55)へ付け替え（`button.primaryBg`等） | 新500(#5FAA7F)は白文字とのコントラスト約2.8:1でAA未達（要件書3.4） |
| `primary.default`(=500)の役割 | 装飾・バッジ面専用に格下げ。白文字を伴う用途は全て `button.*` / 600系semanticへ寄せる | semanticの意味を保ったまま参照先だけ差し替え、変更範囲を最小化 |
| フォーカスリング | `borders.focusRing` / `border.focus` / `input.focusBorder` を `primary.600` へ | フォーカスインジケータは隣接色と3:1必要。新500は白背景で2.8:1 |
| サイドバー用トークン | 新規 `appSidebar.*` semantic + `bg.sidebar` を追加（既存 `sidebar.*` は検索パネル用に温存） | 既存SearchSidebarとの衝突回避 |
| 折りたたみ状態管理 | jotai atom `sidebarCollapsedAtom: boolean \| null`（null=ブレークポイント自動）。`data-collapsed="auto\|true\|false"` 属性 + CSSで幅制御 | jotai導入済み。後で `atomWithStorage` に差し替えるだけで永続化（要件書10-3）に拡張可能 |
| SpeedDialFAB本体 | `(main)/layout.tsx` から削除し `SpeedDialFAB.tsx`・test・storiesを撤去。`SpeedDialPanel` / `useSpeedDial` / `share` / panel用stylesはBottomNavが使用するため残す | 要件書4.2（デスクトップ非表示）。元々md以上専用コンポーネントなので丸ごと不要 |
| GlobalHeader | モバイル専用トップバー化（md+で `display: none`）。ナビリンク・シナリオ登録ボタンを除去し、ロゴ + アバター/ログインのみに簡素化 | 要件書4.2 |
| ナビ項目 | ホーム/シナリオ/セッション/スケジュール/ユーザーの5項目 | 要件書4.1の4項目 + 現行ヘッダーの「ユーザー」`/users` 導線を退行回避のため残置 |
| `/scenarios` の searchParams/schema | 一切変更しない | 既存テスト維持（要件書9） |

## 前提条件

- 事前実装: なし（P1は依存なし）
- 環境: `pnpm prepare`（panda codegen）が通ること
- 新HEXは要件書3.2の暫定値を採用。実機確認後の微調整は `colors.ts` の1ファイル変更で完結する構造を維持

---

## Batch 1: デザイントークン刷新

semantic層の参照先変更を先に確定させ、以降のバッチが新トークンを参照できるようにする。

### Step 1-1. プライマリパレット差し替え

- 対象ファイル: `src/styles/tokens/colors.ts`
- 変更内容:
  - `primary` 50〜900 を要件書3.2の値（50:#F2F9F4 〜 900:#163627）へ置換
  - `primaryShadow.25` を `rgba(52, 122, 85, 0.25)`（新600ベース）へ変更
  - gray / orange / red / purple / info 等は現行維持

### Step 1-2. semanticTokens のカラー再マッピング

- 対象ファイル: `src/styles/semanticTokens.ts`
- 変更内容（背景・サーフェス、要件書3.3）:
  - `bg.page`: `#F4F7F2`、`bg.sidebar`: `#FBFCFA`（新規）、`bg.input` と `input.bg`: `#EDF0EC`
- 変更内容（白文字面の600化、要件書3.4）:
  - `button.primaryBg` → `primary.600` / `button.primaryBgHover` → `primary.700`
  - `pagination.activeBg`、`toggle.checkedBg`、`toggle.switchTrackOn`、`systemBadge.green`、`landing.ctaBg` → `primary.600`
- 変更内容（白背景上のテキスト/アイコン/フォーカス）:
  - `menu.itemTextSelected`、`slider.valueText`、`progress.text`、`header.textActive`、`header.logo`、`icon.primary`、`toast.successIcon`、`avatar.icon`、`border.focus`、`input.focusBorder` → `primary.600`
  - `borders.focusRing` / `focusRingDashed` → `2px solid {colors.primary.600}` 系
- 現行維持（装飾用途で3:1不要 or 淡色面）: `primary.default`(500)、`slider.fill`、`tab.underlineActive`、`scrollbar.thumb`、`badge.successDot`、`hero.gradient`(700→600で白文字AA可)、`primary.subtle`(100)等
- 新規追加: `appSidebar` グループ
  - `bg: #FBFCFA`、`navText: gray.600`、`navTextActive: primary.800`、`navActiveBg: primary.100`、`navHoverBg: gray.100`

### Step 1-3. 影トークンの旧緑除去

- 対象ファイル: `src/styles/semanticTokens.ts`（shadows）
- 変更内容: `button.primary`、`fab.default`、`landing.heroCta` の `rgba(5,149,104,…)` を `rgba(52,122,85,…)`（同opacity）へ
- 完了後 `pnpm prepare` でcodegen実行

## Batch 2: primary.500 直接参照のコントラスト是正スイープ

`rg 'primary\.500'`（semanticTokens除く約54箇所/26ファイル）を分類して是正。トークン再定義により500が淡くなるため、放置するとAA違反が発生する箇所のみ修正。

### Step 2-1. 白文字を載せた塗り面（必須・AA違反になる）

- `src/components/blocks/SignupModal/styles.ts`（ボタン2箇所）→ `button.primaryBg` / `button.primaryBgHover` 参照に変更
- `src/app/(main)/feedback/[id]/_components/styles.ts`（カウントバッジ `bg: primary.500` + 白文字）→ `primary.600`
- `src/components/blocks/BottomNav/styles.ts`（fab: `bg: primary.default` + 白文字）→ `button.primaryBg`
- `src/components/elements/tooltip/tooltip.stories.tsx`（デモ用2箇所）→ `primary.600`

### Step 2-2. フォーカスリング・フォーカスボーダー

- 対象: `ApprovalModal` / `ApplicationModal` / `CancelModal` / `Profile`(2) / `feedback/_components`(2) / `feedback/[id]/_components`(3) / `sessions/new/_components`(3) の各styles.ts
- 変更内容: `primary.500` → semantic（`border.focus` / `input.focusBorder`）参照へ統一。`[primary.500]` のブラケット生値記法も解消

### Step 2-3. 白背景上のテキスト・機能アイコン

- 対象: `toast/styles.ts`(2)、`dropdown/styles.ts`(1)、`tabs/styles.ts`(選択タブ文字)、`SpeedDialFAB/styles.ts`(menuIcon)、`SignupModal/styles.ts`(他2箇所)、`feedback/[id]`(headerIcon, borderLeft)、`avatar/styles.ts`、`pagination/styles.ts`、`progress/styles.ts`、`sessions/new`(accentColor 2箇所)、`scenarios` 系styles等
- 変更内容: 文字・情報アイコンは `primary.600`（または該当semantic）へ。純装飾（チェック済みradioドット等、白地以外/3:1不要）は500のまま可。1箇所ずつ判定してコメント不要の最小diffで

### Step 2-4. GlobalHeader の oklch ハードコード解消（Batch 4 と同時実施）

- 対象ファイル: `src/components/blocks/GlobalHeader/styles.ts`
- 変更内容: `[oklch(…)]` 生値（8箇所）を `header.logo` / `header.logoBg` / `header.textActive` / `header.text` 等のsemanticへ置換

## Batch 3: AppSidebar 新規実装

### Step 3-1. 折りたたみ状態atom

- 対象ファイル: `src/components/blocks/AppSidebar/atoms.ts`（新規）
- 変更内容: `export const sidebarCollapsedAtom = atom<boolean | null>(null)`。null=自動（lg+展開 / md〜lg折りたたみ、CSSで分岐）。トグル操作で boolean を明示セット

### Step 3-2. サイドバー本体

- 対象ファイル（すべて新規、1ファイル1コンポーネント・アロー関数+export const）:
  - `src/components/blocks/AppSidebar/AppSidebar.tsx`（'use client'）
  - `src/components/blocks/AppSidebar/SidebarNavItem.tsx`
  - `src/components/blocks/AppSidebar/SidebarUserMenu.tsx`
  - `src/components/blocks/AppSidebar/styles.ts`
  - `src/components/blocks/AppSidebar/index.ts`
- 仕様（要件書4.1）:
  - `<aside>`: `position: sticky; top: 0; height: 100dvh`、通常フロー内。`display: none`（base）→ md+ で表示。幅は `data-collapsed` 属性で制御: `false`=240px、`true`=64px、`auto`={md: 64px, lg: 240px}。`transition: width`
  - 背景 `appSidebar.bg` + `shadow: panel.default`、border禁止
  - 上部: ロゴ（BookOpen + アプリ名、折りたたみ時はアイコンのみ）+ 折りたたみトグルボタン
  - ナビ5項目: ホーム`/home`(House) / シナリオ`/scenarios`(BookOpen) / セッション`/sessions`(Calendar) / スケジュール`/schedules`(CalendarCheck) / ユーザー`/users`(Users)。アイコンは `@phosphor-icons/react/ssr`。アクティブ判定は GlobalHeader と同じ `pathname.startsWith` 方式、`aria-current="page"` 付与
  - アクティブ: `appSidebar.navActiveBg`(primary.100) ピル + `appSidebar.navTextActive`(primary.800)。非アクティブ: `gray.600`、hover `gray.100`
  - 下部CTA: `ScenarioRegisterDialog` でラップした「+ シナリオ登録」ボタン（`button.primaryBg`=600）。折りたたみ時はアイコンのみ+`aria-label`
  - 最下部: 認証済みは アバター+ニックネーム、クリックで既存dropdown/ark-ui Menuによる「マイページ(/profile)/ログアウト(/logout)」メニュー。未認証時はCTA位置に「ログイン」ボタン（`useDiscordAuth().login`）
  - 認証情報は `useAuth()`（GlobalHeaderと同パターン）から取得

### Step 3-3. テスト・ストーリー

- 対象ファイル: `AppSidebar.test.tsx` / `AppSidebar.stories.tsx`（新規）
- 変更内容: GlobalHeader.test.tsx のモック構成（next/navigation, useAuth, useDiscordAuth, ScenarioRegisterDialog）を踏襲。ナビ5項目表示・aria-current・未認証時ログインボタン・トグルでdata-collapsed切替を検証

## Batch 4: レイアウト再構成

### Step 4-1. (main)/layout.tsx のサイドバーレイアウト化

- 対象ファイル: `src/app/(main)/layout.tsx`
- 変更内容: auth取得ロジックは現状維持。JSXを以下の構造へ:
  ```
  <Flex minHeight="[100dvh]" bg="bg.page">          // direction: row
    <AppSidebar />                                  // md+ のみ表示
    <Flex direction="column" flex="1" minWidth="0"> // メインカラム
      <GlobalHeader />                              // md未満のみ表示
      <styled.main flex="1" ... pb={{ base:'20', md:'0' }}>{children}</styled.main>
      <SimpleFooter />
    </Flex>
    <BottomNav /> <SignupModalWrapper />            // SpeedDialFAB は削除
  </Flex>
  ```

### Step 4-2. GlobalHeader のモバイルトップバー化

- 対象ファイル: `src/components/blocks/GlobalHeader/index.tsx`, `styles.ts`
- 変更内容: navItems・navLinks・registerButton（ScenarioRegisterDialog import含む）を削除し、ロゴ + アバター/ログインボタンのみに。`header` スタイルに `md: { display: 'none' }` を追加。配色をsemantic化（Step 2-4）

### Step 4-3. SpeedDialFAB の撤去

- 削除: `SpeedDialFAB.tsx`、`SpeedDialFAB.test.tsx`、`SpeedDialFAB.stories.tsx`、`index.ts`
- 残置: `SpeedDialPanel.tsx`、`useSpeedDial.ts`、`share.ts`、`__tests__/`、`styles.ts`（FAB専用スタイル `speedDialFAB_container/_fab/_fabIcon` は削除、Panel用は残す）
- BottomNav は相対パス直importのため影響なし（import先を確認）

### Step 4-4. BottomNav / SimpleFooter の配色追従確認

- 対象ファイル: `src/components/blocks/BottomNav/styles.ts`
- 変更内容: fab を `button.primaryBg` へ（Step 2-1で実施）。アクティブ色 `primary.default` は新500でアイコン用途のため、白地で3:1未達なら `primary.600` へ変更。SimpleFooter は変更なし（gray基調）

## Batch 5: テスト更新・検証

### Step 5-1. 単体テスト更新

- `GlobalHeader.test.tsx`: ナビリンク・シナリオ登録ボタンのテストを削除し、ロゴ/アバター/ログインの検証に縮小
- `AppSidebar.test.tsx`: Step 3-3 の新規テスト
- `scenarios/__tests__`（searchParams/schema）: 無変更を確認

### Step 5-2. E2E更新

- 対象ファイル: `e2e/navigation.spec.ts`、`e2e/auth/navigation.spec.ts`（他 `header` 参照spec: smoke, home, profile等も走査）
- 変更内容: `header nav` セレクタを サイドバー（`aside` + `aria-label` 付き `nav`）基準に変更。ロゴ・ログインボタンのlocatorはサイドバー側に存在することを前提に修正

---

## ファイル一覧

### 新規ファイル

| ファイル | 用途 |
|---------|------|
| `src/components/blocks/AppSidebar/AppSidebar.tsx` | サイドバー本体（client） |
| `src/components/blocks/AppSidebar/SidebarNavItem.tsx` | ナビ項目 |
| `src/components/blocks/AppSidebar/SidebarUserMenu.tsx` | ユーザーメニュー |
| `src/components/blocks/AppSidebar/atoms.ts` | 折りたたみ状態atom |
| `src/components/blocks/AppSidebar/styles.ts` | サイドバースタイル |
| `src/components/blocks/AppSidebar/index.ts` | re-export |
| `src/components/blocks/AppSidebar/AppSidebar.test.tsx` | 単体テスト |
| `src/components/blocks/AppSidebar/AppSidebar.stories.tsx` | Storybook |

### 変更ファイル

| ファイル | 変更内容 |
|---------|---------|
| `src/styles/tokens/colors.ts` | primary 50-900 / primaryShadow 差し替え |
| `src/styles/semanticTokens.ts` | bg.* / primary系600化 / appSidebar追加 / shadows旧緑除去 |
| `src/app/(main)/layout.tsx` | サイドバーレイアウト化、SpeedDialFAB除去 |
| `src/components/blocks/GlobalHeader/index.tsx`, `styles.ts`, `GlobalHeader.test.tsx` | モバイルトップバー化 |
| `src/components/blocks/BottomNav/styles.ts` | fab/アクティブ色のsemantic化 |
| Batch 2 対象の約20 styles.ts | primary.500直接参照の是正 |
| `e2e/navigation.spec.ts`, `e2e/auth/navigation.spec.ts` 他 | サイドバー基準のセレクタへ |

### 削除ファイル

| ファイル | 理由 |
|---------|------|
| `src/components/blocks/SpeedDialFAB/SpeedDialFAB.tsx` ほかtest/stories/index | デスクトップFAB廃止（Panel/hook/shareは残置） |

## 検証方法

### 自動テスト

```bash
pnpm prepare                 # panda codegen（トークン変更反映）
pnpm vitest                  # 全単体テスト（scenarios searchParams/schema 含む）
pnpm check                   # biome
pnpm build                   # 型 + Route型チェック
pnpm test:e2e e2e/navigation.spec.ts e2e/smoke.spec.ts
```

### 手動テスト

- [ ] lg以上: サイドバー240px展開、GlobalHeader/BottomNav/FAB非表示、アクティブ項目がprimary.100ピル
- [ ] md〜lg: サイドバー64px（アイコンのみ）、トグルで展開可能
- [ ] md未満: サイドバー非表示、トップバー（ロゴ+アバター）+ BottomNav表示
- [ ] 未認証時: サイドバーCTA位置にログインボタン、認証時に「+ シナリオ登録」でダイアログ起動
- [ ] ユーザーメニューからマイページ/ログアウト遷移
- [ ] 全ボタン（solid primary）が #347A55 面 + 白文字になっている（DevToolsでAAコントラスト確認）
- [ ] Storybook + addon-a11y で AppSidebar / Button / BottomNav にコントラスト違反が出ない
