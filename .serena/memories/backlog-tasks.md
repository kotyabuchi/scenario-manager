# バックログ（未着手タスク）

## 優先度: 高
### PandaCSS StrictMode導入
- 大量のエラーが予想される。段階的対応が必要
- まず現状のエラー数を調査し、カテゴリ別に分類してから対応計画を立てる

## 優先度: 中
### B8: Comboboxチップ表示問題
- シナリオ検索でタグ選択時にチップが表示されない
- Comboboxコンポーネント改修が必要（スタイル修正では不可）
- 関連ファイル: `src/styles/recipes/combobox.ts`

## 優先度: 低
### voyage-011レビュー軽微指摘2件
- 既存問題。詳細はvoyage-011のレビュー報告を参照

## 優先度: 将来検討（Claude Code環境改善）

以下はBoris Chernyベストプラクティス調査（2026-02-03）で特定された改善項目：

### P1: メトリクス収集の仕組み化
- スコア向上: +3%
- 実装コスト: 中（3時間）
- 内容: Claude Codeの使用状況・パフォーマンスを収集する仕組み

### P2: Slack MCP統合
- スコア向上: +2%
- 実装コスト: 中（2時間）
- 内容: Slack MCPを導入して通知・連携を強化

### P3: BigQuery MCP統合
- スコア向上: +7%
- 実装コスト: 高（GCP設定+4時間）
- 内容: データ分析のためのBigQuery MCP統合

---

## 完了済み改善（参考）
- voyage-011: プロジェクト全体のレスポンシブ対応 ✅
- voyage-012: Biome noRestrictedImports（TSXでのcss直接import禁止） ✅
- レビュー運用改善: 1タスク1レビュー パイプライン方式 ✅
- 見張り番にvercel-react-best-practices観点追加 ✅
- PandaCSS MCP導入済み ✅
- Planモードガイド追加（plan-mode.md） ✅ (2026-02-03)
