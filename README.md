# KEVIRIO v5.0 Simple Command OS

## 今回の位置づけ

v4.0.1 App Memory Fix は、このv5.0に統合済みです。
そのため、v4.0.1を別で置き換える必要はありません。

## 置き換えるファイル

```txt
src/App.jsx
src/components/Sidebar.jsx
src/styles.css
```

## 新しく追加するファイル

```txt
src/components/HomeCommandCenter.jsx
src/components/CampaignOS.jsx
src/components/BusinessMemory.jsx
src/services/campaignEngine.js
src/services/memoryEngine.js
KEVIRIO_v5_Master_Architecture.md
```

## 入れる場所

```txt
KEVIRIO_v5_Master_Architecture.md
→ README.md / package.json と同じルート直下

src/components/HomeCommandCenter.jsx
src/components/CampaignOS.jsx
src/components/BusinessMemory.jsx
→ src/components/ の中

src/services/campaignEngine.js
src/services/memoryEngine.js
→ src/services/ の中

src/App.jsx
src/components/Sidebar.jsx
src/styles.css
→ 既存ファイルを置き換え
```

## 削除するファイル

```txt
なし
```

## Commit message

```txt
Build KEVIRIO v5.0 Simple Command OS
```

## 追加内容

- v4.0.1 App Memory Fixを統合
- v5 Home / Simple Command画面を追加
- v5 Campaign OSを追加
- 1テーマ入力から日本向け3本・海外向け3本の投稿案を生成
- Canva向け画像案、CapCut/Video向け動画案、Legalチェックを同時生成
- 承認待ち、Workflow、Content下書き、Business Memoryへ連携
- サイドバーをCommand中心に整理
- Advanced Enginesとして既存機能も残す

## 確認する画面

1. Home
2. Campaign
3. Approval
4. API / AI
5. Business Memory
6. AI CEO

## 注意

外部投稿・契約・送信・決済は自動実行しません。
AIは準備・分析・下書き・承認待ち作成まで。
最終決裁は必ずオーナーです。
