# Motion ライブラリ導入によるアプリ全体のアニメーションブラッシュアップ

## Context

現在のアプリは PandaCSS トークン（durations, easings, keyframes）による CSS transition/animation が基盤。モーダル・ボトムシート・カードホバー・FAB 回転などは CSS で実装済みだが、以下の限界がある：

1. **exit アニメーション不在**: React の条件付きレンダー（`{isOpen && ...}`）では、アンマウント時にアニメーションを再生できない
2. **ジェスチャーの手動制御**: `useRef` + inline style でスワイプを実装しており、spring 物理演算・速度考慮がない
3. **オーケストレーション不在**: stagger（順次表示）、スクロール連動など CSS 単体では困難な協調アニメーションがない
4. **ページ遷移なし**: ルート間のクロスフェードや共有要素遷移が未実装
5. **reduced-motion 未対応**: `prefers-reduced-motion` を一括で制御する仕組みがない

Motion ライブラリ（旧 Framer Motion）と React 19 View Transitions API を適材適所で使い分け、これらを解決する。

## 決定事項

| 項目 | 決定 | 理由 |
|------|------|------|
| ページ遷移 | **View Transitions API**（React 19 + Next.js ネイティブ） | バンドル 0KB、App Router 統合、Suspense と競合しない |
| ステート遷移 | **`<ViewTransition>` + `startTransition`** | フィルタ結果変化・タブ切替をブラウザネイティブでアニメーション |
| 共有要素遷移 | **`view-transition-name`** | カード→詳細ページのサムネイル遷移等 |
| コンポーネントアニメーション | **Motion**（`motion` v12+） | spring 物理演算、ジェスチャー、stagger、AnimatePresence |
| バンドル戦略 | `LazyMotion` + `domAnimation` | 初期 ~6KB、必要時に追加ロード |
| Provider 配置 | `src/app/layout.tsx`（ルート） | 全ルートで Motion を使えるようにする |
| 既存実装の方針 | より良い手段があれば積極的に置き換える | 後方互換に固執せず UX 改善を優先 |
| reduced-motion | カスタムフック + 各ラッパーで対応 | `prefers-reduced-motion: reduce` 時はアニメーション即完了 |
| バリアント定義 | `src/lib/motion/variants.ts` に集約 | PandaCSS トークン値に対応させた Single Source of Truth |
| コンポーネント | `m` タグ（LazyMotion 用軽量版） | `motion` の代わりに `m` を使用（LazyMotion 必須） |
| View Transitions フォールバック | 非対応ブラウザではアニメーションなしの通常遷移 | View Transitions API は Progressive Enhancement。非対応でも機能は壊れない |
| `view-transition-name` の動的値 | PandaCSS CSS 変数ブリッジパターン | `css()` で `var(--vt-name)` を参照し、`style` 属性で値を注入。インラインスタイル禁止ルールの例外 |

### 技術選定の判断基準

```
View Transitions（ネイティブ、0KB）         Motion（ライブラリ、~6KB）
├─ ページ遷移（ルート間）                   ├─ exit アニメーション（AnimatePresence）
├─ ステート遷移（フィルタ、タブ）            ├─ spring 物理演算（自然な動き）
├─ 共有要素遷移（カード→詳細）              ├─ ジェスチャー（drag, swipe）
└─ 単純なクロスフェード / ワイプ            ├─ stagger（リスト順次表示）
                                           └─ スクロール連動（viewport 進入トリガー）
```

**どちらを使うか迷ったら:**
- 「ルーティングに紐づく遷移か？」→ Yes: View Transitions
- 「コンポーネントの出現/消滅/動きか？」→ Yes: Motion
- 「ジェスチャー（ドラッグ、スワイプ）が関わるか？」→ Yes: Motion
- 「リストの順次表示か？」→ Yes: Motion

## 前提条件

- 各 Batch は独立した git コミットとして管理
- Batch 3（複数コンポーネント置き換え）はコンポーネント単位でコミットし、問題発生時に個別ロールバック可能にする
- 問題発生時は `git checkout -- .` でロールバック可能
- View Transitions は experimental。問題があれば `viewTransition: false` で即無効化

---

## Batch 1: Foundation（インストール・Provider・共通ユーティリティ）

### Step 1-1. Motion パッケージのインストールと設定

- `pnpm add motion` を実行
- `next.config.ts` の `optimizePackageImports` に `'motion'` を追加

### Step 1-2. prefers-reduced-motion フックの作成

**新規**: `src/hooks/useReducedMotion.ts`

- `window.matchMedia('(prefers-reduced-motion: reduce)')` を監視
- SSR 時は `false` を返し、クライアントマウント後に実際の値を反映
- `change` イベントでリアルタイム追従

### Step 1-3. 共通アニメーションバリアント定義

**新規**: `src/lib/motion/variants.ts`, `src/lib/motion/index.ts`

PandaCSS トークン（`src/styles/tokens/easing.ts`, `durations.ts`）に対応した定数・バリアントを定義：

| バリアント | 用途 | duration |
|-----------|------|----------|
| `fade` | 単純フェード | 0.2s（`durations.normal`） |
| `fadeInUp` | 下から 8px スライド + フェード | 0.3s（`durations.slow`） |
| `fadeInDown` | 上から 8px スライド + フェード | 0.3s |
| `staggerContainer` | リストコンテナ（子に stagger 適用） | staggerChildren: 0.06 |
| `staggerItem` | リスト子要素 | 0.3s |
| `scrollReveal` | スクロールトリガー（24px スライド） | 0.4s（`durations.slower`） |
| `reducedMotionVariants` | reduced-motion 用（即完了） | 0s |

### Step 1-4. LazyMotion Provider の作成と統合

**新規**: `src/components/providers/MotionProvider.tsx`
**変更**: `src/app/layout.tsx`

- `LazyMotion features={domAnimation}` で `{children}` をラップ
- 現在の Provider 階層: `JotaiProvider > NuqsAdapter > SystemMessage > children`
- **MotionProvider は NuqsAdapter の直下、SystemMessage より外側に配置**（SystemMessage 自体も Motion 対象のため）
- 配置後: `JotaiProvider > NuqsAdapter > MotionProvider > SystemMessage > children`

### Step 1-5. 再利用可能なアニメーションラッパーコンポーネント作成

**新規ディレクトリ**: `src/components/elements/motion/`

| ファイル | 役割 |
|---------|------|
| `FadeIn.tsx` | 汎用フェードインラッパー。`as` prop でセマンティック要素指定可 |
| `StaggerList.tsx` | スタガーコンテナ + `StaggerItem` |
| `ScrollReveal.tsx` | スクロールトリガー表示。`once`, `amount` 制御可 |
| `index.ts` | バレルエクスポート |

全コンポーネントで `useReducedMotion()` を使用。`LazyMotion` 配下なので `m` タグを使用。

### Step 1-6. Storybook の LazyMotion デコレーター追加

**変更**: `.storybook/preview.tsx`

- `LazyMotion features={domAnimation}` デコレーターを追加し、全ストーリーで Motion コンポーネントが動作するようにする
- Batch 3 以降で Motion 置き換えしたコンポーネントのストーリーが壊れることを防止

### Step 1-7. Batch 1 検証

```bash
pnpm build && pnpm check && pnpm vitest
```
- ブラウザで reduced-motion ON/OFF を切り替え動作確認
- `pnpm build` 出力で Motion 追加前後の First Load JS サイズを比較し、~6KB 以内の増加であることを確認
- `pnpm storybook` で既存ストーリーが正常表示されることを確認

---

## Batch 2: View Transitions によるページ遷移・ステート遷移

React 19 の `<ViewTransition>` + Next.js のネイティブサポートを活用。

### Step 2-1. Next.js View Transition の有効化

`next.config.ts` に `experimental.viewTransition: true` を追加。これだけで App Router ルート遷移時にデフォルトのクロスフェードが有効になる。

### Step 2-2. ページ遷移のカスタマイズ（CSS）

**配置先**: `src/styles/preset.ts` の `globalCss` セクション（PandaCSS トークン値を参照可能、`@layer base` に出力される）

`::view-transition-old(root)` / `::view-transition-new(root)` 疑似要素で duration / easing を PandaCSS トークンに合わせる。`prefers-reduced-motion` で無効化。

```ts
// src/styles/preset.ts の globalCss に追加
globalCss: {
  '::view-transition-old(root)': {
    animationDuration: '{durations.fast}',
    animationTimingFunction: '{easings.emphasized-out}',
  },
  '::view-transition-new(root)': {
    animationDuration: '{durations.normal}',
    animationTimingFunction: '{easings.emphasized-in}',
  },
  '@media (prefers-reduced-motion: reduce)': {
    '::view-transition-old(root), ::view-transition-new(root)': {
      animationDuration: '0s',
    },
  },
}
```

### Step 2-3. 共有要素遷移

**判断基準**: 一覧ページと詳細ページで**同じ画像やタイトルが両方に存在する**場合、共有要素遷移の候補。

**適用方法**: PandaCSS の CSS 変数ブリッジパターンで `view-transition-name` を動的に設定。`css()` 関数で CSS 変数を参照し、`style` 属性で実際の値を注入する。

**現時点のサンプル**: シナリオカードのサムネイル → シナリオ詳細ページのヒーロー画像

```tsx
import { css } from '@/styled-system/css'

const vtImage = css({ viewTransitionName: 'var(--vt-name)' })

// 一覧側
<Image className={vtImage} style={{ '--vt-name': `scenario-${id}` } as React.CSSProperties} ... />
// 詳細側
<Image className={vtImage} style={{ '--vt-name': `scenario-${id}` } as React.CSSProperties} ... />
```

**注意**: `style` 属性は CSS 変数の値注入のみに使用。これはプロジェクトのインラインスタイル禁止ルールの例外として決定事項に記載済み。

**他に候補がないか確認**: セッションカード→セッション詳細、ユーザーアバター→プロフィールページなど、同じパターンを探す。

### Step 2-4. ステート遷移

**判断基準**: `startTransition` でステート更新している箇所で、**UI の大部分が切り替わる**場合に `<ViewTransition>` でラップする候補。

- フィルタ/検索結果の切り替え
- タブコンテンツの切り替え
- ソート順の変更

```tsx
import { ViewTransition } from 'react'

<ViewTransition>
  <結果リスト />
</ViewTransition>
```

### Step 2-5. Batch 2 検証

- ページ間遷移でクロスフェード確認
- 共有要素遷移確認（一覧→詳細でサムネイルが拡大移動）
- ブラウザの戻る/進むで逆再生
- ステート遷移でリストがクロスフェード
- `prefers-reduced-motion` 有効時に無効化
- Firefox / Safari で View Transitions 非対応時にエラーなく通常遷移にフォールバックすることを確認
- スクリーンリーダー（NVDA 等）でページ遷移時に新しいページのコンテンツが適切にアナウンスされることを確認

---

## Batch 3: 既存コンポーネントの Motion 置き換え

### 対象コンポーネントの判断基準

以下のパターンに該当するコンポーネントを洗い出し、Motion に置き換える：

| パターン | 問題 | Motion の解決策 |
|---------|------|----------------|
| `{isOpen && <Menu/>}` で**瞬時に出現/消滅** | exit アニメーションなし | `AnimatePresence` でラップ |
| CSS `animation` で `_closed` 状態にアニメ定義 | 条件付きレンダーでアンマウントされると**再生されない** | `AnimatePresence` の `exit` prop |
| `useRef` + `element.style.transform` で**手動アニメーション** | spring なし、速度非考慮、コード複雑 | Motion の `drag` / `animate` で宣言的に |
| inline style `transform` + CSS `transition` で**show/hide** | 硬い動き、spring 感なし | Motion の `animate` + spring |
| CSS `rotate` transition | 機械的な回転 | Motion の spring ベース `animate={{ rotate }}` |

### Step 3-1. 条件付きレンダーで出現/消滅するコンポーネント

**対象の探し方**: `{isOpen &&` や `{visible &&` で検索し、出現/消滅にアニメーションがないものを特定。

**改善**: `AnimatePresence` + `m.div` でラップし、`initial` / `animate` / `exit` を設定。メニューアイテム等にはスタガーも追加。

**現時点のサンプル**: SpeedDialFAB のメニュー、オーバーレイ

**フォーカス管理**: AnimatePresence は exit アニメーション中もコンポーネントを DOM に保持する。exit 完了後にフォーカスがトリガー要素（例: FAB ボタン）に戻ることを確認。`onExitComplete` コールバックでフォーカス移動が必要な場合がある。

### Step 3-2. exit アニメーションが信頼できないコンポーネント

**対象の探し方**: CSS keyframe で `_closed` / `_open` アニメーションを定義しているが、実際にアンマウントされるコンポーネント。

**改善**: CSS keyframe を Motion の `initial` / `animate` / `exit` に置き換え。`AnimatePresence` で exit の再生を保証。

**現時点のサンプル**: Modal（`slideInUp` / `slideOutDown`）、SystemMessage（入場のみ CSS、退場なし）

#### Ark UI Dialog（Modal）との統合戦略

Modal は `if (!open) return null;` で Dialog.Root ごとアンマウントしている（Ark UI の `open` prop の制約によるワークアラウンド）。Portal 経由で DOM ツリーが分離するため、単純な AnimatePresence ラップでは exit アニメーションが動かない。

**対応方針**: `if (!open) return null` ガードを削除し、Dialog.Root を常時マウントに変更する。Ark UI Dialog はもともと `open={false}` で非表示になる設計のため、open prop の制御に戻す。Backdrop と Content のアニメーションは Motion の `animate` / `exit` で制御する。

```tsx
// Before: 条件付きレンダーでアンマウント
if (!open) return null;
return <Dialog.Root open={true} ...>

// After: Dialog.Root は常時マウント、open prop で制御
return (
  <Dialog.Root open={open} ...>
    <Portal>
      <AnimatePresence>
        {open && (
          <m.div key="backdrop" exit={{ opacity: 0 }} ...>
            <Dialog.Backdrop />
          </m.div>
        )}
      </AnimatePresence>
      ...
    </Portal>
  </Dialog.Root>
);
```

**検証ポイント**: Ark UI Dialog の `open` prop 制御に戻した際、フォーカストラップ・Escape キー閉じ・外クリック閉じが正常動作するか確認。動作しない場合は `onExitComplete` コールバックで Dialog を閉じる方式を検討。

**フォーカス管理**: Dialog 閉じアニメーション完了後、フォーカスが Dialog のトリガー要素に戻ることを確認。Ark UI Dialog は通常このフォーカス復帰を自動で行うが、AnimatePresence との組み合わせでタイミングがずれないか検証。

### Step 3-3. useRef + inline style で手動アニメーションしているコンポーネント

**対象の探し方**: `ref.current.style.transform` や `ref.current.style.transition` で検索。

**改善**:
- `drag` prop + `dragConstraints` で宣言的ドラッグ
- `onDragEnd` で velocity（速度）考慮の閉じ判定
- spring ベースのスナップバック
- 手動の `transition: 'none'` / `transition: ''` 切り替えコード削除

**現時点のサンプル**: FilterBottomSheet のスワイプジェスチャー

### Step 3-4. inline style transform + CSS transition で show/hide するコンポーネント

**対象の探し方**: `style={{ transform: visible ? ... : ... }}` + `transition: 'transform'` パターンで検索。

**改善**: `animate={{ y: visible ? 0 : '100%' }}` + `transition={{ type: 'spring' }}` に置き換え。

**スクロールハンドラの扱い**: 既存の `window.addEventListener('scroll', ...)` + `useState(visible)` によるスクロール検知ロジックは**そのまま維持**する。Motion はアニメーション部分のみを担当し、`visible` state の値に応じて `animate` prop を切り替える。スクロール検知自体を Motion に置き換える必要はない。

**現時点のサンプル**: BottomNav のスクロール hide/show

### Step 3-5. 置き換え済み CSS アニメーションの削除

Motion に置き換えたコンポーネントで不要になった CSS アニメーション定義を削除し、デッドコードを防ぐ。

**手順**:
1. `src/styles/tokens/animations.ts` から、Motion に置き換えた定義を特定（例: `dialog-in/out`）
2. `src/styles/preset.ts` のキーフレーム定義から、置き換え済みの `slideInUp` / `slideOutDown` 等を特定
3. 各定義が他の箇所で参照されていないことを Grep で確認
4. 未参照の定義を削除

**注意**: `skeleton-pulse`、`spin`、`shimmer` 等の Motion 対象外アニメーションは残す。削除前に必ず参照箇所をゼロ確認すること。

### Step 3-6. Batch 3 検証

```bash
pnpm build && pnpm check && pnpm vitest
```
- 置き換えた各コンポーネントの入場・退場アニメーションが動作
- ジェスチャーが spring ベースで滑らか
- reduced-motion 時は全て即時表示/非表示
- 既存の Storybook ストーリーが正常表示

---

## Batch 4: リストスタガーアニメーション

### 対象の判断基準

以下に該当するリスト/グリッドを対象にする：

- **カードの繰り返し表示**（`.map()` で複数の同型コンポーネントをレンダー）
- **初回表示時に全件が同時出現** する箇所
- **視覚的に「順番に現れる」ことで体験が向上** する箇所

**対象外**:
- 3件以下の短いリスト（stagger の効果が薄い）
- すでにスケルトンで段階的に表示されている箇所（二重アニメーション回避）

### Step 4-1. 対象リストの特定と適用

**探し方**: `_components/` 内で `.map((item) =>` を検索し、カードやリストアイテムのグリッドを特定。

**適用方法**:
1. リストコンテナの `<div>` を `<StaggerList>` に置き換え（`className` はそのまま渡す）
2. 各アイテムを `<StaggerItem>` でラップ

```tsx
// Before
<div className={styles.grid}>
  {items.map(item => <Card key={item.id} ... />)}
</div>

// After
<StaggerList className={styles.grid}>
  {items.map(item => (
    <StaggerItem key={item.id}>
      <Card ... />
    </StaggerItem>
  ))}
</StaggerList>
```

**Server Component の場合**: `StaggerList` / `StaggerItem` は Client Component だが、Server Component 内で直接 import して使用可能（Next.js App Router の仕様）。

**注意**: 「もっと読み込む」等で追加されたアイテムが、既存アイテムを再アニメーションしないよう `key` を安定させること。

### Step 4-2. 空状態表示に FadeIn を追加

**判断基準**: リストが空（0件）の場合に表示される空状態 UI に `FadeIn` をラップ。検索結果が空になった瞬間の遷移が滑らかになる。

### Step 4-3. Batch 4 検証

```bash
pnpm build && pnpm check && pnpm vitest
```
- カードが順番にフェードイン（60ms 間隔）
- reduced-motion 時は全件即時表示
- 追加読み込みで既存カードが再アニメーションしない

---

## Batch 5: スクロールトリガーアニメーション

### 対象の判断基準

- **ファーストビュー外のセクション**（スクロールしないと見えない位置）
- **独立した情報ブロック**（セクション見出し + コンテンツのまとまり）
- **ダッシュボード型ページ** で複数セクションが縦に並ぶ場合に特に効果的

**対象外**:
- ファーストビュー内のコンテンツ（すでに見えているのにアニメーションすると不自然）
- フォーム内のフィールド（操作の邪魔になる）
- ページの主要コンテンツ（メインの記事本文など、読むことが目的の箇所）

### Step 5-1. 対象セクションの特定と適用

**探し方**: ダッシュボード型ページ（ホームなど）や詳細ページで、`<section>` や見出し付きブロックが縦に並んでいる箇所。

**適用方法**: 各セクションを `<ScrollReveal>` でラップ。

```tsx
<ScrollReveal>
  <SomeSection ... />
</ScrollReveal>
```

- `once={true}`（デフォルト）: 一度表示されたら再非表示にしない
- `amount={0.2}`: 要素の 20% がビューポートに入ったらトリガー

### Step 5-2. Batch 5 検証

- スクロールダウン時にセクションがフェードイン
- スクロールアップしても表示されたまま
- 高速スクロールで壊れないこと
- モバイルのタッチスクロールが正常
- reduced-motion 時は即時表示

---

## Batch 6: 未認証ページ・残件のブラッシュアップ

### 対象の判断基準

Batch 3-5 の判断基準で洗い出した対象のうち、まだ対応していないものをここで処理する。加えて、以下のパターンも対象：

- **未認証ユーザーが最初に見るページ**（ログイン画面、LP 等）に入場アニメーションがない
- **ヒーローセクションやCTA**など、ファーストインプレッションに影響する要素

**対象外**:
- Batch 3-5 で既に対応済みのコンポーネント
- 既存の CSS hover transition（維持する）

### Step 6-1. 未対応コンポーネントの洗い出しと対応

**探し方**: Batch 3 の判断基準（`{isOpen &&` 検索、`ref.current.style.transform` 検索等）を再実行し、未対応の残件がないか確認。見つかった場合は同じパターンで対応。

### Step 6-2. 未認証ページの入場アニメーション

**探し方**: `src/app/(auth)/` 配下およびルートの `page.tsx`（LP）を確認し、ヒーロー要素やCTAに `FadeIn` / `StaggerList` を適用。

### Step 6-3. Batch 6 検証

```bash
pnpm build && pnpm check && pnpm vitest
```
- 未認証ページの入場アニメーションが動作
- Batch 3-5 の対象が漏れなく対応済みであること

---

## ファイル一覧

### 新規ファイル

| ファイル | 用途 |
|---------|------|
| `src/hooks/useReducedMotion.ts` | prefers-reduced-motion 監視フック |
| `src/lib/motion/variants.ts` | 共通アニメーションバリアント |
| `src/lib/motion/index.ts` | バレルエクスポート |
| `src/components/providers/MotionProvider.tsx` | LazyMotion プロバイダー |
| `src/components/elements/motion/FadeIn.tsx` | フェードインラッパー |
| `src/components/elements/motion/StaggerList.tsx` | スタガーリスト + アイテム |
| `src/components/elements/motion/ScrollReveal.tsx` | スクロールトリガー |
| `src/components/elements/motion/index.ts` | バレルエクスポート |

### 変更ファイル（確定分）

| ファイル | 変更内容 |
|---------|---------|
| `next.config.ts` | `optimizePackageImports` に `'motion'` 追加、`experimental.viewTransition: true` 追加 |
| `src/app/layout.tsx` | MotionProvider ラップ追加 |
| `src/styles/preset.ts` | `globalCss` に `::view-transition-*` 疑似要素スタイル追加 |
| `.storybook/preview.tsx` | LazyMotion デコレーター追加 |

**注意**: Batch 3-6 で変更されるコンポーネントファイルは判断基準ベースで動的に決まるため、ここには記載しない。

## 検証方法

### 自動テスト
```bash
pnpm build           # ビルドエラーなし
pnpm check           # Biome lint/format パス
pnpm vitest          # 既存テスト全パス
```

### E2E テスト（Playwright）

既存の E2E テストがアニメーション変更で壊れないことを確認。特に以下の点に注意：

- AnimatePresence による exit 遅延で、要素の非表示判定タイミングが変わる可能性
- `not.toBeInViewport()` を使用している箇所（CSS transform ベースの非表示パターン）
- Motion に置き換えた後も既存の `toBeVisible()` / `toBeHidden()` アサーションが通ること

```bash
pnpm exec playwright test
```

### 手動テスト
- [ ] ページ遷移（View Transitions）: ページ間移動でクロスフェード
- [ ] 共有要素遷移: 一覧→詳細でサムネイルが拡大移動
- [ ] ステート遷移: フィルタ・タブ変更時にクロスフェード
- [ ] AnimatePresence: 条件付きレンダーのコンポーネントに exit アニメーション
- [ ] フォーカス管理: exit 完了後にフォーカスがトリガー要素に戻る
- [ ] ジェスチャー: スワイプが spring ベースで滑らか
- [ ] スタガー: カードリストが順番にフェードイン
- [ ] スクロール: ファーストビュー外セクションがスクロールで出現
- [ ] reduced-motion: OS 設定で有効化時、全アニメーション即時完了
- [ ] モバイル: タッチスクロール・ページ遷移・ジェスチャーが正常
- [ ] パフォーマンス: DevTools Performance で transform/opacity のみアニメーション
- [ ] スクリーンリーダー: ページ遷移時のアナウンスが適切
- [ ] `pnpm build:cloudflare` 成功
