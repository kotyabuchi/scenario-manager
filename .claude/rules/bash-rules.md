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
git add .claude/requirements/requirements-auth.md
```
