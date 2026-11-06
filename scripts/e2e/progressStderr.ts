let hasErrorHandler = false;

/** stderrだけに通知される任意表示の失敗を検証処理から切り離す。 */
export const writeProgressStderr = (message: string) => {
  try {
    const stderr = process.stderr;
    if (!hasErrorHandler) {
      // パイプ切断はwriteからの同期例外ではなく、後からerrorとして通知される。
      stderr.on('error', () => {});
      hasErrorHandler = true;
    }
    stderr.write(message);
  } catch {
    // 表示先への同期書き込みに失敗しても、検証と後始末を続ける。
  }
};
