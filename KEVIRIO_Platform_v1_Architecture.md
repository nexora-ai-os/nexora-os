# KEVIRIO Platform v1 Architecture

## 1. 目的

KEVIRIOを「AI社員と会社を経営する Autonomous Business Operating System」として発展させるための設計書です。

本設計の基本方針は以下の通りです。

- 機能は増やすが、操作は減らす
- 画面は増やしすぎず、主要フローを集約する
- AIは分析・提案・下書き・準備・整理・学習まで担当する
- 外部投稿・契約・送信・決済・広告出稿などは、最終決裁をオーナーに委ねる
- APIキーや秘密情報は画面に露出しない
- 最終決裁はオーナーが行う

---

## 2. 現在の画面構成

現状の実装は、ReactベースのSPAとして複数ページを持ち、左サイドバーから移動できる構成です。

### 2.1 現在の主要画面

- Home
- Campaign
- Approval
- Analytics
- API / AI
- AI CEO
- Business Memory
- Opportunity
- Trend
- Workflow
- Mission
- Work Engine
- Work Command
- Affiliate
- Content
- AI Companion
- Settings

### 2.2 現状の画面構成の特徴

- 主要操作を「Command」グループと「Advanced Engines」グループに分けている
- 画面数は多く、機能の分散が見られる
- 未来の方向性としては、主要フローを少数の中核画面へ集約する設計が望ましい

### 2.3 画面整理の方向性

今後は、以下の5つに収束させる想定です。

1. Home / Operator Console
2. Campaign / Content Studio
3. Approval / Governance
4. Analytics / Revenue Intelligence
5. Settings / API / AI Workforce

---

## 3. 現在の主要コンポーネント一覧

現状の主要コンポーネントは、以下の通りです。

- Sidebar
- Dashboard
- AICEO
- TrendIntelligence
- WorkflowAutomation
- APIControlCenter
- OpportunityEngine
- WorkCommand
- WorkEngine
- AffiliateHub
- ContentStudio
- ApprovalCenter
- Analytics
- AIAssistant
- Settings
- FloatingAssistant
- HomeCommandCenter
- CampaignOS
- BusinessMemory
- BrandMark

### 3.1 現状の役割の整理

- Home系: HomeCommandCenter, Dashboard
- 経営判断系: AICEO
- 収益・案件系: OpportunityEngine, AffiliateHub
- 作業・実行系: WorkCommand, WorkEngine, WorkflowAutomation
- 企画・制作系: CampaignOS, ContentStudio
- 承認・ガバナンス系: ApprovalCenter
- 分析・知見系: Analytics, TrendIntelligence, BusinessMemory
- AI支援系: AIAssistant, FloatingAssistant
- 接続・設定系: APIControlCenter, Settings

---

## 4. 現在の services 一覧

現状のサービス層は、以下のように整理されています。

- agentCompany.js
- agentEngine.js
- aiCommand.js
- aiOrchestrator.js
- apiRegistry.js
- campaignEngine.js
- ceoEngine.js
- connectionEngine.js
- memoryEngine.js
- missionBrain.js
- missionEngine.js
- opportunityEngine.js
- pipelineEngine.js
- socialRevenueEngine.js
- trendEngine.js
- workEngine.js
- workflowEngine.js

### 4.1 役割の整理

- AI実行制御: agentEngine, aiOrchestrator, aiCommand
- 経営判断支援: ceoEngine, missionBrain
- キャンペーン管理: campaignEngine
- 収益・機会管理: opportunityEngine, pipelineEngine
- SNS収益管理: socialRevenueEngine
- 知識・意思決定記録: memoryEngine
- 業務実行: workEngine, workflowEngine
- 接続管理: connectionEngine, apiRegistry

---

## 5. 現在の API 一覧

現在のAPI実装は、以下の3つのエンドポイントで構成されています。

- api/ai.js
- api/orchestrate.js
- api/status.js

### 5.1 役割

- ai.js: 単発のAI問い合わせ処理
- orchestrate.js: AI Orchestratorによるモデル選択・フォールバック
- status.js: 接続候補プロバイダの状態確認

### 5.2 現在の対応候補

- OpenAI
- Gemini
- Claude / Anthropic
- Perplexity
- Google / YouTube / Analytics
- Canva
- SNS（Meta / X / TikTok / LinkedIn / Pinterest）
- ASP（A8.net / Amazon / Impact / CJ / ShareASale）

---

## 6. AI社員構成

KEVIRIOのAI社員は、画面として増やすのではなく、背後のAgentとして統合して動かす方針とする。

### 6.1 経営・判断系

- AI CEO: 経営判断、優先順位、意思決定整理
- AI COO: 仕事の流れと実行順の整理
- AI CFO: 売上・利益・ROI・広告費の分析
- AI CMO: 集客、SNS、ブランド、広告戦略
- AI CTO: API接続、技術基盤、エラー管理
- AI Legal: 法務・規約・リスク確認
- AI Brand: ブランド表現・世界観・炎上リスク管理

### 6.2 収益化・SNS系

- Trend Agent: 市場動向・トレンド調査
- Opportunity Agent: 収益機会の発見
- Affiliate Agent: ASP案件・報酬・承認率の整理
- Social Agent: SNS運用全体の提案
- Publisher Agent: 投稿予約・配信準備
- Community Agent: コメント・DM・問い合わせ対応の整理
- Growth Agent: フォロワー・エンゲージメント・アルゴリズム改善
- Ads Agent: 広告収益・出稿案・ROAS管理

### 6.3 制作・分析系

- Content Agent: 投稿文・ブログ・メール・営業文の作成
- Creative Agent: 画像・バナー・Canva案の提案
- Video Agent: 動画構成・ショート動画案の提案
- Reviewer Agent: 品質・表現・誤字・整合性確認
- Analytics Agent: 数字分析・改善案提案
- Memory Agent: Business Memoryへの学習蓄積
- Research Agent: 最新情報・競合調査

---

## 7. API接続マップ

### 7.1 現在の基盤

- OpenAI: 文章生成・要約・提案
- Gemini: バックアップ・長文処理・要約
- Anthropic / Claude: 長文レビュー・仕様書・法務・ブランド確認
- Perplexity: リサーチ・トレンド・競合分析

### 7.2 追加を想定する接続

- Google: Gmail / Drive / Docs / Sheets / Calendar / YouTube / Analytics
- Canva: 画像・バナー・広告素材作成
- SNS: Instagram / Facebook / Threads / X / TikTok / LinkedIn / Pinterest
- ASP: A8.net / Amazon / Impact / CJ / ShareASale

### 7.3 接続の基本方針

- すべての接続は「準備・分析・下書き・予約」までを担当する
- 実際の投稿・送信・契約・決済・支払いは、オーナー承認後のみ実行する
- 接続状態は画面上で「接続済み / 未接続」だけを示す
- APIキーやトークンは画面に表示しない

---

## 8. Claude / Perplexity / Google / Canva / SNS / ASP 連携方針

### 8.1 Claude

用途:
- 長文レビュー
- 仕様書作成
- ブランド・法務・規約チェック
- 複雑な文章整理

方針:
- Claudeは「深い思考・長文レビュー・品質保証」に重点を置く
- ルール・ポリシー・ブランド文脈を強く持たせる

### 8.2 Perplexity

用途:
- 最新情報取得
- 市場調査
- 競合分析
- トレンド検証

方針:
- 現実の情報確認に強いモデルとして扱い、事実確認の第一候補にする
- 推測と事実を分離するフローを標準化する

### 8.3 Google

用途:
- Gmail / Calendar / Drive / Docs / Sheets / YouTube / Analytics

方針:
- 事務・運用・分析・動画・レポート作成の中心基盤とする
- 既存の業務データと接続し、AIに実務情報を渡せるようにする

### 8.4 Canva

用途:
- SNS素材・バナー・広告画像・LP素材の制作案

方針:
- 画像生成はAIが提案し、Canvaに素材として落とし込む
- 実作業は自動化せず、承認済み案だけを生成・送付する

### 8.5 SNS

用途:
- 投稿案作成
- コメント/DM整理
- フォロワー分析
- 投稿予約準備

方針:
- SNSは「提案・準備・予約」までを担当し、実投稿は承認後のみ実行する
- 各SNSの規約・ブランド表現に応じたチェックを必須化する

### 8.6 ASP

用途:
- ASP案件整理
- 収益化候補管理
- 成果分析
- 提携案件の比較

方針:
- 収益化を優先するため、ASP接続は優先度高とする
- クリック・申込・成果の指標を統合的に追跡する

---

## 9. Operator Mode と Developer Mode の分離案

KEVIRIOは、利用者の役割によって2つのモードに分ける。

### 9.1 Operator Mode

対象:
- オーナー
- 運用担当
- 事業責任者

目的:
- 仕事を進める
- 承認・修正・判断を行う
- 収益化・案件・SNS・承認フローを管理する

特徴:
- 画面はシンプル
- 一目で次のアクションが分かる
- 承認・保留・修正依頼に集中する

### 9.2 Developer Mode

対象:
- 開発者
- システム構築者
- AI基盤管理者

目的:
- API接続
- モデルルーティング
- MCPサーバー管理
- ワークフロー定義
- エラー監視
- データ構造変更

特徴:
- 技術設定・接続状態・ログ・ルール管理を扱う
- オペレーターには見せない設定を含む

### 9.3 分離の考え方

- Operator Modeは「意思決定・承認・実行支援」中心
- Developer Modeは「基盤・接続・拡張」中心
- UI上は同じKEVIRIOでも、表示内容と操作対象を分ける

---

## 10. MCP 導入方針

MCP（Model Context Protocol）を導入し、AIに対して外部ツール・データ・操作対象を標準化した形で提供する。

### 10.1 MCP導入の狙い

- AIが外部サービスと安全に接続できるようにする
- 各ツールの呼び出し方法を統一する
- 画面側の実装を簡略化する
- 将来的なAIエージェントの拡張性を上げる

### 10.2 想定するMCP利用対象

- Google Workspace
- Canva
- SNS投稿管理
- ASP案件管理
- Notion / Docs / Sheets系の知識基盤
- 監査・承認ログ

### 10.3 導入方針

- 最初は「読み取り・要約・下書き」中心にする
- 実行系はオーナー承認ゲートを必須にする
- 秘密情報やトークンはMCPサーバー側で管理する

---

## 11. Claude Code Router 的な AI ルーティング方針

KEVIRIOでは、AIモデルを単一モデルで運用するのではなく、用途に応じてルーティングする。

### 11.1 ルーティングの基本原則

- リサーチ・最新情報: Perplexity
- 長文レビュー・仕様整理・ブランド確認: Claude
- 文章生成・要約・タスク整理: OpenAI / Gemini
- Google連携・資料整理: Google系
- 画像・素材制作: Canva

### 11.2 ルーティング例

- 競合調査 → Perplexity
- 法務・規約チェック → Claude
- 投稿文作成 → OpenAI / Gemini
- 長文レポート作成 → Claude
- 資料整理・Google Docs連携 → Google
- Canva素材案 → Canva

### 11.3 ルーティングの守るべきルール

- 重要な判断は複数モデルの比較を通して行う
- ルール・ガードレール・承認フローを前提にする
- モデル失敗時はフォールバックするが、オーナー承認は維持する

---

## 12. 9割自動化・1割承認の UX 方針

KEVIRIOのUI設計は、「AIが9割をこなすが、人間が1割だけ確認する」構造を前提にする。

### 12.1 UXの目標

- 1つの作業に対して、必要な操作は最小限にする
- AIがタスクを整理し、オーナーに見せるものは「判断しやすい最小単位」にする
- 画面遷移を減らし、重要な意思決定だけに集中させる

### 12.2 UI方針

- Homeに「今日の優先アクション」を集約する
- 承認は一箇所に集約する
- すべての提案は「承認 / 修正 / 保留 / 却下」の4択で扱う
- 生成物は「案」レベルで提示し、最終実行は承認後にする

### 12.3 オーナー向け体験

- 迷う必要がない
- 何を確認すべきか明確
- 次に押すべきボタンが一つに見える
- 重要な指標だけを見れば良い

---

## 13. 今後の v5.3 〜 v6 ロードマップ

### v5.3: Operator Foundation

目標:
- Home / Campaign / Approval / Analytics / Settingsを中心に画面整理する
- AI Orchestratorを安定化する
- Claude / Perplexity / Google / Canva / SNS / ASPの接続方針を固める

主な成果:
- 主要フローの統合
- 承認フローの標準化
- 接続候補の整理

### v5.4: AI Workforce Expansion

目標:
- AI社員の役割を明文化する
- 収益化・SNS・分析・制作・承認のAgentを統合する
- Business Memoryをより実務に近い形で活用する

主な成果:
- 役割別Agentの定義
- 業務フローの自動化
- 学習蓄積の標準化

### v5.5: MCP & Connector Layer

目標:
- MCPベースの外部接続基盤を整える
- Google / Canva / SNS / ASP接続を実装する
- ルーティングとガードレールを強化する

主な成果:
- 接続層の標準化
- 安全な実行制御
- AIエージェントの拡張性向上

### v5.6: Autonomous Business OS

目標:
- KEVIRIOを「会社を運営するOS」に近づける
- 収益化・キャンペーン・承認・分析を一つの運用層で動かす
- オーナーは判断と承認だけに集中できる状態を作る

主な成果:
- ほぼ自動の運用基盤
- AI社員による提案・準備・記録
- 人間中心の最終決裁モデル

---

## 14. 実装上の注意点

- 既存コードは変更しない
- APIキーや秘密情報は記載しない
- 最終決裁はオーナーに委ねる
- 機能は増やすが、操作は減らす
- 画面は増やしすぎない
- 重要な外部実行は必ず承認ゲートを設ける

---

## 15. まとめ

KEVIRIOは、単なるAI支援ツールではなく、AI社員と会社を一体で運用するためのBusiness Operating Systemへ発展させることを目指す。

この設計では、以下の3点を中核に置く。

1. 画面は少数に集約し、操作を最小化する
2. AI社員を裏側のエージェントとして統合する
3. 収益化・承認・分析・実行を一つの流れにまとめる

この設計書は、今後の実装判断の基準として活用し、最終的な採用・優先順位はオーナー決裁とする。
