# Scenario Manager Project Model

AI Development Cockpit が読み込む、このリポジトリ用の設計前提です。

- `project.yaml`: プロジェクト ID、Next.js の起動設定、WorkTree 設定
- `nodes/Screen`, `nodes/UIElement`: `src/app` の 19 画面と主な構成要素
- `nodes/Flow`, `nodes/FlowStep`: シナリオ、セッション、日程、フィードバックの 6 フロー
- `nodes/Entity`, `nodes/Field`, `nodes/Relation`: `src/db/types.ts` の public テーブル 17 件、列 162 件、外部キー 29 件
- `nodes/APIEndpoint`, `nodes/APIField`: Route Handler 6 件と入出力
- `nodes/Requirement`, `nodes/Decision`: 実装済み機能、認証、日程権限、アップロード制約
- `edges/`: 画面遷移、フロー遷移、外部キー、要求と実装の対応

`/users` と `/schedules` は現状で見出しのみのため、`metadata.status: planned` としてあります。その他の画面は現在の実装に対応します。DB 定義を変えた場合は `src/db/types.ts` とマイグレーションを確認して ER ノードを更新してください。

Cockpit の左ペインにある「プロジェクトを再読み込み」で、外部で編集したモデルを読み直せます。旧ビルドではプロジェクトを開き直してください。

`local/` と `cache/` は端末固有の状態なので Git 管理から除外しています。WorkTree 間で同じモデルを使うには、この `.devcockpit` の定義ファイルをブランチ間で共有してください。
