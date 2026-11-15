# Hosted E2E catalog fingerprint の保存計画

## 目的と現在の経路

固定 HEAD `e3bbe743fe325c71ee36492cdf26447d089ffbbd` を基点とする。`checkEnvironmentCatalog` は既存の public/Auth 等の対象 metadata を正規化・安定直列化して SHA-256 の `fingerprint` を計算し、固定期待値と照合する。`probeEnvironment` は成功した結果を `replay.json` と各 runner の返値に持つが、`runVerificationStages` は cleanup 等だけを stage receipt に移し、Hosted CI の5ファイル shard artifact には fingerprint を保存していない。

保存するのは**この既存 fingerprint** であり、新しい SQL・DB 全体・seed 行データの hash ではない。seed の存在は別の既存 guard で検証される。既存 fingerprint は seed 行を含まない。これは対象 metadata の同一性の証拠であり、全 DB 行、Storage schema/API 全体、全アプリ認可や実際の認可動作を保証しない。既存の `authorizationStatus: not-verified` を変えない。

## 実装案

1. `verificationSchema.ts` の stage に小さな versioned `catalogEvidence` を追加する。公開値は固定バージョン、stage ID、環境 owner run ID、64桁16進 fingerprint、既存 catalog 検証の成功状態に限定する。生 catalog、SQL、環境 URL、JWT、鍵、例外文や private log を入れない。既存 stage context と環境 run ID を照合し、証拠を別 stage へ移動できないようにする。想定 stage は integration・isolated・4 legacy project の計6 DB stage。Storybook は DB を起動しないため証拠の対象外とし、証拠が付いていた場合は拒否する。
2. `runVerificationStages.ts` で integration/isolated/legacy の各 `probeEnvironment` 完了返値から fingerprint を直接取り出し、`passed`、`migrationReplayPassed`、`schemaParityPassed`、`catalogStatus === verified`、指紋形式と run ID を確認した場合だけ同じ stage に格納する。失敗・中断・未実行は欠測のままにし、成功の値を補完しない。cleanup やテスト成功条件は現行のまま維持する。異常を公開証拠に変換するとき、生データをログに出さない。

   `passed` は catalog guard 単独でなく、probe が管理する browser/test 操作と環境 cleanup を含む成功を指す。catalog 照合後にその操作または cleanup が失敗した場合、catalog 成功自体はあっても公開 stage 証拠には昇格させない。従来の stage 失敗と cleanup の記録を維持し、後段の catalog 欠測エラーで元の失敗理由を上書きしない。
3. 既存の `receipt.json` に含めれば、今ある `ciShard.ts` の allowlist と `.github/workflows/test.yml` の shard artifact upload に乗り、別ファイルの upload や秘密を含む workdir の公開は不要。`ciShardArtifacts.ts` の CI 専用検証で、各 shard の実行 plan が要求する DB stage に証拠が一意に存在し、stage/run と `execution.runs` が一致し、Storybook には存在せず、適切な形式・成功状態であることを検査する。`ciPartitionAggregate.ts` で全3 shard の plan に対応する証拠を重複なく集約し、`aggregate/receipt.json` に stage・owner ID・fingerprint を保存する。現在の実 CI plan は6 DB stage を要求し、その6件を Hosted 実行でも確認する。縮小 test fixture には縮小 plan が要求する全件を検証し、別途6 stage fixture の欠落負例を用意する。現行 envelope の workflow/head/run/attempt と manifest・verification ID の照合、および artifact の同 attempt 名は維持する。
4. fingerprint の改変検出は、実測値と、**同じ既存 canonical 化処理で固定期待 catalog から導出した期待 fingerprint** の照合、および各 stage/run/shard の紐付けで行う。期待 hash を実行結果や定数のコピーから生成しない。既存の catalog parity 成功と新しい evidence の一致を CI shard と aggregate の両方で検証する。形式が正しいだけの任意 hash、別 stage の値、owner 重複、別 head/run/attempt、欠落や不一致は失敗させる。これは信頼された runner と GitHub artifact 経路を前提とした整合性検査であり、攻撃者が実行時に全証跡を偽装することを防ぐ署名ではない。
5. **境界は CI shard envelope の schemaVersion 2 → 3 とする。** stage schema は `catalogEvidence` を optional で追加し、汎用ローカルの旧 receipt は欠測を「未記録」のまま読める。値が存在する場合は汎用 receipt validator でも stage/owner・期待 fingerprint・成功状態を必ず検証する。一方、新 CI v3 は各必要 stage の存在・一致を必須にする。新 validator は v2 を新契約の成功として受け入れず、当時の v2 artifact は当時のコード・契約で保管・検証する。version を書き換えても必須証拠・各 binding・期待値照合で拒否し、欠測を期待値で補完しない。失敗・欠測時には既存の安全な failure artifact を使い、成功 artifact に偽装しない。

### stage 追加を選ぶ理由

別 sidecar は receipt と run の結合・追加 allowlist・upload/download 欠落や差替えの検査を新設する必要がある。fingerprint は既に runner の `environment` 返値にあり、stage receipt と同時に確定させれば、既存の厳密な stage/run・verification ID・envelope workflow/head/run/attempt の検証と5ファイル allowlist を再利用できる。stage field 自体は旧ローカル receipt 用に optional とし、**v3 CI の shard/aggregate で必須**にすることで広い互換性と新契約の fail-closed を両立する。aggregate receipt にも version を明示し、利用者が v2 の過去結果と v3 の証拠付き結果を区別できるようにする。既存 artifact を書き換えない。

## 想定変更ファイル

- `scripts/e2e/environmentCatalog.ts`：期待 fingerprint を既存 canonical と同一の公開ヘルパーから導出。比較の正本を二重管理しない。
- `scripts/e2e/verificationSchema.ts`、`verificationReceipt.ts`、`runVerificationStages.ts`：型・受け渡し・旧 receipt と新 CI の検査境界。
- `scripts/e2e/ciShardArtifacts.ts`、`ciPartitionAggregate.ts`：stage ごとの必要性、由来、fingerprint と aggregate の検証・公開。必要なら `ciPartitionSchema.ts` / fixture を更新。
- 上記に対応する `environmentCatalog.test.ts`、`runVerificationStages` 関連 test、`verificationReceipt.test.ts`、`ciPartitionAggregate.test.ts`、`ciRuntime.test.ts` と CI fixture。実際のファイル名は既存配置に合わせる。
- 原則 workflow の新 artifact path は不要。実装時に artifact allowlist を再確認し、必要な変更があれば明示する。

## 検証・受入

- canonical fingerprint が従来と変わらず、期待値の導出と実測の一致、seed の有無と metadata hash の役割の違いを単体検査する。
- 6 DB stage の各経路で成功値が同じ owner run と stage に残り、Storybook では残らないこと、失敗・中断で成功証拠を捏造しないことを検査する。
- 既存7 stage runner fixture で6件の伝播と Storybook 対象外を検査し、縮小4 DB stage CI fixture で plan 由来の肯定・欠落負例を検査する。加えて固定 HEAD の Hosted 実 artifact 6 stage を独立受入し、そのコピーから integration/isolated の各欠落・owner/hash 誤りを作って実 CI validator/aggregate が拒否することを確認する。元 artifact を変更・再 upload しない。
- 旧 receipt の missing は未記録として読めても、新 CI では拒否。hash 欠落・形式不正・改変・stage/owner 取違え・重複、head/run/attempt 混在、shard 欠落を negative test で拒否。既存の artifact、plan、入力 snapshot、テスト、DB 分離、cleanup の検査を弱めない。
- 汎用ローカル receipt に証拠が存在する場合も、stage/owner の不一致、期待 hash と異なる値、成功でない状態、Storybook への混入を拒否する負例を含める。旧 receipt での欠測だけを許容し、不正な証拠を黙って無視しない。
- 新しい証拠の受け渡し経路に SQL 本文・接続 URL・JWT・ローカル path・生の例外文の sentinel を投入し、成功・失敗・中断・不正値それぞれで shard receipt・aggregate receipt・failure artifact・公開ログに漏れないことを確認する。公開を許す version/stage/run ID/fingerprint/status の allowlist を検証し、従来の failure 機構全体の不要な改修は行わない。
- catalog 一致・fingerprint 正常でも DB cleanup 未完了、残留 resource、process cleanup 失敗があれば stage/shard/aggregate を成功にしない負例を追加する。fingerprint は既存 cleanup gate の代替にはならない。
- schema/receipt/shard/aggregate と runner の関連テスト、Biome・型検査を実施。固定 commit 後に `pnpm quality:changed --base <直前HEAD>` と Hosted workflow を実行し、同一 head/run/attempt の aggregate に6件が保存されることを独立確認する。必要な実環境検証は親と調整し、Docker Desktop の起動・停止や共有リソースの変更は行わない。

## 実装時の検証記録

stage 証拠、旧 receipt と CI v3 の境界、固定期待 catalog の既存正規化からの期待 fingerprint、shard/aggregate の保存を実装。関連5 test files の159件、追加した CI partition・CLI・runtime・aggregate の4 files の106件、対象ファイルの Biome、型検査は成功した。CI の不正 catalog 証拠について、SQL・URL・JWT・path・例外の sentinel が failure artifact と公開 stderr に出ないことを検査した。`quality:changed`、固定 commit、Hosted 検証は未実施であり、ここで成功とは扱わない。
