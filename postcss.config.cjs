module.exports = {
  plugins: {
    // Storybook を隔離ディレクトリから起動しても、プロジェクト内のソースを抽出する。
    '@pandacss/dev/postcss': { cwd: __dirname },
  },
};
