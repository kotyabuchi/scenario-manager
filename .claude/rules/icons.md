# Icons（アイコン）

## プロジェクト方針

**絵文字（emoji）は一切使用せず、`lucide-react` のSVGアイコンコンポーネントを使用する。**

## 使用例

```typescript
// NG - 絵文字の使用
<span>★</span>
<span>📅</span>
<button>✏️ 編集</button>

// OK - lucide-react の使用
import { Star, Calendar, Pencil } from 'lucide-react';

<Star className={iconStyle} />
<Calendar size={16} />
<button><Pencil size={16} /> 編集</button>
```

## よく使うアイコン

| 用途 | lucide-react |
|------|-------------|
| お気に入り | `Star`, `Heart` |
| 編集 | `Pencil`, `Edit` |
| 削除 | `Trash2`, `X` |
| メニュー | `MoreVertical`, `Menu` |
| カレンダー | `Calendar` |
| 時間 | `Clock` |
| ユーザー | `User`, `Users` |
| チェック | `Check`, `CheckCircle` |
| 警告 | `AlertTriangle` |
| リンク | `Link`, `ExternalLink` |
| 共有 | `Share2` |
| 再生 | `Play`, `Video` |
| 非表示 | `EyeOff` |
| 表示 | `Eye` |
| 戻る | `ArrowLeft`, `ChevronLeft` |
