"use client";

import { useState } from "react";

type Plan = "standard" | "pro" | "enterprise" | "unknown";

export function SubscribeForm({ defaultPlan = "standard" }: { defaultPlan?: Plan }) {
  const [form, setForm] = useState({
    email: "",
    name: "",
    phone: "",
    company: "",
    plan: defaultPlan as Plan,
    message: "",
  });
  const [done, setDone] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function set<K extends keyof typeof form>(k: K, v: (typeof form)[K]) {
    setForm((f) => ({ ...f, [k]: v }));
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const res = await fetch("/api/subscribe", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...form, source: "pricing" }),
    });
    setBusy(false);
    if (!res.ok) {
      const j = await res.json().catch(() => ({}));
      setError(j.error || "전송에 실패했습니다.");
      return;
    }
    setDone(true);
  }

  if (done) {
    return (
      <div className="rounded-lg border border-safe/30 bg-safe/10 p-6 text-sm text-safe">
        <p className="font-semibold">문의가 접수되었습니다.</p>
        <p className="mt-1 text-ink">
          영업일 기준 빠르게 연락드리겠습니다. 그동안 무료 자가진단으로 증빙 갭을 먼저
          확인해 보세요.
        </p>
        <a href="/diagnosis" className="mt-3 inline-block font-medium text-safe hover:underline">
          무료 자가진단 하러 가기 →
        </a>
      </div>
    );
  }

  const input =
    "w-full rounded-md border border-border bg-surface px-3 py-2 text-sm text-ink outline-none focus-visible:ring-2 focus-visible:ring-safe";

  return (
    <form onSubmit={submit} className="space-y-3 rounded-lg border border-border bg-white p-6">
      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <label htmlFor="company" className="text-sm font-medium text-ink">사업장/회사명</label>
          <input id="company" className={`mt-1 ${input}`} value={form.company}
            onChange={(e) => set("company", e.target.value)} placeholder="(주)세이프" />
        </div>
        <div>
          <label htmlFor="name" className="text-sm font-medium text-ink">담당자</label>
          <input id="name" className={`mt-1 ${input}`} value={form.name}
            onChange={(e) => set("name", e.target.value)} placeholder="홍길동" />
        </div>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <label htmlFor="email" className="text-sm font-medium text-ink">이메일 *</label>
          <input id="email" type="email" required className={`mt-1 ${input}`} value={form.email}
            onChange={(e) => set("email", e.target.value)} placeholder="ceo@company.kr" />
        </div>
        <div>
          <label htmlFor="phone" className="text-sm font-medium text-ink">연락처</label>
          <input id="phone" className={`mt-1 ${input}`} value={form.phone}
            onChange={(e) => set("phone", e.target.value)} placeholder="010-0000-0000" />
        </div>
      </div>
      <div>
        <label htmlFor="plan" className="text-sm font-medium text-ink">관심 플랜</label>
        <select id="plan" className={`mt-1 ${input}`} value={form.plan}
          onChange={(e) => set("plan", e.target.value as Plan)}>
          <option value="standard">스탠다드 (월 49,000원)</option>
          <option value="pro">프로 (월 99,000원)</option>
          <option value="enterprise">엔터프라이즈 / 대행·다중 사업장</option>
          <option value="unknown">아직 모르겠음</option>
        </select>
      </div>
      <div>
        <label htmlFor="message" className="text-sm font-medium text-ink">문의 내용</label>
        <textarea id="message" rows={3} className={`mt-1 ${input}`} value={form.message}
          onChange={(e) => set("message", e.target.value)}
          placeholder="업종·사업장 규모, 궁금한 점을 적어주세요." />
      </div>
      {error && <p className="text-sm text-danger">{error}</p>}
      <button type="submit" disabled={busy}
        className="w-full rounded-md bg-safe px-4 py-2.5 text-sm font-semibold text-white hover:bg-safe-hover disabled:opacity-60">
        {busy ? "전송 중…" : "구독 문의하기"}
      </button>
      <p className="text-xs text-muted">제출 시 안내·상담 목적의 연락에 동의하는 것으로 간주됩니다.</p>
    </form>
  );
}
