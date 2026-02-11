# シナリオ自動取り込み機能 — 著作権対策と実装計画

## Context

Booth・TALTOなどの外部サイトからシナリオ情報を自動取り込みする機能を追加したい。
転載と見なされないよう、著作権法上のリスクを整理し、安全な設計を行う。

**既存実装**: `src/app/(main)/scenarios/new/` にMVP完了のシナリオ新規作成フォーム（ScenarioForm.tsx）が存在する。

**UIアーキテクチャ**: インポートは専用の単一ページ `/scenarios/import` で完結する。
- 「シナリオ登録」→ 既存の `/scenarios/new`（手動入力）
- 「URLからインポート」→ `/scenarios/import`（2ステップ: URL入力 → フォーム入力）
- サイトごとにページを分けない（1ページで Booth/TALTO 両対応）
- フィールドの編集可否はサイト特性に応じて制御:
  - TALTO（TRPG特化・フォーマット固定）: 構造化フィールドは readOnly
  - Booth（汎用マーケット・自由記述）: タイトル・作者名のみ readOnly、人数・時間は編集可

---

## 決定事項

| 項目 | 方針 | 理由 |
|------|------|------|
| 概要文（description） | **ユーザー手動入力のみ** | 自動取り込みで概要文を保存すると複製権侵害（転載）。手動入力ならユーザー責任。 |
| 画像（サムネイル） | **ユーザーアップロード** | Hotlinkingはブロックされやすい。アップロードならプロバイダ責任制限法でカバー。 |
| 自動取り込み範囲 | **事実情報のみ**（タイトル、作者名、人数、時間） | 事実情報は著作物に該当しない。ただしサイト特性により抽出精度が異なる。 |
| フィールド編集可否 | **サイト特性で制御** | TALTO（構造化）→ readOnly、Booth（非構造化）→ 人数・時間は編集可 |
| 対象サイト | **Booth + TALTO** | TRPG シナリオの主要配布先2つ。 |
| canonical | **設定しない** | レビュー・セッション記録等の独自コンテンツで差別化するため。 |

---

## 法的リスクの整理

### 1. 概要文（description）の転載リスク — 最重要

**問題**: Boothの商品説明文は著作物。DBに保存し表示する行為は:
- **複製権侵害**（著作権法21条）: DBへの保存自体が「複製」
- **公衆送信権侵害**（著作権法23条）: Webで表示する行為

**「引用」（著作権法32条）として認められるための要件:**
1. 公表された著作物であること
2. 引用する側が「主」、引用される側が「従」 → シナリオ情報ページでは概要文が主コンテンツになりがちで「従」と言い難い
3. 出典の明示 → 対応可能
4. 引用の必然性 → シナリオ管理目的で全文掲載する必然性は弱い

**結論**: 概要文のそのままの取り込みは引用の要件を満たしにくく、転載と判断されるリスクが高い。

### 2. 画像の直リンク（Hotlinking）リスク

- Boothのサーバーから直接画像を読み込む = Boothの帯域を消費
- 多くのサービスがhotlinkingを利用規約で禁止
- リファラチェックでブロックされる可能性が高い

### 3. ユーザーによる著作物アップロードの責任

プロバイダ責任制限法により、プラットフォームの免責条件:

| 状況 | プラットフォームの責任 |
|------|---------------------|
| 侵害を知らなかった | 免責 |
| 知ることができなかった | 免責 |
| 権利者から通知を受け、迅速に対応した | 免責 |
| 知っていて放置した | 責任あり |

### 4. スクレイピング自体のリスク — 調査完了（2026-02-10）

#### 調査対象と結果

| サイト | 利用規約URL | robots.txt | API | スクレイピング明示的禁止 |
|--------|-----------|------------|-----|----------------------|
| BOOTH | [pixiv共通規約](https://policies.pixiv.net/index.html) | `/terms`, `/carts`, `/cart` のみ Disallow。**商品ページは制限なし** | なし | ガイドラインに「クローラーで商品を収集する行為」禁止あり。ただし2025年10月に方針変更 |
| TALTO | [talto.cc/terms](https://talto.cc/terms) | `/login`, `/signup`, `/search` 等のみ Disallow。`/projects/*` は Discord/Twitter bot に明示的 Allow | なし | 明示的禁止なし。「他のユーザーの情報収集」「過度な負荷」の間接的禁止あり |

#### BOOTH（pixiv）の規約詳細

- **pixiv共通規約§14-3**: 「本サービスを…商業・営業目的の活動…を目的とした利用をすること」を禁止
- **pixiv共通規約§14-21**: 「通常の範囲を超えて本サービスのサーバーに負担をかける行為」を禁止
- **BOOTHガイドライン**: 「クローラーなどのプログラムを使って商品を収集する行為」「サーバに極端な負荷をかける行為」を禁止
- **2025年10月の方針変更**: pixivが「**常識的な範囲のスクレイピングを許容**」する方針を発表（[ITmedia報道](https://www.itmedia.co.jp/news/articles/2510/10/news119.html)）。検索・レコメンデーション等の**利便性向上目的は「歓迎」**と明言。ただし「悪質なスクレイピング行為は対象外」

#### TALTO（ココフォリア）の規約詳細

- **§11 禁止事項**: 「他のユーザーの情報収集」「サービスネットワーク又はシステム等に過度な負荷をかける行為」「商業目的、又は第三者に利益を与える目的で利用する行為」を禁止
- **§15 知的財産権**: コンテンツの著作権はユーザー（作者）に帰属。運営者はサービス改良・品質向上の範囲で利用可能
- **包括条項**: 「その他、運営者が不適切と判断する行為」

#### 「商業目的」条項の解釈

両サイトとも「商業目的での利用」を禁止しているが、これは **当該サービス自体を商業の場として利用する行為**（出品・販売・宣伝等）を指す。

scenario-managerの利用形態との関係:
- scenario-managerは **TRPG のプレイ記録管理ツール** であり、BOOTH/TALTOと競合するサービスではない
- シナリオの中身（概要文・画像）を転載・再販売するわけではなく、ユーザーが自分のプレイ記録として必要な **事実情報（タイトル、作者名、人数、時間）のみ** を取得する
- 配布元リンクを必須化しており、むしろ元サイトへの誘導を行っている
- Google検索（商業サービス）がBOOTH/TALTOのページをインデックスするのと同様、公開ページの事実情報を参照する行為は「サービスの商業利用」には該当しない
- BOOTH robots.txt で商品ページへのアクセスが許可されていること、TALTOがDiscord/Twitter bot にプロジェクトページへのアクセスを明示的に許可していることも、メタデータの外部参照が想定されていることを示す

**結論: 「商業目的」条項への抵触リスクは低い。** ただし、運営元への事前連絡で確認を取ることを推奨（後述の残タスク参照）。

#### リスク評価

| リスク項目 | BOOTH | TALTO | 根拠 |
|-----------|-------|-------|------|
| 著作権侵害 | **低** | **低** | 事実情報（タイトル、作者名、人数、時間）は著作物ではない。概要文・画像は取り込まない |
| 「商業目的」条項 | **低** | **低** | サービス自体を商業利用するわけではなく、公開情報のメタデータ参照のみ（上記の解釈参照） |
| 「情報収集」条項 | — | **低〜中** | 個人情報の無断収集を想定した条項と解釈されるが、拡大解釈の余地あり |
| サーバー負荷 | **低** | **低** | 1件ずつ取得、レートリミット（1分5回）、タイムアウト10秒 |
| 不正アクセス禁止法 | **低** | **低** | 公開ページのみ、ログイン不要 |
| 不正競争防止法 | **低** | **低** | 配布元リンク必須で元サイトへ誘導。コンテンツ転載なし |
| 規約変更リスク | **中** | **中** | 将来的に明示的なスクレイピング禁止条項が追加される可能性。パーサーの無効化で対応可能 |

#### 参考資料

- [pixiv利用規約](https://policies.pixiv.net/index.html)
- [BOOTH「常識的な範囲のスクレイピング」許容方針（ITmedia, 2025年10月）](https://www.itmedia.co.jp/news/articles/2510/10/news119.html)
- [法律・規約・慣習から見るBoothとスクレイピング（法的分析ブログ）](https://linghua.hatenablog.com/entry/huronnA)
- [TALTO利用規約](https://talto.cc/terms)
- [ココフォリア利用規約](https://ccfolia.com/termsOfService.html)

### 5. 不正競争防止法・フリーライド

- 他サイトのコンテンツで自サービスの価値を高める行為
- 大量に転載してBoothへのアクセスを減らす場合は問題
- **本プロジェクトの対策**: 概要文・画像は取り込まず事実情報のみ、配布元リンクを必須化して元サイトへ誘導しており、フリーライドには該当しない

---

## 対策

### 必須対策（法的リスク回避）

1. **概要文は自動取り込みしない** — ユーザーが自分の言葉で記入
2. **画像はユーザーアップロード** — Cloudflare R2 or Supabase Storageに保存
3. **配布元リンクの必須化** — 自動取り込みしたシナリオは `distribute_url` 必須
4. **出典の明示** — UI上で「Boothで詳細を見る」リンクを目立たせる

### スクレイピングマナー対策

1. **User-Agent ヘッダーの明記**: リクエスト時に `scenario-manager/1.0 (+連絡先URL)` を User-Agent に設定し、身元を明かす
2. **robots.txt の遵守**: BOOTH・TALTO の robots.txt で Disallow されたパスにはアクセスしない
3. **リクエスト間隔**: 1リクエストあたり1秒以上の間隔を保証
4. **配布元リンクの目立つ表示**: 元サイトへの誘導を積極的に行い、フリーライド批判を防ぐ

### セキュリティ対策（SSRF・XSS）

1. **URLドメインのホワイトリスト**:
   - 許可ドメイン: `booth.pm`, `talto.cc`
   - パーサー呼び出し前にドメイン検証を必須化
   - `localhost`、プライベートIP、`file://` プロトコルをブロック
   - 実装: `src/lib/scenario-fetcher/url-validator.ts` にドメイン検証関数を配置

2. **パーサー出力のサニタイズ**:
   - パーサーが抽出した文字列（タイトル、作者名等）をサニタイズしてからDB保存
   - HTMLタグの除去、制御文字の除去を実施
   - React側のデフォルトエスケープに加え、DB層でも安全な値を保証

3. **外部フェッチの制限**:
   - `AbortController` で10秒タイムアウトを設定
   - レスポンスサイズ上限（5MB）を設定
   - URL解析リクエストのレートリミット（ユーザーあたり1分5回）

4. **解析結果のキャッシュ**:
   - MVPではキャッシュを見送る（Cloudflare Pages の Edge Runtime ではリクエストごとにワーカーが異なり、プロセス内メモリキャッシュは事実上無効なため）
   - 将来的に負荷が問題になった場合、Cloudflare Cache API (`caches.default`) または KV の導入を検討
   - レートリミット（1分5回）で外部サイトへの過剰アクセスは防止済み

### 利用規約・通報機能（プロバイダ責任制限法準拠）

1. **利用規約に明記**:
   - 著作権者の許諾なく画像・文章をアップロードしないこと
   - 違反した場合の措置（コンテンツ削除、アカウント制限）
2. **アップロード時の確認**:
   - 「この画像の利用権限を持っています」チェックボックス
3. **通報/削除要請機能**:
   - 権利者が削除を要請できる窓口（フォーム or メールアドレス）
   - 通報を受けたら合理的な期間内に削除

### データソース管理

- `source_type`: Supabase ENUM型 `scenario_source_type` で定義（'manual', 'booth', 'talto'）
- `source_url`: TEXT型（PostgreSQLではTEXT推奨）
- `source_fetched_at`: 最終取得日時

### `source_url` と `distribute_url` の関係

- `source_url`: パーサーがHTML取得に使用した元URL（システム内部管理用）
- `distribute_url`: ユーザー向けの配布ページリンク（UI表示用、既存フィールド）
- **インポート時は両方に同じURLをセットする**（Booth/TALTOの場合、取得元URL = 配布ページURL）
- 登録時に既存の `checkDistributeUrlDuplicate()` で重複チェックを実施し、既にインポート済みのURLは「既に登録済みです」エラーを表示
- URL正規化（末尾スラッシュ除去等）は `checkDistributeUrlDuplicate()` の既存ロジックを適用

---

## UIフロー

### ルーティング構造

| パス | 用途 |
|------|------|
| `/scenarios/new` | オリジナル登録（既存、変更なし） |
| `/scenarios/import` | URLインポート登録（Booth/TALTO共通） |

### インポートページの2ステップフロー（同一ページ内）

```
Step 1: URL入力
┌──────────────────────────────────────┐
│  URLからシナリオ情報をインポート     │
│                                      │
│  [https://booth.pm/...             ] │
│                                      │
│  対応サイト: Booth, TALTO            │
│                                      │
│  [取り込む]                          │
│                                      │
│  手動で入力する場合は こちら →       │
└──────────────────────────────────────┘

   ↓ URL解析成功

Step 2: フォーム入力
┌──────────────────────────────────────┐
│  インポート元: Booth                 │
│  [配布ページを見る →]               │
│                                      │
│  ── インポート済み情報 ──            │
│  シナリオ名  [◆◆◆◆◆◆◆◆] ← readOnly │
│  作者名      [◆◆◆◆◆◆◆◆] ← readOnly │
│  プレイ人数  [3〜5人     ] ← ※1     │
│  プレイ時間  [4〜6時間   ] ← ※1     │
│                                      │
│  ── 手動入力 ──                      │
│  概要文      [              ]        │
│  システム    [CoC7th ▼      ]        │
│  タグ        [ホラー, 探索  ]        │
│  画像        [アップロード  ]        │
│                                      │
│  [登録する]                          │
└──────────────────────────────────────┘

※1 フィールド編集可否はサイト特性で決定:
  - TALTO（TRPG特化・フォーマット固定）→ readOnly
  - Booth（汎用・自由記述）→ 編集可能（初期値としてセット）
```

### パーサー出力のフィールド信頼度

パーサーは各フィールドに「信頼度」を付与し、UIの readOnly/編集可能を制御する。

| フィールド | TALTO | Booth | 理由 |
|-----------|-------|-------|------|
| タイトル | readOnly | readOnly | ページタイトルから確実に取得可能 |
| 作者名 | readOnly | readOnly | 販売者名から確実に取得可能 |
| プレイ人数 | readOnly | 編集可能 | Booth: 概要文に自由記述、抽出精度低い |
| プレイ時間 | readOnly | 編集可能 | Booth: 概要文に自由記述、抽出精度低い |
| 配布URL | readOnly | readOnly | ユーザー入力のURL |

Boothで人数・時間が抽出できなかった場合は空欄のまま（ユーザーが入力）。

### プレイ時間の単位変換ルール

既存DBは `min_playtime` / `max_playtime` を**秒単位**で保存している。パーサーが抽出する値の変換ルール:

| ソース | 抽出される単位 | 変換処理 |
|--------|--------------|---------|
| TALTO | 分単位（構造化データ） | `× 60` で秒に変換 |
| Booth | 時間 or 分（テキスト解析） | テキストから単位を判定し秒に変換 |

- パーサーは **秒単位に正規化した値** を `ParsedField<number>` で返す
- UIでの表示は既存 `ScenarioForm` と同じ変換ロジック（秒 → 時間/分）を使用
- 単位が判別できない場合は値を `null` とし、ユーザーに手動入力させる

### URL解析の流れ

```
1. ユーザーが /scenarios/import にアクセス
2. URL入力してサブミット
3. URLドメインをホワイトリストで検証（SSRF対策）
3.5. `distribute_url` の既存重複チェック（`checkDistributeUrlDuplicate()`）を実施
   → 既に登録済みの場合は「このURLのシナリオは既に登録されています」エラーを表示し、解析を中止
4. Server Actionでページ構造を解析（タイムアウト10秒、サイズ上限5MB）
5. 「事実情報」のみ抽出し、サニタイズ処理
6. 解析成功 → 同一ページ内でフォームに切り替え（React stateで保持）
   解析失敗 → エラー表示 + 手動入力(/scenarios/new)への導線
7. ユーザーが残りを手動入力して登録
8. 登録時にソース情報を自動記録:
   - source_type: 'booth' | 'talto'
   - source_url: 入力されたURL
   - source_fetched_at: 現在時刻
```

---

## DBスキーマ変更

```sql
-- ENUM型の作成
CREATE TYPE scenario_source_type AS ENUM ('manual', 'booth', 'talto');

-- カラム追加
ALTER TABLE scenarios ADD COLUMN source_type scenario_source_type DEFAULT 'manual';
ALTER TABLE scenarios ADD COLUMN source_url TEXT;
ALTER TABLE scenarios ADD COLUMN source_fetched_at TIMESTAMPTZ;
```

---

## 実装ステップ

### Step 1: DBスキーマ変更 + 型再生成
- Supabaseマイグレーションファイルで ENUM型 `scenario_source_type` を作成
- カラム追加（source_type, source_url, source_fetched_at）
- `supabase gen types typescript` で型再生成
- `src/db/enum.ts` に `SourceTypes` Enum定義を追加

### Step 1.5: HTMLパーサー PoC（技術検証）
- Cloudflare Pages（Edge Runtime）環境で cheerio が動作するか検証
- 検証項目:
  - cheerio のバンドルサイズ（約200KB gzipped）が Cloudflare Pages 制限（圧縮後1MB）に収まるか
  - Server Action 内での cheerio の `load()` / セレクタ動作確認
  - `pnpm build:cloudflare` でビルドが通るか
- **結果が NG の場合**: API Route を `nodejs` ランタイム（`export const runtime = 'nodejs'`）で実行する設計に切り替え
- PoC結果を本計画書に追記してから Step 2 に進む

### Step 2: 外部サイトパーサーの実装
- `src/lib/scenario-fetcher/` ディレクトリ作成
  - `url-validator.ts` — URLドメインのホワイトリスト検証（SSRF対策）
  - `sanitizer.ts` — パーサー出力のサニタイズ処理（XSS対策）
  - `booth-parser.ts` — Booth商品ページから事実情報を抽出
  - `talto-parser.ts` — TALTOシナリオページから事実情報を抽出
  - `types.ts` — パーサー共通型定義（`ScenarioParser` インターフェース、`ParsedField<T>` 信頼度型）
- `ParsedField<T>`: 値 + `confidence: 'high' | 'low'` でフィールドの信頼度を表現
  - `high` → UI上で readOnly（TALTO の構造化フィールド等）
  - `low` → UI上で編集可能・初期値としてセット（Booth の人数・時間等）
  - 値が `null` → 抽出失敗、ユーザーが手動入力
- パーサーの戻り値は `Result<ParsedScenario>` 型を使用（`error-handling.md` 準拠）
- **HTML構造変更耐性**: 必要なセレクタが見つからない場合、パーサーは `err()` を返す。ユーザーには「解析に失敗しました。URLを確認するか、手動で入力してください」と表示し、`/scenarios/new` への導線を提供
- **パーサーエラー通知（実装は劣後可）**: パーサーが連続してエラーを返す場合、サイトのHTML構造が変更された可能性が高い。Discord Webhook で管理者に即時通知する
  - 通知条件: 同一サイト種別で直近1時間に N 回以上のパーサーエラー（閾値は運用で調整）
  - 通知内容: サイト種別、エラー内容、直近のエラー回数、発生時刻
  - 実装: `src/lib/scenario-fetcher/notifier.ts` に通知ロジックを配置
  - Webhook URL は環境変数 `DISCORD_PARSER_ERROR_WEBHOOK_URL` で管理
- エラーログは `LogTape` を使用（`logging.md` 準拠）
- HTMLパーサーはEdge Runtime互換性を考慮し選定:
  - 第一候補: `cheerio`（軽量、Edge Runtime対応の可能性が高い）
  - フォールバック: API Routeを `nodejs` ランタイムで実行
  - 実装前にCloudflare Pages環境での動作確認を実施
- テスト: HTMLフィクスチャベースのユニットテスト
  - フィクスチャ配置: `src/lib/scenario-fetcher/__fixtures__/` ディレクトリに Booth・TALTO の HTML スナップショットを保存
  - ファイル命名: `booth-product-page.html`, `talto-scenario-page.html` 等
  - 更新手順: HTML構造が変更された場合、実際のページを再取得してフィクスチャを更新 → パーサーのセレクタを修正 → テスト通過を確認
- Server Action でサーバーサイドフェッチ（URL解析用のレートリミット付き）

### Step 3: インポート登録ページの実装
- `/scenarios/import` ページ新規作成（Booth/TALTO共通）
- 2ステップ構成（同一ページ内、React stateで状態管理）:
  - Step 1: URL入力 → Server ActionでURL解析
  - Step 2: 解析結果をフォームに展開 → 残りを手動入力 → 登録
- `ImportScenarioForm.tsx`:
  - パーサー出力の `confidence` に基づき readOnly/編集可能を制御
  - readOnlyフィールドの視覚的区別: 背景色 `gray.50`、ロックアイコン（`lucide-react` の `Lock`）を付与。セマンティックトークン `input.readonly.bg` を `semanticTokens.ts` に定義
  - TALTO: 構造化フィールド（人数・時間）は readOnly
  - Booth: タイトル・作者名のみ readOnly、人数・時間は編集可能（初期値セット or 空欄）
  - ユーザー入力フィールド（概要文、システム、タグ、画像）は常に編集可能
  - 登録時に source_type, source_url, source_fetched_at を自動付与
- Zodスキーマは `import/_components/schema.ts` に専用定義
- Server Actionは `import/actions.ts` に専用定義（URL解析 + 登録）
- 解析中のローディング表示、失敗時のエラー表示 + `/scenarios/new` への導線

### Step 4: シナリオ一覧ページへの導線追加
- 一覧ページにインポート用の導線を追加（「URLからインポート」リンク or ボタン）

### Step 5: UI改善
- シナリオ詳細ページで配布元リンクを目立たせる
- 出典情報（source_type）の表示
- 「この情報に問題がありますか？」リンク

### Step 6: 利用規約・通報機能
- 利用規約ページの作成/更新
- 画像アップロード時のチェックボックスUI
- 通報フォーム or 連絡先の表示

---

## 実装ファイル（予定）

| ファイル | 変更内容 |
|---------|---------|
| **DB・型** | |
| `supabase/migrations/xxx.sql` | ENUM型作成 + カラム追加 |
| `src/db/types.ts` | 再生成（新カラム反映） |
| `src/db/enum.ts` | `SourceTypes` Enum定義追加 |
| **パーサー** | |
| `src/lib/scenario-fetcher/url-validator.ts` | URLドメインホワイトリスト検証 |
| `src/lib/scenario-fetcher/sanitizer.ts` | パーサー出力サニタイズ |
| `src/lib/scenario-fetcher/booth-parser.ts` | Booth固有の情報解析 |
| `src/lib/scenario-fetcher/talto-parser.ts` | TALTO固有の情報解析 |
| `src/lib/scenario-fetcher/types.ts` | パーサー共通型・`ParsedField<T>`信頼度型 |
| `src/lib/scenario-fetcher/notifier.ts` | パーサーエラーの Discord Webhook 通知（劣後可） |
| `src/lib/scenario-fetcher/__fixtures__/` | テスト用HTMLフィクスチャ |
| **インポート登録ページ** | |
| `src/app/(main)/scenarios/import/page.tsx` | インポートページ（Booth/TALTO共通） |
| `src/app/(main)/scenarios/import/actions.ts` | URL解析 + 登録Server Action |
| `src/app/(main)/scenarios/import/_components/ImportScenarioForm.tsx` | 2ステップフォーム |
| `src/app/(main)/scenarios/import/_components/UrlInputStep.tsx` | Step 1: URL入力 |
| `src/app/(main)/scenarios/import/_components/schema.ts` | Zodスキーマ |
| `src/app/(main)/scenarios/import/_components/styles.ts` | スタイル定義 |
| **既存ファイル変更** | |
| `src/app/(main)/scenarios/adapter.ts` | `createScenario()` に source_type, source_url, source_fetched_at パラメータ追加 |
| `src/app/(main)/scenarios/interface.ts` | `CreateScenarioInput` 型に source 関連フィールド追加 |
| `src/lib/rateLimit.ts` | `parse_scenario_url` アクションのレートリミット定義追加 |
| **既存ページ修正** | |
| `src/app/(main)/scenarios/_components/` | インポート導線の追加 |
| `src/app/(main)/scenarios/[id]/` | 配布元リンクの表示改善 |

---

## 検証方法

### 自動テスト
1. パーサーのユニットテスト（HTMLフィクスチャベース）:
   - Booth URLから事実情報のみが抽出されることを確認
   - TALTO URLから事実情報のみが抽出されることを確認
   - 概要文・画像URLがパーサー出力に含まれないことを確認
2. URLバリデーションのユニットテスト:
   - ホワイトリスト外ドメインが拒否されることを確認
   - `localhost`、プライベートIPが拒否されることを確認
3. サニタイザーのユニットテスト:
   - HTMLタグ、スクリプトが除去されることを確認
4. E2Eテスト:
   - /scenarios/import でURL入力 → 解析 → フォーム表示の2ステップ遷移
   - TALTO: 構造化フィールド（人数・時間）が readOnly であることを確認
   - Booth: 人数・時間フィールドが編集可能であることを確認
   - 手動フィールド入力 → 登録のフロー
   - 解析失敗時のエラー表示と /scenarios/new への導線

### 手動テスト
5. 画像がhotlinkingされていないことを確認
6. ユーザーアップロード画像がCloudflare R2に保存されることを確認
7. 配布元リンクが目立つ位置に表示されることを確認
8. アップロード時のチェックボックスが機能することを確認
9. source_type, source_url が正しくDBに保存されることを確認

---

## 残タスク

### 運営元への事前連絡（リリース前に実施）

利用規約の調査で直接的な問題は確認されなかったが、誠意と信頼構築のために両サービスの運営元に事前連絡を行う。

| 連絡先 | 運営元 | 連絡内容 |
|--------|--------|---------|
| pixiv株式会社（BOOTH） | https://booth.pixiv.help/ | scenario-managerの概要、BOOTH商品ページからの事実情報（タイトル・作者名・人数・時間）の自動取得について許諾確認 |
| ココフォリア株式会社（TALTO） | https://talto.cc/ の問い合わせ窓口 | scenario-managerの概要、TALTOシナリオページからの事実情報の自動取得について許諾確認 |

**連絡時に伝えるポイント**:
- scenario-managerはTRPGのプレイ記録管理ツールであること
- 概要文・画像は一切取り込まず、事実情報（タイトル、作者名、プレイ人数、プレイ時間）のみであること
- 配布元リンクを必須化し、元サイトへの誘導を行っていること
- レートリミット（1分5回）、User-Agent明記等の技術的配慮を実施していること
- 将来的に収益化を予定していること

**連絡のタイミング**: 実装完了後、リリース前。デモ画面のスクリーンショット等を添付するとわかりやすい。
**連絡結果の対応**:
- 許諾が得られた場合: そのまま機能を公開
- 条件付き許諾の場合: 条件に合わせて実装を調整
- 拒否された場合: 該当サイトのパーサーを無効化し、手動入力のみに切り替え
