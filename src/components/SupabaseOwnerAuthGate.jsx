import { cloneElement, useEffect, useMemo, useState } from "react";
import { createSupabaseBrowserClient } from "../services/supabaseBrowserClient";

export default function SupabaseOwnerAuthGate({ children }) {
  const client = useMemo(() => createSupabaseBrowserClient(), []);
  const [session, setSession] = useState(null); const [email, setEmail] = useState(""); const [password, setPassword] = useState(""); const [loading, setLoading] = useState(Boolean(client)); const [message, setMessage] = useState("");
  useEffect(() => { if (!client) { setLoading(false); return undefined; } let active = true; client.auth.getSession().then(({ data }) => { if (active) { setSession(data.session); setLoading(false); } }); const { data } = client.auth.onAuthStateChange((_event, next) => setSession(next)); return () => { active = false; data.subscription.unsubscribe(); }; }, [client]);
  const signIn = async (event) => { event.preventDefault(); if (!client) return; setLoading(true); const { error } = await client.auth.signInWithPassword({ email, password }); setPassword(""); setLoading(false); setMessage(error ? "Ownerログインを確認できません。" : ""); };
  if (loading) return <main className="content"><section className="panel"><h1>Owner認証を確認中</h1><p>Sessionを確認しています。</p></section></main>;
  if (!client) return <main className="content"><section className="panel"><h1>Ownerログインが必要です</h1><p>Supabase Auth未設定のため、SandboxはLockedです。</p></section></main>;
  if (!session) return <main className="content"><section className="panel"><h1>Ownerログイン</h1><form onSubmit={signIn}><label>Email<input type="email" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="username" required /></label><label>Password<input type="password" value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="current-password" required /></label><button type="submit">ログイン</button></form>{message && <p role="alert">{message}</p>}</section></main>;
  const signOut = async () => { if (!client) return; await client.auth.signOut(); setSession(null); };
  const getOwnerAccessToken = () => session?.access_token || null;
  return <><div className="owner-auth-toolbar"><span>Owner session verified</span><button type="button" onClick={signOut}>Logout</button></div>{cloneElement(children, { getOwnerAccessToken })}</>;
}
