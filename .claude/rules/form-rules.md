# フォームルール

## フォームライブラリ

- **React Hook Form**を使用してフォームの状態管理を行う
- 標準のReact state (`useState`) でフォームを管理しない

## バリデーション

- **必ずZodでバリデーションスキーマを定義する**
- `@hookform/resolvers/zod`を使用してReact Hook Formと連携する
- バリデーションスキーマはフォームコンポーネントと同階層に配置

## ファイル構成

- **Zodスキーマは必ず別ファイル（`schema.ts`）に分離する**
- スキーマファイルはフォームコンポーネントと同階層に配置

```
src/app/(main)/users/me/
├── page.tsx
├── _components/
│   ├── ProfileEditForm.tsx    # フォームコンポーネント
│   └── schema.ts              # Zodスキーマ定義
```

## 実装例

**schema.ts**:
```typescript
import { z } from 'zod'

export const profileFormSchema = z.object({
  name: z.string().min(1, '名前は必須です'),
  email: z.string().email('有効なメールアドレスを入力してください'),
  age: z.number().min(0, '年齢は0以上で入力してください').optional(),
})

// スキーマから型を導出してエクスポート
export type ProfileFormValues = z.infer<typeof profileFormSchema>
```

**ProfileEditForm.tsx**:
```typescript
'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { profileFormSchema, type ProfileFormValues } from './schema'

export const ProfileEditForm = () => {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ProfileFormValues>({
    resolver: zodResolver(profileFormSchema),
    defaultValues: {
      name: '',
      email: '',
    },
  })

  const onSubmit = async (data: ProfileFormValues) => {
    // フォーム送信処理
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <input {...register('name')} />
      {errors.name && <span>{errors.name.message}</span>}

      <input {...register('email')} />
      {errors.email && <span>{errors.email.message}</span>}

      <button type="submit" disabled={isSubmitting}>
        送信
      </button>
    </form>
  )
}
```

## 注意事項

- フォームの型は`z.infer<typeof schema>`でスキーマから導出する
- スキーマと型は`schema.ts`からエクスポートして使用する
- Server Actionsと組み合わせる場合も、クライアント側でZodバリデーションを行う
- エラーメッセージは日本語で記述する

---

# URL状態管理（nuqs）

## 概要

検索・フィルタリング画面など、URLクエリパラメータと状態を同期させる場合は**nuqs**を使用する。
`useState`でURLと状態を別々に管理しない。

## 使用場面

| 場面 | nuqs使用 | 備考 |
|------|----------|------|
| 検索条件 | ○ | URLで共有・ブックマーク可能にする |
| フィルタ | ○ | ページリロードで状態を維持 |
| ソート順 | ○ | URLで状態を表現 |
| ページネーション | ○ | ページ番号をURLに反映 |
| モーダル開閉 | △ | 必要に応じて |
| フォーム入力中 | ✕ | 送信後にURLに反映する場合のみ |

## ファイル構成

ページディレクトリに`searchParams.ts`を作成してパーサーを定義する。

```
src/app/(main)/scenarios/
├── page.tsx              # Server Component
├── searchParams.ts       # nuqsパーサー定義
└── _components/
    └── ScenariosContent.tsx  # Client Component（useQueryStates使用）
```

## パーサー定義

```typescript
// searchParams.ts
import {
  createSearchParamsCache,
  parseAsArrayOf,
  parseAsInteger,
  parseAsString,
  parseAsStringLiteral,
} from 'nuqs/server'

const sortOptions = ['newest', 'rating', 'playtime_asc', 'playtime_desc'] as const

export const searchParamsParsers = {
  systems: parseAsArrayOf(parseAsString).withDefault([]),
  tags: parseAsArrayOf(parseAsString).withDefault([]),
  minPlayer: parseAsInteger,
  maxPlayer: parseAsInteger,
  q: parseAsString.withDefault(''),
  sort: parseAsStringLiteral(sortOptions).withDefault('newest'),
}

export const searchParamsCache = createSearchParamsCache(searchParamsParsers)
```

## 使用例

**Server Component**:
```typescript
import { searchParamsCache } from './searchParams'

export default async function ScenariosPage({ searchParams }) {
  const params = await searchParamsCache.parse(searchParams)
  const { systems, tags, minPlayer, sort } = params
  // データ取得...
}
```

**Client Component**:
```typescript
'use client'
import { useQueryStates } from 'nuqs'
import { useTransition } from 'react'
import { searchParamsParsers } from '../searchParams'

export const SearchContent = () => {
  const [isPending, startTransition] = useTransition()
  const [queryParams, setQueryParams] = useQueryStates(searchParamsParsers, {
    history: 'push',
    scroll: false,
    shallow: false,
    startTransition,
  })
  // ...
}
```

## Zodとの連携時の注意

数値フィールドの空文字列処理に注意:

```typescript
// OK - 空文字列をundefinedに変換してから処理
const optionalNumber = (min: number, max: number) =>
  z.preprocess(
    (val) => (val === '' || val === undefined || val === null ? undefined : val),
    z.coerce.number().min(min).max(max).optional(),
  )
```

## パーサーの種類

| パーサー | 用途 | 例 |
|----------|------|-----|
| `parseAsString` | 文字列 | 検索キーワード |
| `parseAsInteger` | 整数 | ページ番号、件数 |
| `parseAsBoolean` | 真偽値 | フラグ |
| `parseAsArrayOf(...)` | 配列 | 複数選択フィルタ |
| `parseAsStringLiteral([...])` | リテラル型 | ソート順 |
| `parseAsJson<T>()` | JSON | 複雑なオブジェクト |
