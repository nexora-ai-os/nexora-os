import React,{useMemo,useState}from"react";
import{createRoot}from"react-dom/client";
import{Bot,Copy,ExternalLink,Flame,Home,Library,Megaphone,Settings,ShieldCheck,Sparkles,Target,WalletCards,WandSparkles,ChartNoAxesCombined,BrainCircuit}from"lucide-react";
import"./styles.css";

const links={
ai:[["ChatGPT","https://chatgpt.com/"],["Claude","https://claude.ai/"],["Gemini","https://gemini.google.com/"]],
create:[["Canva","https://www.canva.com/"],["CapCut","https://www.capcut.com/"],["Drive","https://drive.google.com/"],["Docs","https://docs.google.com/"],["Sheets","https://sheets.google.com/"]],
sns:[["Instagram","https://www.instagram.com/"],["Threads","https://www.threads.net/"],["X","https://x.com/"],["TikTok","https://www.tiktok.com/"],["YouTube Studio","https://studio.youtube.com/"]],
money:[["A8.net","https://www.a8.net/"],["もしも","https://af.moshimo.com/"],["楽天","https://affiliate.rakuten.co.jp/"],["アクセストレード","https://www.accesstrade.ne.jp/"]]
};

function makePrompt(theme,type){
return `あなたはNEXORAのCOOです。

# NEXORA
AIと仕組みで、仕事をもっと自由に。

# 方針
- iPad中心
- 顔出しなし
- 自分の声なし
- 図解・AI音声・AI動画中心
- 1つのネタから6媒体へ展開
- 誇張しない
- 要確認は要確認と書く
- CEOの作業を最小化する

# 今日のテーマ
${theme||"未入力"}

# 投稿タイプ
${type}

# 出力
1. Instagramカルーセル構成
2. Instagramキャプション
3. Threads投稿3案
4. X投稿3案
5. TikTok/YouTube Shorts 30秒台本
6. AI音声ナレーション
7. Canva画像指示
8. CapCut編集指示
9. CTA
10. ハッシュタグ
11. 収益導線
12. 投稿前チェックリスト

そのままNotionへ保存できる形で出力してください。`;
}

function Section({title,icon:Icon,children}){
return <section className="panel"><div className="section-title"><Icon size={19}/><h2>{title}</h2></div>{children}</section>
}

function Btn({name,url,primary}){
return <a className={`link-btn ${primary?"primary":""}`} href={url} target="_blank" rel="noreferrer"><span>{name}</span><ExternalLink size={15}/></a>
}

function App(){
const[active,setActive]=useState("dashboard");
const[theme,setTheme]=useState("");
const[type,setType]=useState("初心者向け");
const prompt=useMemo(()=>makePrompt(theme,type),[theme,type]);
const copy=async()=>{await navigator.clipboard.writeText(prompt);alert("コピーしました")};

const nav=[
["dashboard",Home,"Dashboard"],
["studio",WandSparkles,"Content Studio"],
["ai",Bot,"AI Hub"],
["prompts",Library,"Prompt Library"],
["buzz",Flame,"Buzz Lab"],
["money",WalletCards,"Affiliate"],
["analytics",ChartNoAxesCombined,"Analytics"],
["settings",Settings,"Settings"]
];

return <div className="app">
<aside className="sidebar">
<div className="brand"><div className="mark">N</div><div><div className="brand-name">NEXORA</div><div className="brand-sub">AI OS v2.0</div></div></div>
{nav.map(([k,I,l])=><button key={k} className={`nav ${active===k?"on":""}`} onClick={()=>setActive(k)}><I size={18}/>{l}</button>)}
</aside>

<main className="main">
<header className="top">
<div><p className="eyebrow">SECURE AI COMMAND CENTER</p><h1>NEXORA AI OS</h1><p className="lead">AIと仕組みで、仕事をもっと自由に。健さんは作業ではなく判断に集中する。</p></div>
<div className="security"><ShieldCheck size={18}/>Basic Auth Ready</div>
</header>

<div className="metrics">
<div className="metric"><b>1</b><span>今日のテーマ</span></div>
<div className="metric"><b>6</b><span>媒体へ展開</span></div>
<div className="metric"><b>30-60m</b><span>目標作業</span></div>
<div className="metric"><b>95%</b><span>AI化目標</span></div>
</div>

{active==="dashboard"&&<div className="grid">
<Section title="今日のCEOタスク" icon={Target}>
<div className="todo"><label><input type="checkbox"/> 今日のテーマを1つ決める</label><label><input type="checkbox"/> One Commandで投稿案を作る</label><label><input type="checkbox"/> 投稿後に数字を記録する</label></div>
</Section>
<Section title="Quick Launch" icon={Sparkles}>{links.ai.map((l,i)=><Btn key={l[0]} name={l[0]} url={l[1]} primary={i===0}/>)}</Section>
<Section title="制作・管理" icon={BrainCircuit}>{links.create.map(l=><Btn key={l[0]} name={l[0]} url={l[1]}/>)}</Section>
<Section title="SNS運営" icon={Megaphone}>{links.sns.map(l=><Btn key={l[0]} name={l[0]} url={l[1]}/>)}</Section>
</div>}

{active==="studio"&&<Section title="One Command Generator" icon={WandSparkles}>
<label>テーマ</label><input value={theme} onChange={e=>setTheme(e.target.value)} placeholder="例：ChatGPTで仕事を10分短縮する使い方3選"/>
<label>投稿タイプ</label><select value={type} onChange={e=>setType(e.target.value)}><option>初心者向け</option><option>神機能紹介</option><option>比較</option><option>ランキング</option><option>レビュー</option></select>
<button className="copy" onClick={copy}><Copy size={17}/> プロンプトをコピー</button>
<pre className="prompt">{prompt}</pre>
</Section>}

{active==="ai"&&<div className="grid">
<Section title="ChatGPT" icon={Bot}><p className="role">COO / 戦略・企画・SNS統括</p><p className="small">収益導線と作業削減を優先。</p></Section>
<Section title="Claude" icon={Bot}><p className="role">編集長 / ブログ・校正</p><p className="small">読みやすさとSEOを重視。</p></Section>
<Section title="Gemini" icon={Bot}><p className="role">市場調査部長</p><p className="small">最新情報・競合分析を担当。</p></Section>
</div>}

{active==="prompts"&&<Section title="Prompt Library" icon={Library}><p className="small">CMD-001 6媒体一括生成 / CMD-002 Instagram / CMD-003 Shorts / CMD-004 X・Threads / CMD-005 ブログ</p></Section>}
{active==="buzz"&&<Section title="Buzz Lab" icon={Flame}><p className="small">バズ投稿を保存し、伸びた理由を分析する場所です。</p></Section>}
{active==="money"&&<div className="grid">{links.money.map(l=><Section key={l[0]} title={l[0]} icon={WalletCards}><Btn name="管理画面を開く" url={l[1]}/></Section>)}</div>}
{active==="analytics"&&<Section title="Analytics" icon={ChartNoAxesCombined}><p className="small">投稿数・再生数・保存数・クリック数・売上を記録します。</p></Section>}
{active==="settings"&&<Section title="Settings" icon={Settings}><p className="small">Notion / Sheets / WordPress / API連携は次フェーズで追加します。</p></Section>}
</main>
</div>
}

createRoot(document.getElementById("root")).render(<App/>);
