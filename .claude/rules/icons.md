# Icons（アイコン）

## プロジェクト方針

**絵文字（emoji）は一切使用せず、`@phosphor-icons/react` のSVGアイコンコンポーネントを使用する。**

## Weight バリアント

Phosphor Icons は6種類の weight バリアントを提供する:

| weight | 用途 |
|--------|------|
| `regular`（デフォルト） | 通常のアウトラインアイコン |
| `fill` | 塗りつぶし（お気に入りON、選択状態等） |
| `bold` | 太線（強調、spinner等） |
| `light` | 細線 |
| `thin` | 極細線 |
| `duotone` | 二色調 |

## サイズ

デフォルトは `"1em"`（親の font-size に追従）。固定サイズが必要な場合は `size` prop を指定:

```typescript
<Star size={16} />        // 固定16px
<Star />                  // 親のfont-sizeに追従
```

## Import パス（重要）

**全ファイルで `@phosphor-icons/react/ssr` から import する。**

```typescript
// OK - SSR 互換（Server/Client 両方で動作）
import { Star, Calendar } from '@phosphor-icons/react/ssr'

// NG - Server Component で createContext エラーになる
import { Star, Calendar } from '@phosphor-icons/react'
```

`@phosphor-icons/react` は内部で `React.createContext()` を使用するため、Server Component で直接 import するとビルドエラーになる。`/ssr` エントリポイントは context を使わないため安全。

## 使用例

```typescript
// NG - 絵文字の使用
<span>★</span>
<span>📅</span>
<button>✏️ 編集</button>

// OK - @phosphor-icons/react/ssr の使用
import { Star, Calendar, PencilSimple } from '@phosphor-icons/react/ssr'

<Star weight="fill" color={styles.colors.filled} />
<Calendar size={16} />
<button><PencilSimple size={16} /> 編集</button>
```

## よく使うアイコン

| 用途 | @phosphor-icons/react |
|------|----------------------|
| お気に入り | `Star`, `Heart` |
| 編集 | `PencilSimple`, `PencilLine` |
| 削除 | `Trash`, `X` |
| メニュー | `DotsThreeVertical`, `List` |
| カレンダー | `Calendar`, `CalendarX` |
| 時間 | `Clock`, `Timer` |
| ユーザー | `User`, `Users`, `UserPlus` |
| チェック | `Check`, `CheckCircle` |
| 警告 | `Warning`, `WarningCircle` |
| 情報 | `Info` |
| リンク | `Link`, `ArrowSquareOut` |
| 共有 | `ShareNetwork` |
| 再生 | `Play`, `PlayCircle`, `FilmSlate` |
| 非表示 | `EyeSlash` |
| 表示 | `Eye` |
| 戻る | `ArrowLeft`, `CaretLeft` |
| 検索 | `MagnifyingGlass`, `MagnifyingGlassMinus` |
| フィルター | `Funnel` |
| 設定 | `GearSix` |
| ログイン/ログアウト | `SignIn`, `SignOut` |
| ローダー | `SpinnerGap` |
| アップロード | `UploadSimple` |
| コピー | `Copy` |
| サイドバー | `SidebarSimple` |
