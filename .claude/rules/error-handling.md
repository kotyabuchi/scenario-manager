# エラーハンドリング

## Result型パターン

`src/types/result.ts`で定義された共通のResult型を使用する。

```typescript
// src/types/result.ts（共通定義）
export type Result<T, E = Error> =
  | { success: true; data: T }
  | { success: false; error: E }

// ヘルパー関数
export const ok = <T>(data: T): Result<T, never> => ({ success: true, data })
export const err = <E = Error>(error: E): Result<never, E> => ({ success: false, error })

// 型ガード
export const isOk = <T, E>(result: Result<T, E>): result is { success: true; data: T } =>
  result.success
export const isErr = <T, E>(result: Result<T, E>): result is { success: false; error: E } =>
  !result.success
```

## 使用例

```typescript
import { type Result, ok, err } from '@/types/result'

const fetchUser = async (id: string): Promise<Result<User>> => {
  try {
    const user = await db.query.users.findFirst({ where: eq(users.id, id) })
    if (!user) {
      return err(new Error('User not found'))
    }
    return ok(user)
  } catch (e) {
    return err(e instanceof Error ? e : new Error('Unknown error'))
  }
}

// 呼び出し側
const result = await fetchUser(id)
if (!result.success) {
  console.error(result.error)
  return
}
const user = result.data
```

## Server Actionsでのエラー

```typescript
'use server'

import { type Result, ok, err } from '@/types/result'

const createScenario = async (data: FormData): Promise<Result<Scenario>> => {
  // バリデーション
  const parsed = scenarioSchema.safeParse(data)
  if (!parsed.success) {
    return err(new Error(parsed.error.message))
  }

  // DB操作
  // ...
}
```

## Null/Undefinedチェック

### ramdaのisNilを使用

`null`と`undefined`のチェックには`ramda`の`isNil`を使用し、片方の漏れを防ぐ。

```typescript
import { isNil } from 'ramda'

// OK
if (isNil(value)) {
  // null または undefined の場合
}

if (!isNil(value)) {
  // 値が存在する場合
}

// NG - 片方が漏れる可能性
if (value === null) { }
if (value === undefined) { }
if (!value) { }  // 0や空文字もfalseになる
```

### 使い分け

| 関数 | 用途 |
|------|------|
| `isNil(x)` | `x === null \|\| x === undefined` |
| `isEmpty(x)` | 空配列、空オブジェクト、空文字列のチェック |
| `isNotNil(x)` | `!isNil(x)` の代替 |

### Optional Chainingとの併用

```typescript
// 値の取得時はOptional Chaining
const name = user?.profile?.name

// 存在チェックはisNil
if (!isNil(name)) {
  // nameが存在する場合の処理
}
```
