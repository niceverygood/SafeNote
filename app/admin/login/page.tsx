"use client";

import { useState } from "react";
import { getBrowserSupabase } from "@/lib/supabase/client";
import { Disclaimer } from "@/components/ds/Disclaimer";

export default function AdminLoginPage() {
  const [mode, setMode] = useState<"password" | "magic">("password");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function nextUrl() {
    return new URLSearchParams(window.location.search).get("next") || "/admin";
  }

  async function passwordLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const supabase = getBrowserSupabase();
    const { error } = await supabase.auth.signInWithPassword({
      email: email.trim().toLowerCase(),
      password,
    });
    setLoading(false);
    if (error) {
      setError("아이디 또는 비밀번호가 올바르지 않습니다.");
      return;
    }
    window.location.href = nextUrl();
  }

  async function magicLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const supabase = getBrowserSupabase();
    const { error } = await supabase.auth.signInWithOtp({
      email: email.trim().toLowerCase(),
      options: { emailRedirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(nextUrl())}` },
    });
    setLoading(false);
    if (error) setError("로그인 링크 전송에 실패했습니다.");
    else setSent(true);
  }

  const inputCls =
    "w-full rounded-md border border-border bg-surface px-3 py-2 text-sm text-ink outline-none focus-visible:ring-2 focus-visible:ring-safe";

  return (
    <main className="mx-auto flex min-h-[70vh] max-w-md flex-col justify-center px-6">
      <div className="rounded-lg border border-border bg-white p-8">
        <p className="text-xs font-semibold tracking-wider text-safe">SAFENOTE ADMIN</p>
        <h1 className="mt-2 text-xl font-bold text-ink">사업장 관리자 로그인</h1>
        <p className="mt-1 text-sm text-muted">
          {mode === "password"
            ? "발급받은 아이디(이메일)와 비밀번호로 로그인하세요."
            : "등록된 이메일로 로그인 링크를 보내드립니다."}
        </p>

        {sent ? (
          <div className="mt-6 rounded-md border border-safe/30 bg-safe/10 p-4 text-sm text-safe">
            <strong className="font-semibold">{email}</strong> 으로 로그인 링크를 보냈습니다. 메일함을
            확인하세요.
          </div>
        ) : mode === "password" ? (
          <form onSubmit={passwordLogin} className="mt-6 space-y-3">
            <div>
              <label className="block text-sm font-medium text-ink" htmlFor="email">아이디(이메일)</label>
              <input id="email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)}
                placeholder="manager@safenote.test" className={`mt-1 ${inputCls}`} />
            </div>
            <div>
              <label className="block text-sm font-medium text-ink" htmlFor="pw">비밀번호</label>
              <input id="pw" type="password" required value={password} onChange={(e) => setPassword(e.target.value)}
                placeholder="비밀번호" className={`mt-1 ${inputCls}`} />
            </div>
            {error && <p className="text-sm text-danger">{error}</p>}
            <button type="submit" disabled={loading}
              className="w-full rounded-md bg-safe px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-safe-hover disabled:opacity-60">
              {loading ? "로그인 중…" : "로그인"}
            </button>
            <button type="button" onClick={() => { setMode("magic"); setError(null); }}
              className="w-full text-center text-xs text-muted hover:text-ink">
              이메일 매직링크로 로그인
            </button>
          </form>
        ) : (
          <form onSubmit={magicLogin} className="mt-6 space-y-3">
            <label className="block text-sm font-medium text-ink" htmlFor="memail">이메일</label>
            <input id="memail" type="email" required value={email} onChange={(e) => setEmail(e.target.value)}
              placeholder="name@company.kr" className={inputCls} />
            {error && <p className="text-sm text-danger">{error}</p>}
            <button type="submit" disabled={loading}
              className="w-full rounded-md bg-safe px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-safe-hover disabled:opacity-60">
              {loading ? "전송 중…" : "로그인 링크 받기"}
            </button>
            <button type="button" onClick={() => { setMode("password"); setError(null); }}
              className="w-full text-center text-xs text-muted hover:text-ink">
              아이디·비밀번호로 로그인
            </button>
          </form>
        )}
      </div>
      <Disclaimer className="mt-6 text-center" />
    </main>
  );
}
