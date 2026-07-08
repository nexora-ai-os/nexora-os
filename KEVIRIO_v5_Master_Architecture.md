# KEVIRIO v5 Master Architecture

## 0. この設計図の位置づけ

このドキュメントは、今後のKEVIRIO開発でブレないための「v5 Master Architecture」です。

今後の絶対方針は以下です。

- 機能は増やすが、操作は減らす。
- AI社員は増やすが、画面は増やしすぎない。
- API接続は増やすが、ユーザーが迷わない設計にする。
- 9割はAIが自動化し、1割だけユーザーが確認・承認・軽い修正を行う。
- AIは分析・提案・下書き・予約準備・整理・学習まで。
- 投稿、契約、送信、決済などの外部実行は、オーナー承認後のみ。
- OpenAIとGeminiは既存接続済み前提。今後はClaude / Perplexity / Google / Canva / SNS / ASPを優先する。
- 小刻み更新を減らし、フェーズ単位でまとめて実装する。

---

## 1. KEVIRIOの定義

KEVIRIOは、AI社員たちが事業・収益化・SNS・コンテンツ・案件・分析を支援し、ユーザーが最終決裁するための **Autonomous Business Operating System** です。

### 目的

1. 何をやるべきか迷う時間を減らす。
2. 投稿・案件・収益化までの作業を減らす。
3. 国内外のSNS・ASP・広告・コンテンツを一元管理する。
4. AI社員に調査・比較・作成・整理・分析を任せる。
5. オーナーは確認・承認・軽い修正・経営判断に集中する。
6. 結果をBusiness Memoryへ記録し、次回以降の判断精度を上げる。

---

## 2. UX原則

### 2.1 目標クリック数

現在の課題:
- ページ数が増え、行ったり来たりが発生している。
- 1つの投稿や案件を進めるためのクリック数が多い。
- スマホ・タブレットでは操作が複雑に感じやすい。

v5の目標:
- 主要フローは3〜5クリック以内。
- ユーザーは「目的」を選ぶだけ。
- 手順はAIが裏側で実行する。

### 2.2 画面構成

ユーザーに見せる画面は原則5つに集約する。

1. Home / AI CEO
2. Campaign
3. Approval
4. Analytics
5. Settings / API

既存の以下機能は、基本的に裏側のエンジンとして扱う。

- Trend Intelligence
- Opportunity Engine
- Workflow Automation
- Mission Control
- Work Engine
- Work Command
- Content Studio
- Approval Center
- Business Memory
- AI Board
- Analytics
- AI Orchestrator

---

## 3. v5画面設計

### 3.1 Home / AI CEO

役割:
- 朝開いた時に「今日やること」が分かる画面。
- 各AI社員の分析結果を統合して、オーナーに最終判断を求める。

表示内容:
- 今日の最優先案件
- 今日作る投稿・記事・動画
- 承認待ち
- リスク
- 期待売上
- ROI
- 今日やらないこと
- AI Board意見
- オーナー決裁ボタン

ユーザー操作:
- 承認
- 修正
- 保留
- 却下
- AIへ再検討依頼

### 3.2 Campaign

役割:
- 「テーマ入力 → 日本向け投稿3本 + 海外向け投稿3本 + 画像/動画案 + 投稿予約準備」までの中心画面。

入力:
- テーマ
- 商品/案件
- 対象国
- SNS
- 投稿数
- トーン
- 目的: アフィリエイト / 広告収益 / 集客 / 営業 / 採用 / ブランディング

出力:
- 日本向け投稿3本
- 海外向け投稿3本
- ブログ/LP下書き
- SNS別投稿文
- Canva画像案
- CapCut/動画構成案
- ハッシュタグ
- 投稿時間候補
- アフィリエイトリンク候補
- Legalチェック
- Approval送信

### 3.3 Approval

役割:
- AIが準備した投稿・記事・画像・動画・DM・メール・広告案を人間が確認する場所。

確認項目:
- 景表法
- 薬機法
- 著作権
- 商標
- ステマ規制
- ASP規約
- SNS規約
- ブランド表現
- 炎上リスク
- 海外向け表現
- 翻訳品質

操作:
- 承認
- 修正依頼
- 却下
- 保留
- 予約投稿へ進める

### 3.4 Analytics

役割:
- 投稿・SNS・ASP・広告・案件の成果を統合管理する。

表示内容:
- 売上
- クリック数
- CTR
- CVR
- CV
- 投稿別成果
- SNS別成果
- 国別成果
- ASP別成果
- ROI
- フォロワー増減
- コメント/DM対応状況
- 次回改善案

### 3.5 Settings / API

役割:
- API接続とAI社員設定を集約する。

表示:
- OpenAI
- Gemini
- Claude / Anthropic
- Perplexity
- Google APIs
- Canva
- CapCut / Video API候補
- SNS APIs
- ASP APIs
- OAuth状態
- 権限
- 無料枠/有料化ステータス
- 使用量
- エラー
- APIキーは絶対に表示しない

---

## 4. AI社員構成

AI社員は画面として増やさない。裏側のAgentとして動く。

### 経営・判断系

- AI CEO: 最終提案と経営判断整理
- AI COO: 業務フロー、今日の実行順整理
- AI CFO: 売上、利益、ROI、コスト、広告費
- AI CMO: SNS、広告、マーケティング戦略
- AI CTO: API、接続、技術、エラー管理
- AI Legal: 法務、規約、薬機法、景表法、著作権、商標
- AI Brand: 世界観、表現、ブランド毀損リスク

### 収益化・SNS系

- Trend Agent: トレンド調査
- Opportunity Agent: 収益機会発見
- Affiliate Agent: ASP、案件、報酬、承認率
- Social Agent: SNS運用全体
- Publisher Agent: 予約投稿準備
- Community Agent: コメント、DM、メッセージ管理
- Growth Agent: フォロー、フォロワー、アルゴリズム分析
- Ads Agent: 広告収益、広告出稿、ROAS管理

### 制作系

- Content Agent: 投稿、ブログ、LP、営業文作成
- Creative Agent: Canva画像・バナー案
- Video Agent: CapCut/動画構成案
- Translator Agent: 多言語展開
- Reviewer Agent: 品質、表現、誤字、整合性確認

### 学習・分析系

- Analytics Agent: 数字分析
- Memory Agent: Business Memory蓄積
- Research Agent: 最新情報・競合調査
- Experiment Agent: A/Bテスト、投稿時間テスト、訴求テスト

---

## 5. API接続マップ

### 5.1 既存接続済み

- OpenAI
- Gemini

### 5.2 次に接続するAI API

#### Claude / Anthropic

用途:
- 長文レビュー
- 仕様書
- 法務/規約チェック
- 複雑な文章整理
- AI Legal / Reviewer / Brand向け

実装:
- ANTHROPIC_API_KEY
- AI Orchestratorのproviderに追加
- mode: legal / long / review / brand

#### Perplexity

用途:
- 最新情報
- 競合調査
- トレンド調査
- 海外調査
- Research Agent向け

実装:
- PERPLEXITY_API_KEY
- AI Orchestratorのproviderに追加
- mode: research / trend / competitor

### 5.3 Google APIs

優先接続:
- Google Drive
- Google Docs
- Google Sheets
- Gmail
- Google Calendar
- YouTube Data API
- Google Search Console
- Google Analytics
- Google Trends代替/関連データ

用途:
- 投稿管理表
- 成果管理
- 予約/カレンダー
- YouTube投稿・分析
- ドキュメント保存
- メール/営業文管理

### 5.4 Canva

用途:
- 画像生成/編集のワークフロー
- テンプレート管理
- SNSバナー
- LP素材
- 広告クリエイティブ

実装:
- Canva Connect API
- Creative Agentに接続
- 最初は「Canva用デザイン指示書・素材案・テンプレ案」を作成
- OAuth/権限確認後に実接続

### 5.5 CapCut / Video API

方針:
- CapCut公式APIの一般公開・制限を要確認
- 直接接続が難しい場合は代替Video APIを用意

代替候補:
- Canva動画
- Creatomate
- Shotstack
- Runway
- Pika
- HeyGen
- Synthesia

用途:
- ショート動画
- TikTok/Reels/YouTube Shorts
- 海外向け動画
- 台本/字幕/構成案

### 5.6 SNS APIs

#### Instagram / Facebook / Threads

用途:
- 投稿
- 予約投稿
- コメント管理
- DM/メッセージ管理
- インサイト
- フォロワー管理
- 広告連携

方針:
- Meta Graph APIを中心に検討
- Instagramはプロアカウント前提
- ThreadsはAPI対応範囲を確認
- 承認後投稿を原則にする

#### X

用途:
- 投稿
- 予約投稿
- DM
- リプライ
- トレンド
- フォロー/フォロワー
- Analytics

方針:
- X APIの料金・制限を確認
- 最初は投稿下書き/予約準備
- 有料プランが必要な場合は後回し

#### TikTok

用途:
- 動画投稿
- 投稿予約
- インサイト
- 広告
- 海外向け拡散

方針:
- TikTok Content Posting APIを検討
- アプリ審査・権限・UX要件に注意

#### YouTube

用途:
- Shorts投稿
- 動画投稿
- Analytics
- コメント管理
- 海外向け動画

方針:
- YouTube Data API / Analytics API
- Google API群として扱う

#### LinkedIn / Pinterest

用途:
- 海外向けビジネス投稿
- BtoB導線
- 画像/ブログ導線

方針:
- 海外展開フェーズで優先

### 5.7 ASP / Affiliate APIs

国内:
- A8.net
- もしも
- バリューコマース
- afb
- 楽天
- Amazon

海外:
- Amazon Associates
- Impact
- CJ Affiliate
- ShareASale
- PartnerStack
- ClickBank
- Rakuten Advertising

用途:
- 案件管理
- 報酬
- 承認率
- 成果
- 国別案件
- 海外向け商品選定

---

## 6. 9割自動化フロー

### フローA: 1テーマから多言語SNS展開

1. ユーザーがテーマを入力
2. Research Agentが調査
3. Trend Agentが市場性を分析
4. Opportunity Agentが収益性を評価
5. Affiliate Agentが案件を選定
6. Content Agentが日本向け投稿3本作成
7. Translator Agentが海外向け投稿3本作成
8. Creative Agentが画像案作成
9. Video Agentが動画構成案作成
10. Legal Agentがチェック
11. Reviewer Agentが品質確認
12. Publisher Agentが予約投稿案を作成
13. ユーザーが承認
14. 承認後、予約投稿/管理へ
15. Analytics Agentが結果分析
16. Memory Agentが学習

### フローB: AI CEO朝会

1. 朝Homeを開く
2. AI CEOが今日の候補を提示
3. AI Boardが意見を提示
4. やること/やらないことを表示
5. ユーザーが承認
6. AIがCampaignを生成
7. Approvalへ回す

### フローC: SNS運用

1. 投稿予定を作成
2. 日本向け/海外向け投稿を生成
3. SNS別に最適化
4. コメント/DM/反応を監視
5. フォロワー増減を分析
6. 次回投稿へ反映

---

## 7. データ構造

### Campaign

- id
- title
- theme
- objective
- targetCountries
- targetLanguages
- snsChannels
- affiliatePrograms
- generatedPosts
- creativeBriefs
- videoBriefs
- approvalStatus
- publishSchedule
- analytics
- memoryRefs

### Post

- id
- campaignId
- platform
- language
- country
- copy
- hashtags
- mediaBrief
- affiliateLink
- legalStatus
- approvalStatus
- scheduledAt
- publishedAt
- performance

### Decision

- id
- aiProposal
- ownerDecision
- result
- impact
- lesson
- createdAt

### APIConnection

- id
- provider
- configured
- scopes
- status
- usage
- lastCheckedAt
- error

### AgentTask

- id
- agent
- taskType
- input
- output
- status
- confidence
- createdAt

---

## 8. v5実装フェーズ

### Phase 1: v5.0 Simple Command OS

目的:
- 画面移動を減らす
- 1テーマ入力から多言語・複数SNS投稿案まで生成
- Approvalへ送る

含める:
- Home Command
- Campaign Builder
- AI社員裏側実行
- 日本向け3本 + 海外向け3本
- 承認待ち一括生成

### Phase 2: v5.1 API Expansion Pack

目的:
- OpenAI/Gemini以外のAPI接続準備

含める:
- Claude / Anthropic
- Perplexity
- Google APIs
- Canva
- SNS API準備
- API Control再設計
- AI Orchestrator拡張

### Phase 3: v5.2 Social Revenue Engine

目的:
- SNS収益化と投稿管理を強化

含める:
- 予約投稿準備
- SNS別投稿管理
- コメント/DM管理設計
- フォロワー分析
- アルゴリズムメモ
- アフィリエイト/広告収益管理

### Phase 4: v5.3 Global Affiliate Engine

目的:
- 海外ASP/多言語収益化

含める:
- 海外ASP管理
- 国別案件
- 言語別投稿
- 海外SEO
- 海外SNS戦略

### Phase 5: v5.4 Auto Publish & Analytics Loop

目的:
- 承認後の予約投稿・分析・Memory連携

含める:
- Publisher Agent
- Analytics Agent
- Business Memory連携
- Decision Journal
- 投稿結果から次回改善

---

## 9. 開発ルール

1. 小刻み更新は減らす。
2. フェーズ単位でまとめて設計・実装する。
3. 1回のパッチは壊れないギリギリで大きめに進める。
4. ただし外部API接続やOAuthは段階的に安全に進める。
5. OpenAI/Gemini以外を優先的に追加する。
6. 将来必要で無料で入れられるものは早めに土台へ入れる。
7. 画面数を増やすより、操作を減らす。
8. AI社員を増やしても、UIはシンプルにする。
9. スマホ・タブレットで使いやすい設計にする。
10. 最終決裁は必ずオーナー。

---

## 10. v5 North Star

KEVIRIO v5のNorth Star:

**1テーマを入力するだけで、AI社員が調査・案件選定・国内外コンテンツ作成・画像/動画案・法務確認・予約投稿準備・分析・学習まで進め、ユーザーは確認・承認・軽い修正だけで収益化を回せるAI Business OS。**
