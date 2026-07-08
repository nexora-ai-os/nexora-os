# KEVIRIO v5.1 API Expansion Core

## 置き換えるファイル
```txt
api/status.js
api/orchestrate.js
src/components/APIControlCenter.jsx
src/components/HomeCommandCenter.jsx
src/services/aiOrchestrator.js
src/styles.css
```

## 新しく追加するファイル
```txt
src/services/apiRegistry.js
src/services/agentCompany.js
KEVIRIO_Constitution.md
```

## 入れる場所
```txt
KEVIRIO_Constitution.md → README.md / package.json と同じルート直下
api/status.js / api/orchestrate.js → api/ の中。既存ファイルを置き換え
APIControlCenter.jsx / HomeCommandCenter.jsx → src/components/ の中。既存ファイルを置き換え
apiRegistry.js / agentCompany.js / aiOrchestrator.js → src/services/ の中
```

## 削除するファイル
```txt
なし
```

## Commit message
```txt
Build KEVIRIO v5.1 API Expansion Core
```

## 追加内容
- Claude / Anthropic 接続基盤
- Perplexity 接続基盤
- Google / YouTube API接続準備
- Canva接続準備
- SNS API接続準備
- 国内外ASP接続準備
- AI Orchestratorの拡張
- AI社員・部署構成の整理
- API Control画面の再設計
- HomeにAPI Expansion表示を追加
- KEVIRIO Constitutionを追加

## 注意
OpenAI / Geminiは既存接続済み前提です。
外部投稿・契約・送信・決済・広告出稿は自動実行しません。
最終決裁は必ずオーナーです。
