# モーダルUI案の再生成用プロンプト

2026-09-27、Codexの組み込みImageGenで生成。ツールはモデル名を選択・表示しないため、特定の「Image 2.5」バージョンで生成されたかは確認できない。以下は生成時の指定を再利用しやすい長さにまとめたプロンプトセット。案は現行画面の内容とシナリオ画面のスタイルを参照した概念図であり、実装仕様ではない。

## `signup-step1-desktop.png`

参照: `../modal-baseline/signup-step1-desktop.png`（内容・フロー）、`../scenarios-reference-desktop.png`（スタイル）。

> Use case: ui-mockup. Asset type: high-fidelity, shippable Japanese web-app UI concept for the scenario-manager design refresh. Produce a desktop screenshot-like mockup: profile setup Step 1 centered over a softly dimmed scenario page. Preserve progress, heading, user ID, display name, helper and Next action. Replace the broken avatar with a fallback. Use canvas and paper surfaces, a pale-green hairline border, soft shadow, green-500 CTA, readable dark text and restrained spacing. Do not add features or purple/blue gradients.

## `signup-step1-mobile.png`

参照: `../modal-baseline/signup-step1-mobile.png`（内容・フロー）、`../scenarios-reference-desktop.png`（スタイル）。生成後、実装にないアバター編集用の「＋」を削除する精密編集を実施。

> Use case: ui-mockup. Design a portrait mobile profile-setup Step 1 using the current mobile capture for content and the scenario page for style. Preserve the actual progress, title, subtitle, avatar fallback, required user ID/display name fields, helper and Next action. Keep the primary action reachable above the safe area. Use a subtly green paper surface, pale border, soft shadow, green-500 CTA, legible text and practical touch targets. No added sign-up steps or decorative art.

> Edit: Remove only the green plus button from the avatar. Preserve all other layout, text and styling.

## `feedback-create-desktop.png`

参照: `../modal-baseline/feedback-create-desktop.png`（内容・フロー）、`../scenarios-reference-desktop.png`（スタイル）。

> Use case: ui-mockup. Produce a desktop Japanese feedback-create dialog over the dimmed scenario page. Preserve category choices, title and detail inputs, screenshot attachment, link to feedback, URL/browser disclosure, Cancel and Send actions. Improve hierarchy with persistent labels, readable notices, compact category choice and one dominant submit action. Adopt the paper/canvas layered design, pale-green border, soft shadow and green-500 action without flooding the dialog with green. Do not invent features.

## `feedback-create-mobile.png`

参照: `../modal-baseline/feedback-create-mobile.png`（内容・フロー）、`../scenarios-reference-desktop.png`（スタイル）。

> Use case: ui-mockup. Redesign the portrait mobile feedback-create experience as a practical near-full-height bottom sheet with drag handle and close control. Preserve all existing categories, fields, screenshot attachment, feedback link, data disclosure and Cancel/Send actions. Make content scrollable and keep the primary action in a reachable footer. Use subtly green paper, pale-green borders, green-500 CTA, legible dark text and touch-friendly category choices. No extra features.

## `cancel-session-desktop.png`

参照: `../modal-baseline/cancel-session-desktop.png`（内容・フロー）、`../scenarios-reference-desktop.png`（スタイル）。

> Use case: ui-mockup. Produce a desktop confirmation dialog for cancelling a session. Preserve title, target session, notification/irreversible consequence, optional reason and Back/Cancel actions. Make target and consequence legible before the decision. Use the refreshed paper/canvas surface, pale-green edge and soft shadow, but reserve muted red for destructive action and warning. Do not invent controls or product rules.

## 2026-09-27 修正版（`-v2`）

`feedback-create-desktop-v2.png` と `feedback-create-mobile-v2.png` は、それぞれ初回案を編集対象にした。カテゴリの順序・文言・選択状態・ラジオボタンを保ちつつ、バグ報告に虫、機能要望にきらめき、UI/UX改善にカーソル、その他に吹き出しの小さな線画アイコンを追加。ヒントの電球だけを鮮やかな黄色（目安 `#FACC15`）へ変更し、他のレイアウトと内容を保持するよう指定した。

`cancel-session-desktop-v2.png` は初回案を編集対象にした。参加者への通知と取り消し不可を伝える注意文の**左ボーダーを削除**し、アイコンと文章を囲む角丸の淡いエラー色の背景（目安 `#FFF2F2`）を付ける。他の文言・操作・配置は保持するよう指定した。

## 2026-09-27 ボタン文言修正版（`-v3`）

`cancel-session-desktop-v3.png` は `-v2` を編集対象にした。フッター左の「戻る」を**「継続する」**、右の「キャンセルする」を**「セッションをキャンセルする」**へ変更。右ボタンは文言が1行で読める幅と余白を確保し、それ以外の内容・見た目を維持するよう指定した。
