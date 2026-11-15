# コード差分レビュー

対象は `0c7f6d9` からの高速化候補6コードファイル（workflow、environmentCommands本体/test、environmentProbeのexport、新規prepareCiRuntime本体/test）。Sol / mediumの3エージェントが設計・規約、安全性・バグ、性能・UXを独立レビューした。

## 評価

6観点ともOK。必須0件・推奨0件。固定5imageと公開schemaの取得元を統一し、CLI版・PG major・enabled設定・excludeのdrift回帰を確認した。新しい環境変数継承はregistry指定だけで、共有DBの資格情報・接続先の除外を維持する。

先読みはローカルDocker contextに限定し、image存在時はpullを省略する。固定引数の `docker pull --quiet` とChromium導入を並行する。imageだけのdeadline、Chromium失敗と外部取消による全体abort、allSettledの終了待機、timer/listener解放を確認した。先読みの通常失敗はfallback、Chromium失敗・取消は失敗として扱う。公開出力は固定scope/status/imageと有限時間だけでrawログや環境値を含まない。

## 検証と限界

候補21テスト、registry/command境界39テスト、型検査、readonly Biomeが成功。GHCRによる2回新規復元もmigration/catalog/cleanupが成功し、固定5imageのECR/GHCR image IDは一致した。CI YAMLの3 workerが共通wrapperを参照することを構文解析して確認した。

ここでの性能評価は設計の妥当性であり、速度改善の実証ではない。先読みtimeout時は最大120秒と終了待ちを費やした後に元の取得へ戻る。採否はHostedの準備＋start全体で判断する。registry変更と基準CIで28〜29秒だったChromium導入を重ねる効果を区別する。

終了保証は既存runLocalCommandの直接childと継承pipeのcloseまでで、pipeを切り離す孫processまでの終了証明はしない。新たなdetached processは作成しない。UI変更はない。詳細な3報告はignored `test-results/quality/db-start-candidate-{security,design,performance}-review.md` に保持する。

## ECR指定の追補レビュー

GHCR候補のHostedは成功したが2workerの準備時間が退行したため、従来のECRを3workerの共通job envで明示する追補を実施。変更はworkflowの4行追加と固定registry/image・fixtureの置換だけで、制御フローは不変。実装者とは別のSol / mediumエージェントによる再レビューは必須・推奨0件。

ECR設定は3workerだけに適用され、setupは非空の指定値を保持する。先読みとstartのregistryは一致し、他jobへ漏れない。remote Docker拒否・資格情報非出力・abort伝播・全close待機・timer/listener解放の不変を確認した。限定21テスト、readonly Biome、YAML展開による3worker継承とstep上書きなしの検査が成功。最終headのHosted実測・全体検証・artifact独立照合はPR本文に記録する。

## 実測後の採否レビュー

GHCR・ECRの両候補は全チェック・独立照合に成功したが、準備＋初回startの3worker平均は基準95.519秒に対して106.696 / 114.825秒、最大も退行した。ECRでは先読みfallbackが発生し直接原因は未分類。性能担当は既定CIからの先読み撤去を推奨し、親が証跡を照合して採用した。都合のよい再実行や一部workerの短縮だけでは採否を覆さない。

最終実装は既存Playwright install直呼びへ戻し、先読みwrapperと専用テストを撤去する。内訳計測・registry尊重・従来ECRの明示は維持する。本報告の先読み実装レビューは不採用候補の検討記録であり、現在の稼働仕様ではない。

撤去後の独立再レビューは必須・推奨0件。固定baseとの実効差分が安全な起動計測・registry限定継承・3worker限定ECRに収束し、secret非出力・observer障害隔離・abort/close/cleanupが維持されることを確認した。残る計測・command境界の78テストとreadonly Biomeが成功した。
