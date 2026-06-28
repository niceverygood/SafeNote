"use client";

import { useState } from "react";
import { getBrowserSupabase } from "@/lib/supabase/client";
import { Disclaimer } from "@/components/ds/Disclaimer";

export default function AdminLoginPage() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const supabase = getBrowserSupabase();
    const next = new URLSearchParams(window.location.search).get("next") || "/admin";
    const { error } = await supabase.auth.signInWithOtp({
      email: email.trim().toLowerCase(),
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}`,
      },
    });
    setLoading(false);
    if (error) setError("로그인 링크 전송에 실패했습니다. 잠시 후 다시 시도하세요.");
    else setSent(true);
  }

  return (
    <main className="mx-auto flex min-h-[70vh] max-w-md flex-col justify-center px-6">
      <div className="rounded-lg border border-border bg-white p-8">
        <p className="text-xs font-semibold tracking-wider text-safe">SAFENOTE ADMIN</p>
        <h1 className="mt-2 text-xl font-bold text-ink">관리자 로그인</h1>
        <p className="mt-1 text-sm text-muted">
          등록된 관리자 이메일로 로그인 링크를 보내드립니다. 비밀번호가 없는 안전한
          매직링크 방식입니다.
        </p>

        {sent ? (
          <div className="mt-6 rounded-md border border-safe/30 bg-safe/10 p-4 text-sm text-safe">
            <strong className="font-semibold">{email}</strong> 으로 로그인 링크를
            보냈습니다. 메일함을 확인해 링크를 클릭하세요.
          </div>
        ) : (
          <form onSubmit={onSubmit} className="mt-6 space-y-3">
            <label className="block text-sm font-medium text-ink" htmlFor="email">
              관리자 이메일
            </label>
            <input
              id="email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="dev@bottlecorp.kr"
              className="w-full rounded-md border border-border bg-surface px-3 py-2 text-sm text-ink outline-none focus-visible:ring-2 focus-visible:ring-safe"
            />
            {error && <p className="text-sm text-danger">{error}</p>}
            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-md bg-safe px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-safe-hover disabled:opacity-60"
            >
              {loading ? "전송 중…" : "로그인 링크 받기"}
            </button>
          </form>
        )}
      </div>
      <Disclaimer className="mt-6 text-center" />
    </main>
  );
}
