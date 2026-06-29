"use client";

/**
 * 노동자용 앱 (모바일 우선, 무가입).
 * 참여코드로 입장 → 작업 전 안전점검(위험 고지+체크+서명) / 위험 신고.
 * 노동자 보호 활동이 곧 면책 증빙이 되도록, 제출 시 불변 로그(해시)로 기록.
 */
import { useCallback, useEffect, useState } from "react";

interface Session {
  workspace_id: string;
  workspace_name: string;
  industry_code: string | null;
  worker_id: string;
  worker_name: string;
}
interface Proc {
  process: string;
  hazards: string[];
  items: string[];
}

const KEY = "safenote_worker";
const btn =
  "w-full rounded-lg px-4 py-3.5 text-base font-semibold transition-colors disabled:opacity-60";
const field =
  "w-full rounded-lg border border-border bg-white px-4 py-3 text-base text-ink outline-none focus-visible:ring-2 focus-visible:ring-safe";

export default function WorkerApp() {
  const [session, setSession] = useState<Session | null>(null);
  const [view, setView] = useState<"home" | "check" | "report">("home");

  useEffect(() => {
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) setSession(JSON.parse(raw));
    } catch {
      /* ignore */
    }
  }, []);

  const save = useCallback((s: Session | null) => {
    setSession(s);
    try {
      if (s) localStorage.setItem(KEY, JSON.stringify(s));
      else localStorage.removeItem(KEY);
    } catch {
      /* ignore */
    }
  }, []);

  return (
    <main className="mx-auto min-h-dvh max-w-md bg-surface px-5 pb-16 pt-6">
      <div className="mb-6 flex items-center justify-between">
        <span className="flex items-center gap-2 text-sm font-bold text-ink">
          <span className="inline-flex h-6 w-6 items-center justify-center rounded-sm border border-safe/40 bg-safe/10">
            <span className="h-2.5 w-2.5 rounded-[2px] bg-safe" />
          </span>
          세이프노트 <span className="font-medium text-muted">안전점검</span>
        </span>
        {session && (
          <button
            onClick={() => {
              save(null);
              setView("home");
            }}
            className="text-xs text-muted hover:text-ink"
          >
            나가기
          </button>
        )}
      </div>

      {!session ? (
        <JoinView onJoined={(s) => save(s)} />
      ) : view === "home" ? (
        <HomeView session={session} go={setView} />
      ) : view === "check" ? (
        <CheckFlow session={session} back={() => setView("home")} />
      ) : (
        <ReportFlow session={session} back={() => setView("home")} />
      )}

      <p className="mt-10 text-center text-xs leading-relaxed text-muted">
        본 자료는 법률자문을 대체하지 않습니다.
      </p>
    </main>
  );
}

function JoinView({ onJoined }: { onJoined: (s: Session) => void }) {
  const [code, setCode] = useState("");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const res = await fetch("/api/worker/join", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ join_code: code.trim(), name: name.trim(), phone: phone.trim() || undefined }),
    });
    setBusy(false);
    const j = await res.json().catch(() => ({}));
    if (!res.ok) {
      setError(j.error || "입장에 실패했습니다.");
      return;
    }
    onJoined(j as Session);
  }

  return (
    <div>
      <h1 className="text-xl font-bold text-ink">현장 입장</h1>
      <p className="mt-1 text-sm text-muted">
        사업장에서 받은 참여코드로 입장하세요. 가입은 필요 없습니다.
      </p>
      <form onSubmit={submit} className="mt-6 space-y-3">
        <input
          className={`${field} text-center text-lg font-semibold tracking-[0.3em] uppercase`}
          placeholder="참여코드"
          value={code}
          onChange={(e) => setCode(e.target.value)}
          maxLength={12}
          autoCapitalize="characters"
          required
        />
        <input className={field} placeholder="이름" value={name} onChange={(e) => setName(e.target.value)} required />
        <input
          className={field}
          placeholder="연락처 (선택)"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          inputMode="tel"
        />
        {error && <p className="text-sm text-danger">{error}</p>}
        <button type="submit" disabled={busy} className={`${btn} bg-safe text-white hover:bg-safe-hover`}>
          {busy ? "입장 중…" : "입장하기"}
        </button>
      </form>
    </div>
  );
}

function HomeView({ session, go }: { session: Session; go: (v: "check" | "report") => void }) {
  return (
    <div>
      <p className="text-sm text-muted">{session.workspace_name}</p>
      <h1 className="mt-1 text-2xl font-bold text-ink">
        {session.worker_name}님,<br />
        오늘도 안전하게.
      </h1>
      <p className="mt-2 text-sm leading-relaxed text-muted">
        작업 전 점검과 위험 신고는 나를 보호하는 기록이자, 사업장의 안전 증빙으로 남습니다.
      </p>
      <div className="mt-7 space-y-3">
        <button onClick={() => go("check")} className={`${btn} bg-safe text-left text-white hover:bg-safe-hover`}>
          작업 전 안전점검 시작
          <span className="mt-0.5 block text-sm font-normal text-white/80">오늘 작업의 위험을 확인하고 점검합니다</span>
        </button>
        <button
          onClick={() => go("report")}
          className={`${btn} border border-caution/50 bg-caution/10 text-left text-caution hover:bg-caution/20`}
        >
          위험 신고
          <span className="mt-0.5 block text-sm font-normal text-caution/80">위험한 상태를 발견하면 바로 알리세요</span>
        </button>
      </div>
    </div>
  );
}

function Done({ title, hash, back }: { title: string; hash?: string; back: () => void }) {
  return (
    <div className="rounded-lg border border-safe/30 bg-safe/10 p-6 text-center">
      <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-safe text-white">✓</div>
      <h2 className="mt-3 text-lg font-bold text-ink">{title}</h2>
      <p className="mt-1 text-sm text-muted">
        타임스탬프와 함께 위변조 방지 기록으로 안전하게 저장되었습니다.
      </p>
      {hash && (
        <p className="mt-2 num text-xs text-muted">증빙 해시 {hash.slice(0, 12)}…</p>
      )}
      <button onClick={back} className={`${btn} mt-5 border border-border bg-white text-ink hover:bg-surface`}>
        홈으로
      </button>
    </div>
  );
}

function CheckFlow({ session, back }: { session: Session; back: () => void }) {
  const [procs, setProcs] = useState<Proc[]>([]);
  const [baseItems, setBaseItems] = useState<string[]>([]);
  const [step, setStep] = useState(0);
  const [process, setProcess] = useState("");
  const [customProcess, setCustomProcess] = useState("");
  const [ack, setAck] = useState(false);
  const [checks, setChecks] = useState<Record<string, boolean>>({});
  const [sign, setSign] = useState(session.worker_name);
  const [busy, setBusy] = useState(false);
  const [doneHash, setDoneHash] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch(`/api/worker/context?workspace_id=${session.workspace_id}`)
      .then((r) => r.json())
      .then((d) => {
        setProcs(d.processes ?? []);
        setBaseItems(d.baseItems ?? []);
      })
      .catch(() => setBaseItems([]));
  }, [session.workspace_id]);

  const selected = procs.find((p) => p.process === process);
  const procName = process === "__custom__" ? customProcess : process;
  const hazards = selected?.hazards ?? [];
  const allItems = [...baseItems, ...(selected?.items ?? [])];

  async function submit() {
    setBusy(true);
    setError(null);
    const items = allItems.map((label) => ({ label, checked: !!checks[label] }));
    const res = await fetch("/api/worker/check", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        workspace_id: session.workspace_id,
        worker_id: session.worker_id,
        worker_name: session.worker_name,
        process: procName,
        hazards,
        items,
        acknowledged: ack,
        signature_name: sign,
      }),
    });
    setBusy(false);
    const j = await res.json().catch(() => ({}));
    if (!res.ok) {
      setError(j.error || "제출 실패");
      return;
    }
    setDoneHash(j.hash ?? "");
  }

  if (doneHash !== null) return <Done title="작업 전 점검 완료" hash={doneHash} back={back} />;

  return (
    <div>
      <button onClick={back} className="mb-3 text-sm text-muted">← 홈</button>
      <h1 className="text-xl font-bold text-ink">작업 전 안전점검</h1>

      {step === 0 && (
        <div className="mt-5 space-y-3">
          <p className="text-sm text-muted">오늘 어떤 작업을 하시나요?</p>
          {procs.map((p) => (
            <button
              key={p.process}
              onClick={() => {
                setProcess(p.process);
                setStep(1);
              }}
              className={`${btn} border text-left ${process === p.process ? "border-safe bg-safe/10 text-safe" : "border-border bg-white text-ink"}`}
            >
              {p.process}
            </button>
          ))}
          <div className="rounded-lg border border-border bg-white p-3">
            <input
              className={field}
              placeholder="직접 입력 (예: 자재 운반)"
              value={customProcess}
              onChange={(e) => setCustomProcess(e.target.value)}
            />
            <button
              disabled={!customProcess.trim()}
              onClick={() => {
                setProcess("__custom__");
                setStep(1);
              }}
              className={`${btn} mt-2 bg-safe text-white hover:bg-safe-hover`}
            >
              이 작업으로 시작
            </button>
          </div>
        </div>
      )}

      {step === 1 && (
        <div className="mt-5">
          <p className="text-sm font-semibold text-ink">{procName} — 위험요인 고지</p>
          {hazards.length ? (
            <ul className="mt-3 space-y-2">
              {hazards.map((h, i) => (
                <li key={i} className="flex gap-2 rounded-lg border border-caution/30 bg-caution/5 px-3 py-2.5 text-sm text-ink">
                  <span className="text-caution">!</span>
                  {h}
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-3 text-sm text-muted">등록된 위험요인이 없습니다. 작업 중 위험을 발견하면 신고해 주세요.</p>
          )}
          <label className="mt-4 flex items-start gap-2 text-sm text-ink">
            <input type="checkbox" checked={ack} onChange={(e) => setAck(e.target.checked)} className="mt-1 h-4 w-4 accent-[#15643E]" />
            위 위험요인을 확인했습니다.
          </label>
          <button disabled={!ack} onClick={() => setStep(2)} className={`${btn} mt-5 bg-safe text-white hover:bg-safe-hover`}>
            다음
          </button>
        </div>
      )}

      {step === 2 && (
        <div className="mt-5">
          <p className="text-sm font-semibold text-ink">점검 항목</p>
          <div className="mt-3 space-y-2">
            {allItems.map((label) => (
              <label key={label} className="flex items-start gap-3 rounded-lg border border-border bg-white px-3 py-3 text-sm text-ink">
                <input
                  type="checkbox"
                  checked={!!checks[label]}
                  onChange={(e) => setChecks((c) => ({ ...c, [label]: e.target.checked }))}
                  className="mt-0.5 h-5 w-5 accent-[#15643E]"
                />
                <span>{label}</span>
              </label>
            ))}
          </div>
          <button onClick={() => setStep(3)} className={`${btn} mt-5 bg-safe text-white hover:bg-safe-hover`}>
            다음
          </button>
        </div>
      )}

      {step === 3 && (
        <div className="mt-5">
          <p className="text-sm font-semibold text-ink">서명</p>
          <p className="mt-1 text-sm text-muted">이름을 입력해 점검을 확정합니다.</p>
          <input className={`${field} mt-3`} value={sign} onChange={(e) => setSign(e.target.value)} placeholder="이름" />
          {error && <p className="mt-2 text-sm text-danger">{error}</p>}
          <button disabled={busy || !sign.trim()} onClick={submit} className={`${btn} mt-5 bg-safe text-white hover:bg-safe-hover`}>
            {busy ? "기록 중…" : "점검 완료 및 증빙 기록"}
          </button>
        </div>
      )}
    </div>
  );
}

function ReportFlow({ session, back }: { session: Session; back: () => void }) {
  const [description, setDescription] = useState("");
  const [severity, setSeverity] = useState<"low" | "medium" | "high">("medium");
  const [location, setLocation] = useState("");
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit() {
    setBusy(true);
    setError(null);
    const res = await fetch("/api/worker/report", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        workspace_id: session.workspace_id,
        worker_id: session.worker_id,
        worker_name: session.worker_name,
        description,
        severity,
        location: location.trim() || undefined,
      }),
    });
    setBusy(false);
    const j = await res.json().catch(() => ({}));
    if (!res.ok) {
      setError(j.error || "신고 실패");
      return;
    }
    setDone(true);
  }

  if (done) return <Done title="위험 신고가 접수되었습니다" back={back} />;

  const sevOpts: { v: "low" | "medium" | "high"; label: string }[] = [
    { v: "low", label: "낮음" },
    { v: "medium", label: "보통" },
    { v: "high", label: "높음" },
  ];

  return (
    <div>
      <button onClick={back} className="mb-3 text-sm text-muted">← 홈</button>
      <h1 className="text-xl font-bold text-ink">위험 신고</h1>
      <p className="mt-1 text-sm text-muted">발견한 위험 상태를 알려주세요. 빠른 조치로 이어집니다.</p>
      <div className="mt-5 space-y-3">
        <textarea
          className={`${field} min-h-[120px]`}
          placeholder="무엇이 위험한가요? (예: 통로에 적재물이 쌓여 있음)"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />
        <input className={field} placeholder="위치 (선택, 예: 1공장 B라인)" value={location} onChange={(e) => setLocation(e.target.value)} />
        <div>
          <p className="mb-2 text-sm text-ink">위험 정도</p>
          <div className="grid grid-cols-3 gap-2">
            {sevOpts.map((o) => (
              <button
                key={o.v}
                onClick={() => setSeverity(o.v)}
                className={`rounded-lg border px-3 py-2.5 text-sm font-medium ${severity === o.v ? "border-safe bg-safe/10 text-safe" : "border-border bg-white text-muted"}`}
              >
                {o.label}
              </button>
            ))}
          </div>
        </div>
        {error && <p className="text-sm text-danger">{error}</p>}
        <button disabled={busy || !description.trim()} onClick={submit} className={`${btn} bg-safe text-white hover:bg-safe-hover`}>
          {busy ? "전송 중…" : "신고 보내기"}
        </button>
      </div>
    </div>
  );
}
