---
name: react-doctor
description: >
  react-doctorでReactコードを診断し、検出された問題を自動修正して100点を目指す。
  「react-doctor」「コード診断」「react doctor fix」で起動。
argument-hint: "[--full]"
allowed-tools:
  - Read
  - Write
  - Edit
  - Grep
  - Glob
  - Bash
  - Task
---

# React Doctor — コード診断 & 自動修正

`npx react-doctor@latest` でプロジェクトを診断し、検出された問題を自動修正して100点を目指す。

## When to Use

- コミット前にReactのベストプラクティス違反を検出・修正したい
- プロジェクト全体のコード品質スコアを確認したい
- リファクタリングの対象箇所を特定したい

## Instructions

### Step 1: 診断の実行

引数 `$ARGUMENTS` に `--full` が含まれる場合:
- `react-doctor.config.json` に一時的に `"diff": false` を追加して全ファイルスキャン
- 診断後に `"diff": false` を削除して元に戻す

引数がない、または `--full` 以外の場合:
- デフォルトの diff モード（ブランチ差分のみスキャン）で実行

```bash
npx react-doctor@latest . --verbose
```

### Step 2: 診断結果の解析

出力から以下を抽出する:

1. **スコア** — `N / 100`
2. **エラー件数** — `✗ N errors`
3. **警告件数** — `⚠ N warnings`
4. **各ルールの指摘** — ルール名、該当ファイル:行、件数

100点の場合は「100点です。問題は検出されませんでした。」と報告して終了。

### Step 3: 修正優先度の判定

検出されたルールを以下の優先度で分類する。

#### 自動修正する（確認不要）

| ルール | 修正内容 |
|--------|----------|
| `rerender-lazy-state-init` | `useState(fn())` → `useState(() => fn())` |
| `rerender-functional-setstate` | `setState(val + 1)` → `setState(prev => prev + 1)` |
| `rerender-memo-with-default-value` | デフォルト `[]`/`{}` をモジュールスコープ定数に抽出 |
| `no-array-index-as-key` | 安定IDが利用可能な場合のみ自動修正 |
| `nextjs-image-missing-sizes` | レイアウトに応じた `sizes` 属性を追加 |
| `no-barrel-import` | barrel import を直接パスに書き換え |

#### 確認後に修正する（設計判断を伴う）

| ルール | 確認理由 |
|--------|----------|
| `no-fetch-in-effect` | データフェッチ方式の変更（Server Component / react-query）は設計判断 |
| `no-cascading-set-state` | useReducer への移行は状態設計の変更を伴う |
| `prefer-useReducer` | 同上 |
| `no-derived-useState` | prop→useState の除去はコンポーネントの動作を変える |
| `no-giant-component` | コンポーネント分割は設計判断が必要 |
| `no-effect-event-handler` | useEffect からイベントハンドラへの移行はロジック変更を伴う |
| `no-render-in-render` | インラインrender関数の分離は設計判断 |

### Step 4: 自動修正の実行

自動修正対象のルールごとに:

1. 該当ファイルの該当行を Read で読む
2. コンテキストを確認して修正内容を決定
3. Edit で修正を適用
4. 修正ログを出力: `✓ [ルール名] ファイル:行 — 修正内容`

### Step 5: 確認付き修正の提示

設計判断を伴うルールの指摘をユーザーに提示する:

```
## 修正提案（確認が必要）

1. **[no-fetch-in-effect]** `src/app/(main)/feedback/_components/FeedbackContent.tsx:98`
   現状: useEffect 内で fetch() を使用
   提案: Server Component でのデータ取得に移行
   → 修正しますか？ (y/n/別の方針を指定)

2. ...
```

ユーザーの回答に応じて修正する。「別の方針」が指定された場合はその方針に従う。

### Step 6: 修正後の検証

すべての修正が完了したら:

1. `pnpm check` でlint/formatエラーがないか確認、エラーがあれば修正
2. react-doctor を再実行してスコアを確認

```bash
npx react-doctor@latest . --verbose
```

100点でない場合:
- 残りの指摘を確認し、Step 4-5 を繰り返す
- 設計上意図的に残す指摘がある場合は `react-doctor.config.json` の `ignore.rules` への追加を提案

### Step 7: 結果の報告

ユーザーに以下を報告:
- Before/After のスコア比較
- 自動修正した件数と内容
- ユーザー確認で修正した件数
- スキップした指摘（ある場合）
- 残存する指摘（ある場合）とその理由

## Error Handling

| 状況 | 対応 |
|------|------|
| react-doctor がインストールされていない | `npx` で自動インストールされるため問題なし |
| diff に変更がない | `--full` フラグの使用を提案 |
| config ファイルが存在しない | 診断はデフォルト設定で実行可能。ノイズが多い場合は設定ファイル作成を提案 |
| 修正後に pnpm check が失敗 | エラーを修正してから再検証 |
| 修正後もスコアが上がらない | ignore 設定の調整を提案 |

## Notes

- `react-doctor.config.json` でプロジェクト固有の除外設定を管理している
- PandaCSS 関連の knip ルール（files/exports/types）は誤検知が多いため除外済み
- Storybook・テストファイルも除外済み（プロダクションコードに集中）
- `--full` は全ファイルスキャンのため数秒かかる。通常は diff モードで十分
