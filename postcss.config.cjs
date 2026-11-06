const storybookRoot = process.env.STORYBOOK_PROJECT_ROOT;

module.exports = {
  plugins: {
    // 隔離した Storybook だけ実ルートを渡す。Turbopack は __dirname を仮想化する。
    '@pandacss/dev/postcss': storybookRoot ? { cwd: storybookRoot } : {},
  },
};
