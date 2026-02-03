# コーディング規約

このファイルは基本的な規約のインデックスです。詳細な実装ガイドは個別のルールファイルを参照してください。

## ルールファイル一覧

| ファイル | 内容 |
|---------|------|
| `typescript-rules.md` | TypeScript厳格さ、型の導出原則（Single Source of Truth） |
| `react-rules.md` | コンポーネント定義、Server/Client Components、楽観的更新 |
| `styling-rules.md` | PandaCSS、スタイル定義ファイル、UIデザインガイドライン |
| `form-rules.md` | React Hook Form + Zod、URL状態管理（nuqs） |
| `error-handling.md` | Result型パターン、Null/Undefinedチェック |

---

## 1. 基本設定

### フォーマッター・リンター
- **ツール**: Biome
- **インデント**: スペース2つ
- **クォート**: シングルクォート
- **セミコロン**: なし

```bash
pnpm check    # lint + format を一括実行
pnpm lint     # lint のみ
pnpm format   # format のみ
```

---

## 2. 命名規則

### ファイル・フォルダ
| 対象 | 形式 | 例 |
|------|------|-----|
| コンポーネントフォルダ | PascalCase | `Button/`, `SearchForm/` |
| コンポーネントファイル | PascalCase | `Button.tsx`, `SearchForm.tsx` |
| ページディレクトリ | kebab-case | `scenarios/`, `game-sessions/` |
| ユーティリティ | camelCase | `formatDate.ts`, `useAuth.ts` |
| 定数ファイル | camelCase | `constants.ts`, `config.ts` |

### 変数・関数
| 対象 | 形式 | 例 |
|------|------|-----|
| 変数 | camelCase | `userName`, `isLoading` |
| 関数 | camelCase | `handleClick`, `fetchData` |
| 定数 | UPPER_SNAKE_CASE | `MAX_RETRY_COUNT`, `API_BASE_URL` |
| 型・インターフェース | PascalCase | `User`, `ScenarioFormProps` |
| Enum値 | UPPER_SNAKE_CASE | `UserRole.MEMBER`, `SessionPhase.RECRUITING` |

### 命名のルール
- **Boolean**: `is`, `has`, `can`, `should` プレフィックス
- **イベントハンドラ**: `handle` プレフィックス + 動詞
- **カスタムフック**: `use` プレフィックス

---

## 3. Import順序

Biomeの設定により自動整理される。手動で書く場合は以下の順序:

1. React関連
2. 外部パッケージ
3. 内部モジュール（lib）
4. 相対パス
5. 型のみのインポート

---

## 4. コメント

### 言語
- コメント、JSDoc、TODO: **日本語**
- 変数名、関数名: **英語**

### JSDoc
公開APIや複雑なロジックには必ず記述。

### TODO/FIXME
```typescript
// TODO: ページネーション対応
// FIXME: N+1クエリを修正
```

---

## 5. Gitコミット

### Conventional Commits形式
```
<type>(<scope>): <subject>

<body>

<footer>
```

### Type
| Type | 用途 |
|------|------|
| `feat` | 新機能 |
| `fix` | バグ修正 |
| `docs` | ドキュメントのみ |
| `style` | コードの意味に影響しない変更 |
| `refactor` | バグ修正でも機能追加でもないコード変更 |
| `perf` | パフォーマンス改善 |
| `test` | テスト追加・修正 |
| `chore` | ビルドプロセスやツールの変更 |

---

## 6. テスト

### ファイル配置
コンポーネントと同階層に配置:
```
Button/
├── Button.tsx
├── Button.test.tsx      # ユニットテスト
└── Button.stories.tsx   # Storybook（ビジュアルテスト）
```

### 命名
```typescript
describe('Button', () => {
  it('クリック時にonClickが呼ばれる', () => { ... })
  it('disabled時はクリックできない', () => { ... })
})
```

---

## 7. ディレクトリ構造

### ページディレクトリの構成
```
src/app/(main)/scenarios/
├── page.tsx           # ページコンポーネント（Server Component）
├── styles.ts          # ページのスタイル定義
├── interface.ts       # ページで扱う型定義
├── adapter.ts         # DB操作関数
├── _components/       # ページ固有のコンポーネント
└── [id]/              # 動的ルート
```

### ファイルの責務
| ファイル | 責務 |
|----------|------|
| `page.tsx` | UIレンダリング、Server Component |
| `styles.ts` | スタイル定義（css, cva） |
| `interface.ts` | 型定義（Supabase生成型から導出） |
| `adapter.ts` | DB操作（Supabase Client） |
| `_components/` | ページ固有のUIコンポーネント |
| `actions.ts` | Server Actions（必要な場合） |

---

## 8. セマンティックHTML

**見た目ではなく意味に基づいてHTML要素を選択する。**

| 目的 | 正しい要素 | 誤った実装 |
|------|-----------|-----------|
| セクション区切り | `<hr>` | `border-top`を持つ`<div>` |
| ナビゲーション | `<nav>` | `<div>` |
| メインコンテンツ | `<main>` | `<div>` |
| ボタン | `<button>` | クリック可能な`<div>` |
| リンク | `<a>` | クリック可能な`<span>` |

見出しの階層:
- `<h1>`〜`<h6>`は階層構造を守る
- 見た目のサイズはCSSで調整

---

## 9. 禁止事項

- `any`型の使用
- `!`（Non-null assertion）の使用
- `console.log`の本番コードへの残留
- マジックナンバー・マジックストリング
- インラインスタイル（style属性）
- `var`の使用
- `==`による比較（`===`を使用）
- 未使用のimport・変数
- フォームの状態管理に`useState`を使用すること
- Zodを使用しないフォームバリデーション
- セマンティックHTMLを無視した実装
- URLと同期すべき状態を`useState`で管理すること
