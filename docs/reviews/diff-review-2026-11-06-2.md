# コード差分レビュー

> **レビュー日時**: 2026-11-06
> **対象範囲**: HEAD `0b14ff2b5924d6b34f942561d9e573a85f6cd6e2` からのBatch 4未コミット変更（未追跡含む、docs除外）
> **変更ファイル数**: 25 files
> **総合評価**: A（修正後のコードレビュー）
> **レビューモード**: パラレル（Sol / mediumの3エージェント、親が集約）

## 変更サマリー

選択準備の段階とrun別レシートを可視化し、UI不足の識別子・既知コードと詳細成果物への導線を追加した。必須の証跡保存と任意の表示を分離し、ブラウザ・環境・後始末の最初の失敗段階を保持する。

### 変更ファイル

| ファイル | 追加 | 削除 | 種別 |
| --- | --- | --- | --- |
| `scripts/e2e/environmentProbe.test.ts` | +25 | -0 | 変更 |
| `scripts/e2e/environmentProbe.ts` | +8 | -1 | 変更 |
| `scripts/e2e/ledgerCheck.ts` | +37 | -34 | 変更 |
| `scripts/e2e/legacyProjectRun.test.ts` | +68 | -2 | 変更 |
| `scripts/e2e/legacyProjectRun.ts` | +14 | -3 | 変更 |
| `scripts/e2e/prepareChangedVerification.test.ts` | +121 | -1 | 変更 |
| `scripts/e2e/prepareChangedVerification.ts` | +25 | -12 | 変更 |
| `scripts/e2e/qualityChanged.test.ts` | +96 | -1 | 変更 |
| `scripts/e2e/qualityChanged.ts` | +22 | -1 | 変更 |
| `scripts/e2e/run.test.ts` | +44 | -0 | 変更 |
| `scripts/e2e/run.ts` | +5 | -1 | 変更 |
| `scripts/e2e/runChangedVerification.test.ts` | +95 | -8 | 変更 |
| `scripts/e2e/runChangedVerification.ts` | +30 | -12 | 変更 |
| `scripts/e2e/runLegacy.test.ts` | +52 | -1 | 変更 |
| `scripts/e2e/runLegacy.ts` | +12 | -6 | 変更 |
| `scripts/e2e/selectionConsoleSummary.ts` | +1 | -0 | 変更 |
| `scripts/e2e/surfaceMigration.test.ts` | +10 | -4 | 変更 |
| `scripts/e2e/surfaceMigration.ts` | +9 | -5 | 変更 |
| `scripts/e2e/ledgerCheck.test.ts` | +181 | -0 | 新規 |
| `scripts/e2e/progressStderr.test.ts` | +67 | -0 | 新規 |
| `scripts/e2e/progressStderr.ts` | +16 | -0 | 新規 |
| `scripts/e2e/selectionProgress.ts` | +33 | -0 | 新規 |
| `scripts/e2e/staticLedgerFailure.ts` | +62 | -0 | 新規 |
| `scripts/e2e/surfacePendingDiagnostic.test.ts` | +158 | -0 | 新規 |
| `scripts/e2e/surfacePendingDiagnostic.ts` | +100 | -0 | 新規 |

## 評価詳細

### 1. コーディング規約準拠 OK

新規コードにany、non-null assertion、任意console出力はない。進捗と診断の型は既存の型から導出し、存在判定をisNilへ統一した。実リポジトリのBiome検査と型検査を通過した。

### 2. 設計・保守性 OK

run別・latest・親レシートの必須保存を行ってから、任意の表示を呼ぶ。表示の同期throw・Promise reject・stderrの非同期EPIPEを必須I/Oの失敗から分離した。静的検査の開始通知が失敗してもstatic証跡をfailedへ更新する。

### 3. セキュリティ OK

診断は固定種別と既知17コード、長さ制限と制御文字除去済みの識別子だけを公開する。任意例外、stack、anchor、ソース本文を転記しない。承認・入力証明・台帳拒否・所有権・cleanupの判定を維持した。

### 4. パフォーマンス OK

進捗は段階の遷移でだけ保存し、追加の型解析やテスト収集はない。UI診断の索引化・全件整形は不足を拒否した経路だけ。解析再利用は次のBatch 5で別途計測する。

### 5. UX・アクセシビリティ OK

CLIのstdout最終JSONを保ち、stderrに準備段階を表示する。最終JSONには既存latestパスに加えてrun別パスを返す。UI不足は表示10件・詳細全件を分け、未知診断文を公開しない。不正引数の固定使用法も維持した。

### 6. バグ・ロジックエラー OK

browserとevidenceの失敗を分離し、起動・照合と後始末が両方失敗した場合にも初回段階を保持する。fixtureの非throw incompleteも記録する。停止・保存失敗、自然なNoOp、shadow、最終snapshot検査の回帰を確認した。

## 指摘一覧

### 必須（マージ前に修正すべき）

残件0。重複排除後の4件を修正し、独立した再レビューで確認した。

| 対象 | 指摘と対応 |
| --- | --- |
| prepareChangedVerification | 開始通知失敗でrunningが残る問題を、失敗保存のtry境界へ含めて修正。 |
| progressStderr / selectionProgress / staticLedgerFailure | 非同期EPIPEで後続cleanup前に終了する問題を、stderr専用writerと実pipeの回帰で修正。 |
| environmentProbe | start/verifyとcleanupの両失敗で初回phaseが消える問題を、保存済みmanifestからの初回phase保持で修正。 |
| legacyProjectRun | browser失敗がevidenceへ化ける問題を、最初の失敗の即時記録で修正。 |

### 推奨（対応が望ましい）

残件0。probeの起動失敗の引継ぎ、fixture cleanup incomplete、CLIの固定使用法、isNil、既知diagnosticCode、run別パスの6件を反映した。

### 検討（余裕があれば）

今回の差分に残件なし。

## 良い点

- 証跡を必須、表示を任意として扱うため、表示の障害が検証と回収を中断せず、保存の障害が成功へ化けない。
- 診断を具体化しつつ、任意例外の公開と既存の拒否条件の緩和を避けている。

## 検証

lint/type成功。アプリ単体1097成功・既存skip8、基盤140 files / 2013成功。品質run `bfdcba603dcb`、selection `00240fce47fb`、verification `91020b7ccbec` は必須55成功・旧E2E312登録・7 stagesとcleanupを照合し成功した。入力digestは実行前後で一致し、core437/UI658の不足は維持している。

## 総合所見

3観点の再レビューを統合し、今回の差分の必須・推奨指摘は解消した。既存mainの初回push CI失敗と、別途再現した歴史再生process終了監視の誤拒否は今回の25ファイルに含まれず、修正候補・診断を別の差分として扱う。旧失敗を成功へ読み替えない。