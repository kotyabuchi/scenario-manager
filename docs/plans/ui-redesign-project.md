# アプリ全体のデザイン刷新

更新日: 2026-09-28
作業ブランチ: `feature/ui-redesign-scenarios`

## 目的と現在地

シナリオ一覧・詳細で実装した緑基調の画面を基準に、残る画面と共通部品を段階的に揃える。現時点で実画面を見ながら調整したのは主にシナリオ一覧・詳細とサイドメニューであり、他の画面が同じトークンを使っていても移行完了とは判定しない。

このファイルは横断的な作業台帳。シナリオ画面固有のルーティング・検索・2ペイン仕様は [ui-redesign-scenarios.md](ui-redesign-scenarios.md) と [実装状況](ui-redesign-scenarios-status.md) を参照する。全体の面・色の方針は [design-direction.md](../redegins/design-direction.md) を参照する。

## 完了の判断基準

1. **実画面**: 現行のシナリオ一覧・詳細と、背景・面・輪郭・影・文字・余白・操作色の関係が揃っている。白や灰色があるだけで旧デザインとはしない。
2. **実装**: 静的な色・影・サイズは既存セマンティックトークンを優先し、有効なPandaCSS指定になっている。未定義トークン、任意値に紛れたトークン名、生の旧アクセントを残さない。破壊的操作や状態表示の色は意味に従って使い分ける。
3. **動作**: 開閉、バリデーション、送信中、成功、失敗、再試行、スクロール、フォーカス復帰を維持する。入力エラーで編集内容を失わない。
4. **表示確認**: 少なくともデスクトップ `1440×900` とスマホ `390×844` の実レンダリングを確認し、長文・エラー・狭幅を含む主要状態をStorybookまたは実画面で確認する。

デザイントークンの使用は必要条件であり、単独では完了条件ではない。画像生成モックは方向性の提案であり、正確な文言・寸法・機能の承認済み仕様ではない。

## 対象と進捗

状態: `基準` = 比較対象、`現状撮影済` = 未設計、`提案作成済` = 画像候補のみ、`実装中` = 一部の状態を実装・検証済、`未着手` = 実画面確認前、`実装・検証済` = 完了。

| ID | 領域 | 状態 | 次の作業 |
|---|---|---|---|
| UI-00 | シナリオ一覧・詳細、SideMenu | 基準 | 既知の未調整箇所を継続確認。横断作業時の比較対象とする |
| UI-01 | 共通モーダルの面・ヘッダー・フッター・入力部品 | 実装中 | 他の利用画面で新しい面・幅・スクロールの影響を確認 |
| UI-02 | `SignupModal`（プロフィール設定） | 実装中 | Step 2、エラー、完了、スマホでのスクロールを実画面確認 |
| UI-03 | `FeedbackModal` | 実装中 | 編集、送信中、失敗、投稿上限を確認。スクリーンショット添付は現行の表示のみで未実装 |
| UI-04 | `AuthPromptDialog` | 現状撮影済 | PCのダイアログとスマホのボトムシートを同じ系統で調整 |
| UI-05 | セッションの申請・承認・取消・完了ダイアログ | 実装中 | 現行のキャンセルダイアログを更新済。申請・承認・辞退・完了は状態を撮影して設計 |
| UI-06 | 共通モバイルヘッダー・下部ナビ・SpeedDial | 未着手 | モーダルを含む実画面で重なりや色・影を確認 |
| UI-07 | セッション一覧・詳細・作成・日程調整 | 未着手 | 紫の旧グラデーションを含む実画面を撮影し、画面単位で再設計 |
| UI-08 | フィードバック一覧・詳細 | 未着手 | 認証済みの実画面を撮影し、カード・コメント・状態色を確認 |
| UI-09 | シナリオ作成・インポート | 未着手 | 一覧・詳細との連続性を確認し、フォーム面と入力部品を調整 |
| UI-10 | プロフィール・ユーザー画面 | 未着手 | 表示と編集の両方を撮影して調整 |

### 先に解消する実装上の問題

- `SignupModal`、`FeedbackModal`、`CancelModal` の無効なトークン指定は修正済。`ApplicationModal`、`ApprovalModal` などの旧指定は各画面の移行時に直す。
- `FeedbackModal` は撮影・以後の状態確認用に `FeedbackModal.stories.tsx` の作成/編集Storyを追加した。サーバーアクションを含むため、送信成功や失敗のStoryは安全なモックを用意する。
- フィードバックの「スクリーンショットを添付」は既存画面の表示だけで、ファイル選択・保存処理がない。Storage 設計とともに別タスクとして実装する。

## モーダルの現状キャプチャ

Storybookの単独Storyを2026-09-27に撮影。デスクトップは `1440×900`、スマホは `390×844`。画像は**現行実装**の記録。空の背景や開発用UIが写っている場合はStorybook環境の表示である。

| 対象 | デスクトップ | スマホ |
|---|---|---|
| 登録 Step 1 | [画像](../designs/ui-redesign/modal-baseline/signup-step1-desktop.png) | [画像](../designs/ui-redesign/modal-baseline/signup-step1-mobile.png) |
| 登録 Step 2 | [画像](../designs/ui-redesign/modal-baseline/signup-step2-desktop.png) | 未撮影 |
| フィードバック作成 | [画像](../designs/ui-redesign/modal-baseline/feedback-create-desktop.png) | [画像](../designs/ui-redesign/modal-baseline/feedback-create-mobile.png) |
| ログイン誘導 | [画像](../designs/ui-redesign/modal-baseline/auth-prompt-desktop.png) | [画像](../designs/ui-redesign/modal-baseline/auth-prompt-mobile.png) |
| 参加申請（旧 `ApplicationModal`） | [画像](../designs/ui-redesign/modal-baseline/application-desktop.png) | 未撮影 |
| 参加承認（旧 `ApprovalModal`） | [画像](../designs/ui-redesign/modal-baseline/approval-desktop.png) | 未撮影 |
| セッションキャンセル（旧 `CancelModal`） | [画像](../designs/ui-redesign/modal-baseline/cancel-session-desktop.png) | 未撮影 |
| 参加申請（現行セッション詳細） | [画像](../designs/ui-redesign/modal-baseline/participation-request-desktop.png) | 未撮影 |

緑基調の比較用実画面: [シナリオ一覧](../designs/ui-redesign/scenarios-reference-desktop.png)・[シナリオ詳細](../designs/ui-redesign/scenario-detail-reference-desktop.png)。旧 `ApplicationModal` / `ApprovalModal` / `CancelModal` はStorybookから撮影した。現在のセッション詳細で使われるダイアログと混同しない。

## 画像生成による初回デザイン案

2026-09-27、現行モーダルのキャプチャを内容・フローの参照、シナリオ一覧のキャプチャを見た目の参照としてImageGenで生成。[再生成用プロンプト](../designs/ui-redesign/modal-concepts/prompts.md)を保存した。実装に採る前に、現行の文言・機能・画面幅との整合を確認する。

| 種別 | デスクトップ案 | スマホ案 | 設計上の焦点 |
|---|---|---|---|
| 登録 Step 1 | [画像](../designs/ui-redesign/modal-concepts/signup-step1-desktop.png) | [画像](../designs/ui-redesign/modal-concepts/signup-step1-mobile.png) | 進行、アバター代替表示、フォーム、単一の主操作 |
| フィードバック作成 | [画像 v2](../designs/ui-redesign/modal-concepts/feedback-create-desktop-v2.png) | [画像 v2](../designs/ui-redesign/modal-concepts/feedback-create-mobile-v2.png) | カテゴリにアイコンを追加し、ヒントの電球を明るい黄色に変更。入力、補助情報、スマホの固定フッターも確認 |
| セッションキャンセル | [画像 v3](../designs/ui-redesign/modal-concepts/cancel-session-desktop-v3.png) | 未作成 | 対象と不可逆の影響を先に読む。注意文は左ボーダーを使わず淡いエラー色の面にし、ボタンは「継続する」「セッションをキャンセルする」と明示 |

画像に表現されたスマホのシート形状、寸法、装飾は未確定。スクリーンショット添付のような既存UIも、動作の実在を別途確認する。画像から仕様を逆算して機能を増やさない。

初回案は `modal-concepts/` に版番号を付けず保存している。2026-09-27のフィードバック・キャンセル修正は元画像を保持して `-v2` に、キャンセルのボタン文言修正は `-v3` に保存した。

## 2026-09-27 の実装

- 共通 `Modal` を紙色の面と控えめな輪郭・影に調整し、必要な画面だけスマホで下端に付くシート表示を選べるようにした。
- `SignupModal` の無効な色指定を解消し、Step 1 のアバターと案内文を中央に配置した。Storybook のアバターは表示可能なローカル画像に変更した。
- `FeedbackModal` のカテゴリにアイコンを付け、スマホでは2列に再配置した。電球は明るい黄色の `icon.idea` を使用。カテゴリ選択で入力例が切り替わることを確認した。
- カテゴリ選択は「シンプルスケジュール」の参考画面に合わせてPC・スマホとも2列に統一。ラジオ・アイコン・文字を縦中央に揃え、選択時の枠・ラジオ・文字・アイコンを同じ `primary.text` に統一する。選択時だけアイコンを塗りつぶしに切り替える。表示ラベルは「不具合」「機能要望」「画面・操作性」「その他」。DB のカテゴリ値は変更しない。
- セッション詳細で実際に使う `CancelSessionDialog` と旧 `CancelModal` を更新。注意文は左ボーダーを使わない淡いエラー面にし、操作名を「継続する」「セッションをキャンセルする」にした。
- `pnpm prepare`、TypeScript、Biome、`pnpm build`、共通モーダル・登録・旧キャンセルの既存60テストを通過。Storybook で登録と現行キャンセルのデスクトップ表示、フィードバックのデスクトップおよび390×844表示を確認した。

## 2026-09-28: モーダルの退場動作

- 共通 `Modal`、シナリオ登録方法選択、フィードバック、セッション操作、シナリオ検索で、閉じる操作後も退場アニメーションが終わるまで内容を保持する。
- フォームや検索条件の初期化は退場完了後に行い、閉じる途中で内容が消えないようにした。セッション操作ダイアログは親側でも常時マウントし、閉じる瞬間のアンマウントを防ぐ。
- Storybook でフィードバックの「×」・外側クリックと、制御モードのシナリオ登録方法選択を確認した。フィードバックは閉じる途中の入力保持と、再表示時の初期化も確認した。
- TypeScript、Biome、関連コンポーネントテストを通過。モーダルの外観・各状態の画面単位の確認は上表の残作業として継続する。

## 次の作業順

1. UI-01〜05: 初回デザイン案と実キャプチャを比較し、共通モーダルの仕様を確定する。旧モーダルと現行ダイアログの利用箇所を確認して重複を整理する。
2. 入力系（登録・フィードバック）から実装し、状態別StoryとPC/スマホの実表示を確認する。特に無効な色指定を解消する。
3. 確認・破壊的操作へ展開し、影響文言・フォーカス・保留中状態を検証する。
4. UI-06〜10を画面単位で撮影・設計・実装する。各タスクの完了時にこの表を更新し、実装・検証の根拠を追記する。
