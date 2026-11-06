# コード差分レビュー

> **レビュー日時**: 2026-11-06
> **対象範囲**: HEAD `55fd789` からの未コミット変更として実施し、`345f0a8`までの4コミットへ記録（docs除外）
> **変更ファイル数**: 14 files
> **総合評価**: A（修正後のコードレビュー。新hosted checkは実行待ち）
> **レビューモード**: パラレル（Sol / mediumの3エージェント、担当外の独立確認と親集約）

## 変更サマリー

履歴再生の正常終了直後に限り子プロセスの自然消滅を短時間待つ。既知の失敗だけを固定の工程と区分へ変換してCIへ伝え、Linuxで固定履歴そのものを実再生するcheckを追加した。

### 変更ファイル

| ファイル | 追加 | 削除 | 種別 |
| --- | --- | --- | --- |
| `.github/workflows/test.yml` | +14 | -0 | 変更/追加 |
| `scripts/e2e/ci.ts` | +3 | -1 | 変更/追加 |
| `scripts/e2e/ciCli.test.ts` | +74 | -1 | 変更/追加 |
| `scripts/e2e/ciDiagnostics.test.ts` | +35 | -0 | 変更/追加 |
| `scripts/e2e/ciDiagnostics.ts` | +7 | -0 | 変更/追加 |
| `scripts/e2e/staticLedgerFailure.ts` | +8 | -1 | 変更/追加 |
| `scripts/e2e/surfaceHistoryCheck.test.ts` | +276 | -0 | 変更/追加 |
| `scripts/e2e/surfaceHistoryCheck.ts` | +142 | -0 | 変更/追加 |
| `scripts/e2e/surfaceMigrationReplay.test.ts` | +35 | -3 | 変更/追加 |
| `scripts/e2e/surfaceMigrationReplay.ts` | +21 | -5 | 変更/追加 |
| `scripts/e2e/surfaceMigrationReplayProcess.test.ts` | +186 | -3 | 変更/追加 |
| `scripts/e2e/surfaceMigrationReplayProcess.ts` | +73 | -17 | 変更/追加 |
| `scripts/e2e/surfaceReplayFailure.test.ts` | +48 | -0 | 変更/追加 |
| `scripts/e2e/surfaceReplayFailure.ts` | +57 | -0 | 変更/追加 |

## 評価詳細

### 1. コーディング規約準拠 OK

公開診断はZod strict schemaから型を導出し、固定の12工程・6区分へ限定する。日本語コメント、既存のimport/format、型検査を確認した。

### 2. 設計・保守性 OK

停止理由は先着を保持する。process未確認の例外を診断へ変換する前にscratch保持を決め、成功proofや回収条件を変えない。単独checkは実イベント承認・plannerと分けている。

### 3. セキュリティ OK

privateな型識別とstrict再検証により模倣・追加key・任意message/causeを拒否する。公開は今回保存したJSONだけに限定し、GITHUB_OUTPUTは既存runnerファイルへNOFOLLOW/APPENDで固定markerを追記する。診断log、コマンド引数、PIDやpathはuploadしない。

### 4. パフォーマンス OK

猶予は正常close後の残留に限り最大250ms、既存50ms間隔で確認する。終了済みgroupには追加待機なし。Linuxの履歴再生には独立install/旧静的検査のコストがあるため、15分のjob枠は実hosted runでも確認する。

### 5. UX・アクセシビリティ OK

既存のCI code/phase/run/attemptと中断コードを維持し、既知の再生失敗にだけ具体的な工程・区分を追加する。stdoutは安全な最終JSON。artifactやmarkerの保存失敗でも成功を返さない。

### 6. バグ・ロジックエラー OK

自然消滅、永続残留、中断、timeoutとabortの両順、非zero/spawn失敗、停止未確認を検証した。native checkは固定proof、前後HEAD、中断cleanup待ちと必須I/Oの失敗を検証する。

## 指摘一覧

### 必須（マージ前に修正すべき）

残件0。1件を修正し独立再確認した。

| 対象 | 指摘と対応 |
| --- | --- |
| .github/workflows/test.yml / surfaceHistoryCheck | 書込に失敗しても固定パスの旧成果物を公開し得た。今回の保存完了markerを出す経路とupload条件を結び、古いJSON保持＋書込失敗でmarkerなしを検証した。 |

### 推奨（対応が望ましい）

残件なし。追加したworkflowコメントは日本語へ統一した。

### 検討（余裕があれば）

数値PGIDの照会とsignal間の再利用競合は従来の所有モデルの制約として残る。今回の猶予は既存groupのESRCH確認を要求し、範囲外processを探索・停止する処理は加えない。

## 良い点

- 実processで旧版の誤拒否と候補の自然終了・残留停止・中断停止を比較し、返却時のgroup消滅まで確認した。
- 診断と公開範囲を具体化しながら、既存の承認、planner、aggregate、入力証明の判定を維持した。

## 検証と総合所見

関連8 files /79 tests、型検査、Biome、actionlint成功。固定旧移行の実再生proofも従来と一致した。独立レビューの必須指摘は解消済み。新CLIとworkflowの実hosted成功、15分枠は公開後に確認する。

旧main push attempt 2・3の失敗と同じ原因だったかは未確定。今回の自然終了の誤拒否は別に実証済みであり、過去の失敗結果を書き換えたり初回pushの承認を代替したりしない。