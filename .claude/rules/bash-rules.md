# Bashコマンド実行ルール

## cdの禁止（最重要）

**`cd` を使うな。作業ディレクトリはプロジェクトルートで維持されている。**

```bash
# ❌ 絶対にやるな
cd /c/Development/Nextjs/scenario-manager && git status
cd /c/Development/Nextjs/scenario-manager && pnpm dev

# ✅ 直接実行しろ
git status
pnpm dev
```

サブディレクトリのファイルを指定する場合も相対パスで十分:

```bash
# ✅ OK
pnpm vitest run src/components/Button/Button.test.tsx
git add ".claude/requirements/requirements-auth.md"
```

## ファイルパスは必ずダブルクォートで囲む（必須）

**ファイルパスを引数に取るコマンドでは、パスを必ず `"` で囲むこと。**

括弧 `()` やスペースを含むパスでエラーになるのを防ぐ。

```bash
# ❌ クォートなし - 括弧でシンタックスエラー
git add src/app/(main)/layout.tsx

# ✅ ダブルクォートで囲む
git add "src/app/(main)/layout.tsx"
git add "src/app/(auth)/login/page.tsx" "src/context/index.ts"
```

複数ファイルを追加する場合も、各パスを個別にクォート:

```bash
# ✅ OK
git add "src/hooks/useAuth.ts" "src/context/auth-context.tsx"
```
