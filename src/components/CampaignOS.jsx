import { useState } from "react";
import {
  buildApprovalItemsFromCampaign,
  buildCampaignPlan,
  buildDecisionFromCampaign,
  buildWorkflowFromCampaign,
  initialCampaigns,
} from "../services/campaignEngine";
import { buildMemoryRecordFromDecision } from "../services/memoryEngine";

const platformOptions = ["Instagram", "Threads", "X", "Blog", "TikTok", "YouTube", "LinkedIn"];
const countryOptions = ["JP", "US", "UK", "PH", "KR", "TW", "AU"];

export default function CampaignOS({
  campaigns,
  setCampaigns,
  setDraft,
  setApprovals,
  setWorkflows,
  setDecisionJournal,
  setMemoryRecords,
  setPage,
}) {
  const [form, setForm] = useState({
    theme: "",
    product: "",
    objective: "affiliate",
    expectedRevenue: 12000,
    platforms: ["Instagram", "Threads", "X", "Blog"],
    countries: ["JP", "US"],
  });
  const [preview, setPreview] = useState(null);

  const toggleList = (key, value) => {
    setForm((prev) => {
      const exists = prev[key].includes(value);
      return {
        ...prev,
        [key]: exists ? prev[key].filter((item) => item !== value) : [...prev[key], value],
      };
    });
  };

  const generate = () => {
    const campaign = buildCampaignPlan(form);
    setPreview(campaign);
  };

  const approveToSystem = () => {
    const campaign = preview || buildCampaignPlan(form);
    const approvals = buildApprovalItemsFromCampaign(campaign);
    const workflow = buildWorkflowFromCampaign(campaign);
    const decision = buildDecisionFromCampaign(campaign, "承認待ち");

    setCampaigns((prev) => [campaign, ...prev]);
    setApprovals((prev) => [...approvals, ...prev]);
    setWorkflows((prev) => [workflow, ...prev]);
    setDecisionJournal?.((prev) => [decision, ...prev]);
    setMemoryRecords?.((prev) => [buildMemoryRecordFromDecision(decision), ...prev]);

    setDraft({
      title: `${campaign.title}｜統合下書き`,
      channel: campaign.platforms.join(" / "),
      asp: campaign.product,
      value: campaign.expectedRevenue,
      body: `テーマ：${campaign.theme}
目的：${campaign.objective}
対象国：${campaign.countries.join(", ")}
SNS：${campaign.platforms.join(", ")}
想定売上：${Number(campaign.expectedRevenue || 0).toLocaleString()}円

【日本向け投稿】
${campaign.posts.filter((post) => post.language === "ja").map((post, i) => `${i + 1}. ${post.platform}\n${post.copy}`).join("\n\n")}

【海外向け投稿】
${campaign.posts.filter((post) => post.language === "en").map((post, i) => `${i + 1}. ${post.platform}\n${post.copy}`).join("\n\n")}

【Creative】
${campaign.creativeBriefs.map((brief) => `- ${brief.title}: ${brief.direction}`).join("\n")}

【Video】
${campaign.videoBriefs.map((brief) => `- ${brief.title}: ${brief.script}`).join("\n")}

【Legal】
${campaign.legalChecklist.map((item) => `- ${item}`).join("\n")}

【最終決裁】
外部投稿・予約投稿・送信・契約・決済はオーナー承認後に行うこと。
`,
    });

    setPage("approval");
  };

  const resetSamples = () => {
    if (!window.confirm("Campaignサンプルを初期状態に戻しますか？")) return;
    setCampaigns(initialCampaigns);
  };

  const current = preview;

  return (
    <main className="content">
      <section className="hero v5-hero">
        <p className="eyebrow">CAMPAIGN OS v5.0</p>
        <h1>1テーマから、日本向け3本・海外向け3本を一括生成。</h1>
        <p className="lead">
          Trend / Opportunity / Content / Translator / Creative / Video / Legal / Publisherを裏側で動かし、承認待ちまでまとめて作ります。
        </p>
        <div className="actions">
          <button onClick={generate}>AI社員に一括生成させる</button>
          <button onClick={approveToSystem}>承認待ちへ送る</button>
          <button onClick={resetSamples}>サンプルに戻す</button>
        </div>
      </section>

      <section className="panel">
        <div className="section-head">
          <div>
            <p className="eyebrow">SIMPLE COMMAND</p>
            <h2>入力は最小限</h2>
          </div>
          <span className="badge">9割自動化</span>
        </div>

        <div className="work-form">
          <input className="search" placeholder="テーマ 例：AIで副業作業を自動化する" value={form.theme} onChange={(e) => setForm({ ...form, theme: e.target.value })} />
          <input className="search" placeholder="商品・案件 例：FÜRDI / Panasonic / KEVIRIO" value={form.product} onChange={(e) => setForm({ ...form, product: e.target.value })} />
          <div className="toolbar">
            <select className="search small" value={form.objective} onChange={(e) => setForm({ ...form, objective: e.target.value })}>
              <option value="affiliate">アフィリエイト</option>
              <option value="ads">広告収益</option>
              <option value="lead">見込み客獲得</option>
              <option value="sales">営業</option>
              <option value="brand">ブランディング</option>
              <option value="global">海外展開</option>
            </select>
            <input className="search small" type="number" value={form.expectedRevenue} onChange={(e) => setForm({ ...form, expectedRevenue: e.target.value })} />
          </div>
        </div>

        <div className="v5-picker">
          <div>
            <h3>SNS</h3>
            <div className="pill-list">
              {platformOptions.map((platform) => (
                <button key={platform} className={form.platforms.includes(platform) ? "active" : ""} onClick={() => toggleList("platforms", platform)}>
                  {platform}
                </button>
              ))}
            </div>
          </div>
          <div>
            <h3>Countries</h3>
            <div className="pill-list">
              {countryOptions.map((country) => (
                <button key={country} className={form.countries.includes(country) ? "active" : ""} onClick={() => toggleList("countries", country)}>
                  {country}
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>

      {current && (
        <>
          <div className="stats">
            <div className="stat-card"><span>Posts</span><strong>{current.posts.length}本</strong><p>日本3 + 海外3</p></div>
            <div className="stat-card"><span>Expected</span><strong>{Number(current.expectedRevenue).toLocaleString()}円</strong><p>想定売上</p></div>
            <div className="stat-card"><span>AI Agents</span><strong>{current.aiAgents.length}</strong><p>裏側で稼働</p></div>
            <div className="stat-card"><span>Status</span><strong>{current.status}</strong><p>Owner Final</p></div>
          </div>

          <section className="panel">
            <div className="section-head">
              <div>
                <p className="eyebrow">GENERATED POSTS</p>
                <h2>投稿案</h2>
              </div>
              <span className="badge">Approval Required</span>
            </div>
            <div className="grid">
              {current.posts.map((post) => (
                <div className="card" key={post.id}>
                  <span className="badge">{post.platform} / {post.language}</span>
                  <h2>{post.title}</h2>
                  <p>{post.copy}</p>
                  <small>{post.hashtags.join(" ")}</small>
                </div>
              ))}
            </div>
          </section>

          <section className="panel">
            <div className="section-head">
              <div>
                <p className="eyebrow">CREATIVE / VIDEO / LEGAL</p>
                <h2>制作・動画・確認項目</h2>
              </div>
            </div>
            <div className="grid">
              <div className="card">
                <span className="badge">Canva</span>
                <h2>画像案</h2>
                <ul>{current.creativeBriefs.map((brief) => <li key={brief.title}>{brief.title}｜{brief.direction}</li>)}</ul>
              </div>
              <div className="card">
                <span className="badge">CapCut / Video</span>
                <h2>動画案</h2>
                <ul>{current.videoBriefs.map((brief) => <li key={brief.title}>{brief.title}｜{brief.length}</li>)}</ul>
              </div>
              <div className="card">
                <span className="badge">Legal</span>
                <h2>承認前チェック</h2>
                <ul>{current.legalChecklist.map((item) => <li key={item}>{item}</li>)}</ul>
              </div>
            </div>
          </section>
        </>
      )}

      <section className="panel">
        <div className="section-head">
          <div>
            <p className="eyebrow">CAMPAIGN HISTORY</p>
            <h2>作成済みCampaign</h2>
          </div>
        </div>
        <div className="mission-list">
          {campaigns.map((campaign) => (
            <div key={campaign.id}>
              {campaign.title}｜{campaign.status}｜{Number(campaign.expectedRevenue || 0).toLocaleString()}円
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
