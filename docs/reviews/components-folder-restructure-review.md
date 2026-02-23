# _components/ フォルダ構成の刷新 レビューレポート

> **反映ステータス**: 反映済み（2026-02-23）
> **反映内容**: 必須 3件 + 推奨 3件 + 検討 3件

> **レビュー日時**: 2026-02-23
> **対象ファイル**: `docs/plans/components-folder-restructure.md`
> **総合評価**: B

## サマリー

フラットファイル + 共有 `styles.ts` 構成を、`elements/` / `blocks/` で実績のあるフォルダ・パー・コンポーネント構成に統一する計画。方向性は正しく、スタイル所有権マッピングも97〜99%の精度で作成されている。一方で、対象ディレクトリの見落とし（`sessions/new/_components/`）、スタイルマッピングの微小な欠落、計画書内のコード例の誤記など、実装前に修正すべき軽微な問題がある。

## 評価詳細

### 1. 技術的妥当性 OK

- フォルダ・パー・コンポーネント構成は `elements/` / `blocks/` で実績があり、PandaCSS の外部スタイルファイル方式と親和性が高い
- `_shared/styles.ts` による共通スタイル分離は、DRY原則を維持しつつコロケーションを実現する合理的な設計
- スタイル名の簡略化（プレフィックス削除）は、フォルダスコープで名前空間が確保されるため妥当
- Batch 単位での段階的移行は、リスクを分散させる適切なアプローチ

### 2. 網羅性・考慮漏れ WARN

以下の項目が計画から漏れている:

**対象ディレクトリの見落とし:**
- `sessions/new/_components/` — 2コンポーネント（SessionForm.tsx, SessionFormContainer.tsx）、185行の styles.ts、テストファイル（SessionForm.test.tsx）、ストーリーファイルを含む。計画の「単一コンポーネントのディレクトリは変更しない」の除外条件に該当しない（2コンポーネント存在）

**スタイルマッピングの欠落:**
- `scenarios/[id]/_components/styles.ts`: `review_avatarImage` が ReviewSection のマッピングに未記載
- `sessions/_components/styles.ts`: `calendar_sessionDots` が CalendarView のマッピングに未記載
- `home/styles.ts`: `sidebarCard`, `sidebarDivider` がページレベルスタイルのマッピングに未記載

**テストファイルの移動:**
- `sessions/new/_components/SessionForm.test.tsx` が存在するが、sessions/new が計画の対象外のため影響なし。ただし sessions/new を対象に含める場合はテスト移動も必要

### 3. セキュリティ OK

本計画はファイル構造のリファクタリングのみであり、認証・認可、入力処理、データアクセスに変更はない。セキュリティリスクなし。

### 4. UX・アクセシビリティ OK

コンポーネントの振る舞いやスタイルの出力値に変更はなく、ユーザー体験・アクセシビリティへの影響なし。スタイル名の変更は CSS 変数名（PandaCSS の出力クラス名）には影響しない。

### 5. 保守性・拡張性 OK

- コンポーネントとスタイルのコロケーションにより、変更時の影響範囲が局所化される
- `_shared/styles.ts` パターンにより、共通スタイルの発見性が向上
- Batch 8 でコーディング規約を更新する計画があり、新規開発時のガイドラインも整備される
- 将来のコンポーネント追加時のテンプレートが明確になる

### 6. プロジェクト整合性 OK

- PascalCase フォルダ命名は `blocks/` の慣習と一致（`coding-standards.md` 準拠）
- `index.ts` バレルエクスポートは `react-rules.md` のパターンと一致
- `styles.ts` の同階層配置は `styling-rules.md` の原則と一致
- `_shared/` の命名は `_components/` のアンダースコアプレフィックス慣習と整合

### 7. 実行可能性 WARN

**コード例の誤記:**
- Step 1-2 の import 更新例で、Before と After が同一コード（`import * as styles from './styles'`）になっている。実際にはフォルダ移動後のパスは変わらないケースもあるが、`_shared/styles` を使うケースの例示が不明瞭

**検証方法の不足:**
- 各 Batch の検証コマンドは `pnpm check && pnpm build` だが、`pnpm vitest` は「検証方法」セクションにのみ記載されている。各 Batch 完了後にテストも実行すべき
- Storybook の動作確認手順が手動テストに委ねられているが、`pnpm storybook` の起動確認を自動検証に含めるべき

**ロールバック手順の欠如:**
- 各 Batch で問題が発生した場合のロールバック手順が記載されていない。git の特性上 `git checkout -- .` で戻せるが、明記が望ましい

## 改善提案

### 必須（実装前に対処すべき）

| # | 視点 | 指摘事項 | 推奨対応 |
|---|------|---------|---------|
| 1 | 網羅性 | `sessions/new/_components/` が対象外になっている（2コンポーネント + 185行 styles.ts） | Batch 4 に Step を追加するか、新しい Batch として追加 |
| 2 | 網羅性 | 4つのスタイル export がマッピングから欠落（`review_avatarImage`, `calendar_sessionDots`, `sidebarCard`, `sidebarDivider`） | 各マッピングテーブルに追記 |
| 3 | 実行可能性 | Step 1-2 のコード例で Before/After が同一 | 正確な import パス変更例に修正（特に `_shared/styles` を使うケース） |

### 推奨（対応が望ましい）

| # | 視点 | 指摘事項 | 推奨対応 |
|---|------|---------|---------|
| 1 | 実行可能性 | 各 Batch の検証に `pnpm vitest` が含まれていない | 各 Batch の検証コマンドを `pnpm check && pnpm vitest && pnpm build` に統一 |
| 2 | 実行可能性 | ロールバック手順が未記載 | 各 Batch に「問題発生時は `git checkout -- .` でロールバック」を注記 |
| 3 | 網羅性 | `scenarios/new/_components/`（1コンポーネント、284行 styles.ts）が除外対象の根拠が弱い | 除外理由を「1コンポーネントかつ styles.ts が既にそのコンポーネント専用」と明確化 |

### 検討（余裕があれば）

| # | 視点 | 指摘事項 | 推奨対応 |
|---|------|---------|---------|
| 1 | 保守性 | `_shared/styles.ts` が将来肥大化するリスク | `_shared/` 内もカテゴリ別に分割可能な旨を規約に注記 |
| 2 | 実行可能性 | Batch 6（home）はページレベル styles.ts のトリミングが他 Batch より複雑 | Batch 6 を先に着手してリスクを早期に検出する選択肢を検討 |
| 3 | 保守性 | `home/styles.ts` の `loading_*` スタイル（27個）が依然としてページレベルに残る | `loading.tsx` 専用の `loading-styles.ts` への分離を将来課題として記録 |

## 総合所見

計画全体の方向性と粒度は優秀で、実行可能な状態に近い。特にスタイル所有権マッピングの詳細さ（7ディレクトリ、約40コンポーネント分を個別にマッピング）は実装時の判断を大幅に削減する。Batch 分けの順序も、小規模・明確なターゲットから開始して最複雑な sessions に進む段階的アプローチが適切。

必須指摘3件はいずれも軽微な修正で対応可能であり、計画の根本的な見直しは不要。特に `sessions/new/_components/` の追加とスタイルマッピングの補完を行えば、そのまま実装に着手できる品質にある。
