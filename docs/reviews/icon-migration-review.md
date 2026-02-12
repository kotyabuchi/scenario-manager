# アイコンライブラリ統一 レビューレポート（第2回）

> **レビュー日時**: 2026-02-12
> **対象ファイル**: `docs/plans/icon-migration.md`
> **総合評価**: A
> **反映ステータス**: 反映済み（2026-02-12）
> **反映内容**: 必須 0件 + 推奨 3件 + 検討 1件

## サマリー

前回レビュー（必須3件・推奨4件・検討3件）の全指摘が反映済みの計画書に対する再レビュー。size デフォルト差異の4パターン分類、PanelLeftClose/Open の統合方針、DiceFive への変更など、いずれも適切に対処されている。技術的妥当性の追加検証（Phosphor 全アイコン名の export 確認、`Icon` 型の存在確認、asChild 互換性、fontSize トークン値の検証）でも問題は発見されなかった。残る指摘は CLAUDE.md の参照更新とサイズ統一時の詳細のみで、実装に進める状態。

## 評価詳細

### 1. 技術的妥当性 OK

- **アイコン名の実在確認**: マッピング表の全アイコン（MagnifyingGlassMinus, ImageBroken, DiceFive, SidebarSimple, SpinnerGap, ChatText, PaperPlaneTilt, ClockCounterClockwise, ArrowCounterClockwise, BookmarkSimple 等）が `@phosphor-icons/react@2.1.7` の型定義で export を確認済み
- **`Icon` 型の存在**: `import type { Icon } from '@phosphor-icons/react'` が利用可能。`IconWeight` 型も export されており、react-icons の `IconType` からの移行に問題なし
- **asChild 互換性**: Phosphor Icons は `<svg>` 要素を返すコンポーネントであり、Ark UI の `ark.svg asChild` パターンとの互換性あり。alert.tsx の変換は安全
- **optimizePackageImports**: Vercel 公式ブログで `@phosphor-icons/react` が最適化対象として推奨されている。9000+ のバレル export に対して必須の設定
- **weight API**: `"thin" | "light" | "regular" | "bold" | "fill" | "duotone"` の6値が公式確認済み。fill/stroke 変換の設計は正確
- **size デフォルト**: `"1em"` が公式確認済み。4パターンの対処方針は妥当

### 2. 網羅性・考慮漏れ OK

- 前回の SearchPanel.tsx 分類誤りは修正済み（Step 4-6 に正しく配置）
- ファイル数は 64 で統一（3+20+10+31）。Batch ヘッダーの数値も整合
- マッピング表に Copy→Copy が追加済み
- E2E テストへの影響が検証方法セクションに明記済み
- size デフォルト差異の影響ファイルが4パターンで完全分類済み

### 3. セキュリティ OK

アイコンライブラリの移行はセキュリティに影響しない。`@phosphor-icons/react` は npm 公式レジストリの well-maintained パッケージ（GitHub phosphor-icons org、週間 400K+ ダウンロード）。

### 4. UX・アクセシビリティ OK

- **PanelLeftClose/Open 統合**: 決定事項に方針が明記済み。aria-label とテキスト「閉じる」で開閉状態が伝達されており、視覚的区別は不要との判断は妥当
- **fontSize 追従（空状態アイコン）**: 「CSS fontSize 追従が望ましい」との判断で `size={24}` を付与しない方針。lucide では 24px 固定で fontSize が無視されていたものが、Phosphor では `fontSize: '3xl'`（= 1.875rem = 30px）に追従し表示サイズが変わる。意図的な変更として Storybook 確認で検証する方針は適切
- **DiceFive**: TRPG アプリのコンテキストでダイスアイコンは適切な選択。前回の GameController 指摘が反映済み

### 5. 保守性・拡張性 OK

- weight API による fill/stroke 制御の簡潔化は保守性を向上させる
- 2ライブラリ → 1ライブラリの統一で認知負荷が減少
- icons.md と Serena メモリの更新計画あり

### 6. プロジェクト整合性 WARN

- **CLAUDE.md の参照未更新**: CLAUDE.md の2箇所で `lucide-react` を直接参照している（63行: Key Patterns テーブル「lucide-react を使用」、77行: Rules Reference テーブル「lucide-react使用規約」）。Step 1-3 で `.claude/rules/icons.md` を更新するが、CLAUDE.md 本体の記述も合わせて更新が必要
- icons.md 更新後は CLAUDE.md の参照先が正しく機能するが、テーブル内の文言が旧ライブラリ名のまま残り、混乱を招く

### 7. 実行可能性 OK

- 5 Batch 構成は依存関係を正しく反映
- 段階的移行（共存期間あり）は安全なアプローチ
- Batch 単位のコミット粒度が決定事項に明記済み
- 検証方法は lint・型チェック・ユニットテスト・E2E・Storybook・手動テストの多層構成

## 改善提案

### 必須（実装前に対処すべき）

なし

### 推奨（対応が望ましい）

| # | 視点 | 指摘事項 | 推奨対応 |
|---|------|---------|---------|
| 1 | 整合性 | CLAUDE.md の2箇所（63行, 77行）で `lucide-react` を直接参照。Step 1-3 で icons.md を更新するが CLAUDE.md は未記載 | Step 1-3 の対象ファイルに `CLAUDE.md` を追加し、「lucide-react を使用」→「@phosphor-icons/react を使用」、「lucide-react使用規約」→「@phosphor-icons/react 使用規約」に変更 |
| 2 | UX | PanelLeftClose（size={16}）と PanelLeftOpen（size={18}）でサイズが異なる。SidebarSimple 統一時にどちらのサイズを採用するか未記載 | Step 4-3 の SearchSidebar.tsx 変換説明にサイズの統一方針を追記（例: 展開ボタン・折りたたみボタンそれぞれで現行サイズを維持、または統一） |
| 3 | UX | 空状態アイコンの具体的なサイズ変化が不明。lucide 24px → Phosphor 30px（`fontSize: '3xl'` = 1.875rem に追従）で約25%拡大 | size デフォルト差異セクションのパターン3に「24px → 約30px（fontSize: '3xl' = 1.875rem）に変化。装飾アイコンとして適切なサイズ感を Storybook で確認」と具体値を追記 |

### 検討（余裕があれば）

| # | 視点 | 指摘事項 | 推奨対応 |
|---|------|---------|---------|
| 1 | 実行可能性 | バンドルサイズ比較の基準値取得手順が「pnpm build のログを比較し記録」のみで具体性に欠ける | Batch 1 実行前に `pnpm build` を実行し、`.next/` の出力サイズまたは build ログの First Load JS を記録する手順を追記 |

## 総合所見

前回レビューの全指摘（必須3件・推奨4件・検討3件）が的確に反映され、計画の品質は大幅に向上している。特に size デフォルト差異の4パターン分類は、移行時の判断を明確にする優れた整理である。

今回の追加検証では、Phosphor Icons の npm パッケージから全アイコン名の export 存在と `Icon` 型の利用可能性を直接確認し、マッピング表の正確性を裏付けた。技術的なアプローチに根本的な問題はなく、推奨3件を反映すれば完成度の高い実装計画として運用できる。

CLAUDE.md の更新漏れは計画の本質に影響しないが、移行後にプロジェクトドキュメント内で旧ライブラリ名が残ると新規参画者に混乱を招くため、Step 1-3 と同時に対処することを推奨する。
