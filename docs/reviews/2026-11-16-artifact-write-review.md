# 差分レビュー: 所有manifestの保存診断と限定retry

対象は `4f2c9bf402294adf53afaa53c5fc00d6a99afee8` からの差分。security / bug、design / 規約、performance / UX の3観点を独立に確認し、未解消の必須・推奨指摘はない。

- 保存失敗とcleanup失敗は固定operationと許可systemCodeだけで別々に保持し、生例外・path・内容を公開しない。排他作成とidentityを確認できない一時fileは削除しない。strict manifest/receiptは維持し、診断sidecarの保存不能は元の失敗やcleanupを変更しない。
- retryはWindowsの所有environment manifest保存に限り、rename EPERM/EBUSYのみ最大5回。snapshot不能なら初回renameは維持し、失敗後のretryは拒否する。retry前に親・target・tmpのidentityとtarget内容を照合し、変更や不明時は元の失敗を保持する。照合とrenameの間はatomic CASではない。
- 1保存につき待機は最大775ms、同期のためevent loopとabort通知が遅れる。通常成功lifecycleで7保存、極端な全保存retryでは待機最大5.425秒に加えFS照合時間が発生する。共通保存にもtmp identity確認のFS処理が加わる。一般artifactにはtarget hashやretryを追加しない。
- 同FSの各600回・固定順1試行は旧1,433ms、候補2,184ms、候補にwait 1回・最終失敗0。小標本で負荷や照合・待機の影響を分離できず、性能や旧障害の原因・根治を証明しない。旧71aのEPERM操作は未確定。

実装担当の限定4 suite 98 tests、型互換修正後のartifact 18 tests、Biome、全体typecheckは成功。台帳checkは意味不変の型互換修正前に69登録、issues/policy delta 0で成功した。レビュー担当は実DB・browser・全体qualityを実行していない。固定後のfull quality・Hostedと独立受入は未実施。
