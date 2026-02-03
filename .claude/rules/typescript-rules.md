# TypeScript ルール

## 厳格さ

- **any禁止**: `any`は一切使用しない。型が不明な場合は`unknown`を使用
- **型アサーション**: `as`は最小限に。型ガードを優先
- **Non-null assertion**: `!`は使用禁止。Optional chainingを使用

```typescript
// NG
const data: any = response
const name = user!.name

// OK
const data: unknown = response
const name = user?.name ?? 'Unknown'
```

## 型定義

- **Props型**: コンポーネント名 + `Props`
  ```typescript
  type ButtonProps = {
    variant: 'primary' | 'secondary'
    onClick: () => void
  }
  ```
- **typeとinterface**: 基本的に`type`を使用。継承が必要な場合のみ`interface`
- **exportする型**: ファイル末尾にまとめてexport
  ```typescript
  // ファイル末尾
  export type { ButtonProps, ButtonVariant }
  ```

---

## 型の導出原則（Single Source of Truth）

**スキーマ・テーブル定義を Single Source of Truth（単一の信頼できる情報源）とする。**

型定義は以下の優先順位に必ず従うこと：

| 優先度 | 型の取得元 | 例 |
|--------|-----------|-----|
| 1 | ライブラリ公式の型 | `z.infer`, Supabase生成型, `FieldErrors` |
| 2 | 上記から推論された型 | `typeof schema` からの派生 |
| 3 | 最小限の独自型 | やむを得ない場合のみ |

## Supabase 生成型からの型導出

DB行データの型は `src/db/types.ts`（`supabase gen types typescript` で生成）から導出すること。

```typescript
// ✅ OK - Supabase生成型から導出
import type { Database } from '@/db/types'
type User = Database['public']['Tables']['users']['Row']
type NewUser = Database['public']['Tables']['users']['Insert']

// ❌ NG - テーブル定義と同等の独自型を作成
type User = {
  userId: string
  userName: string
  email: string | null
  createdAt: string
}
```

**注意**: Supabase REST APIはタイムスタンプを`string`（ISO形式）で返す。`Date`型ではない。

## Zod スキーマからの型導出

Zod スキーマが存在する場合、型定義は必ず `z.infer<typeof schema>` から取得すること。

```typescript
// schema.ts
export const userFormSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  age: z.number().optional(),
})

// ✅ OK - スキーマから型を導出
export type UserFormValues = z.infer<typeof userFormSchema>

// ❌ NG - スキーマと型を二重管理
export type UserFormValues = {
  name: string
  email: string
  age?: number
}
```

## React Hook Form との連携

React Hook Form の型もライブラリ提供の型を使用する。

```typescript
import { type FieldErrors, useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'

// ✅ OK - ライブラリの型を使用
type FormProps = {
  errors?: FieldErrors<UserFormValues>
}

// ❌ NG - 独自の簡略化型
type FormProps = {
  errors?: Record<string, string>
}
```

## z.input と z.infer の使い分け

`.default()` や `.transform()` を含むスキーマでは、入力型と出力型が異なる場合がある。

```typescript
const schema = z.object({
  name: z.string(),
  isActive: z.boolean().default(false),  // 入力時は省略可能
})

// 入力型（フォームのdefaultValues用）
type FormInput = z.input<typeof schema>
// { name: string; isActive?: boolean }

// 出力型（パース後のデータ用）
type FormOutput = z.infer<typeof schema>
// { name: string; isActive: boolean }
```

## 禁止パターン

| パターン | 問題点 |
|----------|--------|
| `Record<string, any>` | 型安全性が失われる |
| `Record<string, string>` | ライブラリの型を無視している |
| スキーマと同等の独自型 | 二重管理でズレが生じる |
| プリミティブへの安易な変換 | 型情報が失われる |

```typescript
// ❌ すべて禁止
type Errors = Record<string, string>           // FieldErrors を使う
type User = { id: string; name: string }       // Supabase生成型 を使う
type FormData = { [key: string]: unknown }     // z.infer を使う
```

## まとめ

1. **DBテーブル** → `Database['public']['Tables'][T]['Row']` / `['Insert']`（Supabase生成型）
2. **Zod スキーマ** → `z.infer<typeof schema>` / `z.input<typeof schema>`
3. **React Hook Form** → `FieldErrors<T>`, `UseFormReturn<T>` 等
4. **独自型は最終手段** → 上記で対応できない場合のみ
