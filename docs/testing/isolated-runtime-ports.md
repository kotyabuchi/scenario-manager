# 専用テスト環境のポート方針

`e2e/isolatedRuntime.ts` を固定値の唯一の定義元とする。

| 用途 | ポート |
| --- | --- |
| Supabase shadow | 27320 |
| Supabase API | 27321 |
| Supabase DB | 27322 |
| Next production | 23100 |
| Storybook preview | 6007 |

すべて1024以上32768未満に置き、Windowsの既定TCP動的範囲49152–65535とLinuxの既定32768–60999を避ける。範囲・サービス間の重複・開発用ポートとの重複は `scripts/e2e/isolatedRuntime.test.ts` が検査する。

根拠: [Microsoft Learn](https://learn.microsoft.com/en-us/troubleshoot/windows-client/networking/tcp-ip-port-exhaustion-troubleshooting)、[Linux kernel](https://docs.kernel.org/networking/ip-sysctl.html#ip-variables)。OSの範囲を独自設定した環境で空きを保証するものではない。

## 衝突時の調査

2026-11-06は旧57320–57322をCodex本体の外向きHTTPS接続がBound/CloseWaitで保持した。テストプロセスや専用DBコンテナの残存ではなかった。Codex再起動を通常の復旧手順にせず、テストの待受を既定動的範囲外へ移す。

WindowsではListenだけに絞らず、全状態と所有PIDを確認する。

```powershell
Get-NetTCPConnection | Where-Object LocalPort -in 27320,27321,27322,23100,6007 |
  Select-Object LocalPort,RemotePort,State,OwningProcess
netsh interface ipv4 show dynamicport tcp
netsh interface ipv6 show dynamicport tcp
netsh interface ipv4 show excludedportrange protocol=tcp
netsh interface ipv6 show excludedportrange protocol=tcp
```

衝突したPIDの作成時刻・親プロセス・コマンドを確認し、今回起動した処理かを識別する。通常の外向き通信は相手先443などの接続も持ち、テスト待受とは異なる。他アプリやCodex本体を強制終了しない。

SupabaseとNextの専用環境では、worktree/project/portのグローバルlock、全IPv4/IPv6 interfaceのbind検査、所有nonceとリソースidentityの照合を維持する。StorybookのpreviewはIPv4 loopbackの127.0.0.1とstrictPortを使い、既存serverを再利用しない。品質側のStorybook runnerは起動前にもIPv4 loopbackの空きを検査する。使用中ポートを無視した起動や、実行ごとの無作為なポート変更は行わない。予約を確認した専用環境だけを起動し、終了時にその環境の資源とlockを回収する。OSのポート設定は変更しない。

## 実機検証

修正後の起動・catalog照合・cleanupの結果は、各worktreeの `test-results/environments/` と再開記録に記録する。ポートのbindだけの成功をDB復元や全E2Eの成功として扱わない。
