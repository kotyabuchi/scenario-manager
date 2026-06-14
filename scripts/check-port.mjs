// 指定ポートが使用中なら即座に失敗するプリフライトチェック。
// `pnpm dev` の前に predev フックから実行され、ポート使用中に next dev が
// 3001 へ勝手にフォールバックするのを防ぐ（3000 固定運用を保証する）。
import net from 'node:net';

const port = Number(process.argv[2] ?? 3000);

// listen を試みて EADDRINUSE なら使用中と判定する。
// ホスト未指定の listen は Node 既定で IPv6 `::`（デュアルスタック）に bind するため、
// next dev と同じ bind 挙動で衝突を検知できる。
const tester = net
  .createServer()
  .once('error', (err) => {
    if (err.code === 'EADDRINUSE') {
      console.error(
        `\n[predev] ポート ${port} は使用中です。3001 へフォールバックせず停止しました。`,
      );
      console.error('[predev] 使用中プロセスを終了してから再実行してください:');
      console.error(
        `  netstat -ano | findstr :${port}   →   taskkill /PID <PID> /F\n`,
      );
      process.exit(1);
    }
    console.error(`[predev] ポート確認中に予期しないエラー: ${err.message}`);
    process.exit(1);
  })
  .once('listening', () => {
    tester.close(() => process.exit(0));
  })
  .listen(port);
