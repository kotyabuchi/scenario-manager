# DB環境計時とread再照合の差分レビュー

対象は `654314cc90c596902756a69e802bd49df085d5ba` からのcode9ファイル。Sol/mediumの3エージェントが設計・規約、セキュリティ・バグ、性能・CLI UXを独立確認した。必須指摘0。

- 計時は固定operationと単調時計、呼出の成否だけを記録する。時計・出力障害でも元の処理と例外、abort後のcleanup、未確認環境のlock保持を変えない。
- raw FS/TypeScript/Gitの操作と全引数をqueryとして内部adapterが生成する。初回の全read/hash・guard順は保持し、同query異値や失敗は共有を拒否する。
- matchesごとにfresh実readを行い、最初に現れたqueryの順序を維持する。保存内容はclosureとdigestで、本文cacheや照合間の成功cacheは持たない。
- queryとcallbackの対応は内部APIの信頼前提。外部providerへ任意descriptorを公開する場合は強制できる設計が別途必要。並行FS変更の原子的snapshot保証はない。
- `completed`は呼出完了であり、論理的なcleanup成功は既存receiptを見る。親子spanを合計しない。

性能観点の推奨は、診断harnessの集計費用と本体matchesの費用を区別し、固定順序・OS cache・他処理負荷の限界を明記すること。診断試行のwallを本体改善率やCI短縮率へ読み替えない。測定harnessも別途監査し、無効な試行を受入から除外する。

限定回帰・型・readonly lintと全体quality、Hostedの受入は別の実行証拠で確認する。詳細は [計画](../plans/e2e-runtime-read-performance.md) とignored `test-results/quality/runtime-read-{security,design,performance}-review.md`。

親による受入: 再実行quality `40f4d5f38c73` と成果物独立照合が成功。必須67・extras312・legacy330行、入力不変、6 DB cleanup・7 process終了を確認。初回のlocalhost接続失敗は未解明として計画に保持した。測定harnessの修正版も独立監査し、診断・中断試行は改善値から除外した。Hostedの最終受入はPR本文に記録する。
