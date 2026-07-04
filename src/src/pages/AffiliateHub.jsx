const affiliatePrograms = [
{
name: "PLAUD",
asp: "A8.net",
category: "AIボイスレコーダー",
reward: "購入10%",
status: "提携済み",
sns: "★★★★★",
blog: "★★★★★",
score: 95,
},
{
name: "ConoHa AI Canvas",
asp: "A8.net",
category: "AI画像生成",
reward: "500円〜4,000円",
status: "提携済み",
sns: "★★★★★",
blog: "★★★★★",
score: 93,
},
{
name: "Value AI Writer",
asp: "A8.net",
category: "SEO記事生成AI",
reward: "有料プラン購入40%",
status: "提携済み",
sns: "★★★★☆",
blog: "★★★★★",
score: 90,
},
{
name: "Doraverse",
asp: "A8.net",
category: "BtoB AI SaaS",
reward: "無料登録62円〜",
status: "提携済み",
sns: "★★★☆☆",
blog: "★★★★☆",
score: 84,
},
{
name: "RingConn",
asp: "A8.net",
category: "AIスマートリング",
reward: "購入7%",
status: "提携済み",
sns: "★★★★☆",
blog: "★★★★☆",
score: 82,
},
{
name: "Twomi",
asp: "A8.net",
category: "AI × SNS",
reward: "新規インストール300円",
status: "提携済み",
sns: "★★★★★",
blog: "★★★☆☆",
score: 80,
},
{
name: "ココナラ",
asp: "A8.net",
category: "副業・スキル販売",
reward: "新規会員登録100円〜",
status: "提携済み",
sns: "★★★★☆",
blog: "★★★★★",
score: 78,
},
{
name: "SAZO",
asp: "A8.net",
category: "韓国購入代行",
reward: "購入5%",
status: "提携済み",
sns: "★★★☆☆",
blog: "★★★☆☆",
score: 65,
},
];

export default function AffiliateHub() {
return (
<section className="panel">
<h1>Affiliate Hub</h1>
<p className="muted">
NEXORAで使えるASP案件を管理し、投稿テーマと収益導線をつなげる画面です。
</p>

<div className="grid">
{affiliatePrograms.map((item) => (
<div className="card" key={item.name}>
<div className="card-header">
<h2>{item.name}</h2>
<span className="badge">{item.asp}</span>
</div>

<p>{item.category}</p>

<ul>
<li>報酬：{item.reward}</li>
<li>提携状況：{item.status}</li>
<li>SNS向き：{item.sns}</li>
<li>ブログ向き：{item.blog}</li>
<li>Revenue Score：{item.score}</li>
</ul>
</div>
))}
</div>
</section>
);
}
