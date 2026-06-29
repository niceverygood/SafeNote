"use client";

/**
 * 노동자용 앱 (모바일 우선, 무가입).
 * 참여코드 입장 → 작업 전·중·후 점검 + 위험 신고. 제출 시 불변 로그(해시)로 기록.
 * 홈에서 오늘 전/중/후 완료 현황과 시각을 한눈에 확인.
 */
import { useCallback, useEffect, useState } from "react";
import { STAGES, stageOf, kstTime, type StageKey } from "@/lib/stages";

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
}
type TodayStatus = Record<StageKey, { done: boolean; at: string | null; process: string | null }>;

const KEY = "safenote_worker";
const btn = "w-full rounded-lg px-4 py-3.5 text-base font-semibold transition-colors disabled:opacity-60";
const field = "w-full rounded-lg border border-border bg-white px-4 py-3 text-base text-ink outline-none focus-visible:ring-2 focus-visible:ring-safe";

type View = { v: "home" } | { v: "stage"; kind: StageKey } | { v: "report" } | { v: "history" };

export default function WorkerApp() {
  const [session, setSession] = useState<Session | null>(null);
  const [view, setView] = useState<View>({ v: "home" });

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
              setView({ v: "home" });
            }}
            className="text-xs text-muted hover:text-ink"
          >
            나가기
          </button>
        )}
      </div>

      {!session ? (
        <JoinView onJoined={(s) => save(s)} />
      ) : view.v === "home" ? (
        <HomeView session={session} go={setView} />
      ) : view.v === "stage" ? (
        <StageFlow session={session} kind={view.kind} back={() => setView({ v: "home" })} />
      ) : view.v === "history" ? (
        <HistoryView session={session} back={() => setView({ v: "home" })} />
      ) : (
        <ReportFlow session={session} back={() => setView({ v: "home" })} />
      )}

      <p className="mt-10 text-center text-xs leading-relaxed text-muted">
        본 자료는 법률자문을 대체하지 않습니다.
      </p>
    </main>
  );
}

function JoinView({ onJoined }: { onJoined: (s: Session) => void }) {
  const [mode, setMode] = useState<"login" | "register">("login");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [code, setCode] = useState("");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // QR 스캔(?code=)이면 참여코드 등록 모드로 전환 + 자동 입력
  useEffect(() => {
    try {
      const c = new URLSearchParams(window.location.search).get("code");
      if (c) {
        setCode(c.toUpperCase());
        setMode("register");
      }
    } catch {
      /* ignore */
    }
  }, []);

  async function login(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const res = await fetch("/api/worker/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username: username.trim(), password }),
    });
    setBusy(false);
    const j = await res.json().catch(() => ({}));
    if (!res.ok) {
      setError(j.error || "로그인에 실패했습니다.");
      return;
    }
    onJoined(j as Session);
  }

  async function register(e: React.FormEvent) {
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
      setError(j.error || "등록에 실패했습니다.");
      return;
    }
    onJoined(j as Session);
  }

  if (mode === "login") {
    return (
      <div>
        <h1 className="text-xl font-bold text-ink">근로자 로그인</h1>
        <p className="mt-1 text-sm text-muted">발급받은 아이디와 비밀번호로 로그인하세요.</p>
        <form onSubmit={login} className="mt-6 space-y-3">
          <input className={field} placeholder="아이디" value={username} onChange={(e) => setUsername(e.target.value)} autoCapitalize="none" required />
          <input className={field} type="password" placeholder="비밀번호" value={password} onChange={(e) => setPassword(e.target.value)} required />
          {error && <p className="text-sm text-danger">{error}</p>}
          <button type="submit" disabled={busy} className={`${btn} bg-safe text-white hover:bg-safe-hover`}>
            {busy ? "로그인 중…" : "로그인"}
          </button>
          <button type="button" onClick={() => { setMode("register"); setError(null); }} className="w-full text-center text-xs text-muted hover:text-ink">
            처음이신가요? 참여코드로 등록
          </button>
        </form>
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-xl font-bold text-ink">참여코드로 등록</h1>
      <p className="mt-1 text-sm text-muted">사업장에서 받은 참여코드로 현장에 등록합니다.</p>
      <form onSubmit={register} className="mt-6 space-y-3">
        <input
          className={`${field} text-center text-lg font-semibold uppercase tracking-[0.3em]`}
          placeholder="참여코드"
          value={code}
          onChange={(e) => setCode(e.target.value)}
          maxLength={12}
          autoCapitalize="characters"
          required
        />
        <input className={field} placeholder="이름" value={name} onChange={(e) => setName(e.target.value)} required />
        <input className={field} placeholder="연락처 (선택)" value={phone} onChange={(e) => setPhone(e.target.value)} inputMode="tel" />
        {error && <p className="text-sm text-danger">{error}</p>}
        <button type="submit" disabled={busy} className={`${btn} bg-safe text-white hover:bg-safe-hover`}>
          {busy ? "등록 중…" : "등록하고 시작"}
        </button>
        <button type="button" onClick={() => { setMode("login"); setError(null); }} className="w-full text-center text-xs text-muted hover:text-ink">
          아이디·비밀번호로 로그인
        </button>
      </form>
    </div>
  );
}

function HomeView({ session, go }: { session: Session; go: (v: View) => void }) {
  const [status, setStatus] = useState<TodayStatus | null>(null);

  useEffect(() => {
    fetch(`/api/worker/today?workspace_id=${session.workspace_id}&worker_id=${session.worker_id}`)
      .then((r) => r.json())
      .then((d) => setStatus(d.status))
      .catch(() => setStatus(null));
  }, [session]);

  const doneCount = status ? STAGES.filter((s) => status[s.key]?.done).length : 0;

  return (
    <div>
      <p className="text-sm text-muted">{session.workspace_name}</p>
      <h1 className="mt-1 text-2xl font-bold text-ink">{session.worker_name}님,<br />오늘도 안전하게.</h1>
      <p className="mt-2 text-sm leading-relaxed text-muted">
        작업 전·중·후 점검은 나를 보호하는 기록이자, 사업장의 안전 증빙으로 남습니다.
      </p>

      <div className="mt-4 flex items-center gap-2 text-sm">
        <span className="text-muted">오늘 점검</span>
        <span className="num font-semibold text-ink">{doneCount}/3</span>
        <span className="text-muted">완료</span>
      </div>

      <div className="mt-3 space-y-3">
        {STAGES.map((stage) => {
          const st = status?.[stage.key];
          const done = !!st?.done;
          return (
            <button
              key={stage.key}
              onClick={() => go({ v: "stage", kind: stage.key })}
              className={`flex w-full items-center justify-between rounded-lg border px-4 py-4 text-left transition-colors ${
                done ? "border-safe/40 bg-safe/5" : "border-border bg-white hover:border-safe/40"
              }`}
            >
              <span>
                <span className="flex items-center gap-2 text-base font-semibold text-ink">
                  <span
                    className={`inline-flex h-5 w-5 items-center justify-center rounded-full text-xs ${
                      done ? "bg-safe text-white" : "border border-border text-muted"
                    }`}
                  >
                    {done ? "✓" : ""}
                  </span>
                  {stage.label}
                </span>
                <span className="mt-0.5 block pl-7 text-sm text-muted">
                  {done && st?.at ? `${kstTime(st.at)} 완료` : "미완료 — 지금 점검하기"}
                </span>
              </span>
              <span className="text-muted">›</span>
            </button>
          );
        })}
      </div>

      <button
        onClick={() => go({ v: "report" })}
        className={`${btn} mt-4 border border-caution/50 bg-caution/10 text-left text-caution hover:bg-caution/20`}
      >
        위험 신고
        <span className="mt-0.5 block text-sm font-normal text-caution/80">위험한 상태를 발견하면 바로 알리세요</span>
      </button>

      <button
        onClick={() => go({ v: "history" })}
        className="mt-3 w-full rounded-lg border border-border bg-white px-4 py-3 text-left text-sm font-medium text-ink hover:bg-surface"
      >
        내 점검·신고 기록 보기 ›
      </button>
    </div>
  );
}

function HistoryView({ session, back }: { session: Session; back: () => void }) {
  const [data, setData] = useState<{
    checks: { id: string; kind: string; process: string; items: { checked: boolean }[]; created_at: string }[];
    reports: { id: string; description: string; severity: string; status: string; created_at: string }[];
  } | null>(null);

  useEffect(() => {
    fetch(`/api/worker/history?workspace_id=${session.workspace_id}&worker_id=${session.worker_id}`)
      .then((r) => r.json())
      .then(setData)
      .catch(() => setData({ checks: [], reports: [] }));
  }, [session]);

  return (
    <div>
      <button onClick={back} className="mb-3 text-sm text-muted">← 홈</button>
      <h1 className="text-xl font-bold text-ink">내 기록</h1>
      <p className="mt-1 text-sm text-muted">최근 점검과 위험 신고 내역입니다.</p>

      <h2 className="mt-5 mb-2 text-sm font-semibold text-ink">점검</h2>
      <div className="space-y-2">
        {(data?.checks ?? []).map((c) => {
          const st = stageOf(c.kind);
          const items = Array.isArray(c.items) ? c.items : [];
          return (
            <div key={c.id} className="rounded-lg border border-border bg-white px-3 py-2.5 text-sm">
              <div className="flex justify-between">
                <span className="font-medium text-ink">{st?.short ?? c.kind} · {c.process}</span>
                <span className="num text-xs text-muted">{kstTime(c.created_at)}</span>
              </div>
              <span className="num text-xs text-muted">체크 {items.filter((i) => i.checked).length}/{items.length}</span>
            </div>
          );
        })}
        {data && data.checks.length === 0 && <p className="text-sm text-muted">점검 기록이 없습니다.</p>}
      </div>

      <h2 className="mt-6 mb-2 text-sm font-semibold text-ink">위험 신고</h2>
      <div className="space-y-2">
        {(data?.reports ?? []).map((r) => (
          <div key={r.id} className="rounded-lg border border-border bg-white px-3 py-2.5 text-sm">
            <div className="flex justify-between">
              <span className="text-ink">{r.description}</span>
              <span className="num text-xs text-muted">{kstTime(r.created_at)}</span>
            </div>
            <span className={`text-xs ${r.status === "resolved" ? "text-safe" : "text-caution"}`}>
              {r.status === "resolved" ? "조치완료" : "접수됨"}
            </span>
          </div>
        ))}
        {data && data.reports.length === 0 && <p className="text-sm text-muted">신고 기록이 없습니다.</p>}
      </div>
    </div>
  );
}

function Done({ title, hash, back }: { title: string; hash?: string; back: () => void }) {
  return (
    <div className="rounded-lg border border-safe/30 bg-safe/10 p-6 text-center">
      <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-safe text-white">✓</div>
      <h2 className="mt-3 text-lg font-bold text-ink">{title}</h2>
      <p className="mt-1 text-sm text-muted">타임스탬프와 함께 위변조 방지 기록으로 저장되었습니다.</p>
      {hash && <p className="mt-2 num text-xs text-muted">증빙 해시 {hash.slice(0, 12)}…</p>}
      <button onClick={back} className={`${btn} mt-5 border border-border bg-white text-ink hover:bg-surface`}>
        홈으로
      </button>
    </div>
  );
}

function StageFlow({ session, kind, back }: { session: Session; kind: StageKey; back: () => void }) {
  const stage = stageOf(kind)!;
  const isPre = kind === "pre";
  const [procs, setProcs] = useState<Proc[]>([]);
  const [step, setStep] = useState<"process" | "hazard" | "items" | "sign">(isPre ? "process" : "items");
  const [process, setProcess] = useState("");
  const [customProcess, setCustomProcess] = useState("");
  const [ack, setAck] = useState(false);
  const [checks, setChecks] = useState<Record<string, boolean>>({});
  const [sign, setSign] = useState(session.worker_name);
  const [busy, setBusy] = useState(false);
  const [doneHash, setDoneHash] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isPre) {
      // 작업 중/후: 오늘 작업 전에서 고른 공정을 기본값으로
      fetch(`/api/worker/today?workspace_id=${session.workspace_id}&worker_id=${session.worker_id}`)
        .then((r) => r.json())
        .then((d) => setProcess(d.status?.pre?.process || "작업"))
        .catch(() => setProcess("작업"));
      return;
    }
    fetch(`/api/worker/context?workspace_id=${session.workspace_id}`)
      .then((r) => r.json())
      .then((d) => setProcs(d.processes ?? []))
      .catch(() => setProcs([]));
  }, [session, isPre]);

  const selected = procs.find((p) => p.process === process);
  const procName = process === "__custom__" ? customProcess : process || "작업";
  const hazards = selected?.hazards ?? [];

  async function submit() {
    setBusy(true);
    setError(null);
    const items = stage.items.map((label) => ({ label, checked: !!checks[label] }));
    const res = await fetch("/api/worker/check", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        workspace_id: session.workspace_id,
        worker_id: session.worker_id,
        worker_name: session.worker_name,
        kind,
        process: procName,
        hazards: isPre ? hazards : [],
        items,
        acknowledged: isPre ? ack : true,
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

  if (doneHash !== null) return <Done title={`${stage.label} 완료`} hash={doneHash} back={back} />;

  return (
    <div>
      <button onClick={back} className="mb-3 text-sm text-muted">← 홈</button>
      <h1 className="text-xl font-bold text-ink">{stage.label}</h1>
      <p className="mt-1 text-sm text-muted">{stage.desc}</p>

      {step === "process" && (
        <div className="mt-5 space-y-3">
          <p className="text-sm text-muted">오늘 어떤 작업을 하시나요?</p>
          {procs.map((p) => (
            <button
              key={p.process}
              onClick={() => {
                setProcess(p.process);
                setStep("hazard");
              }}
              className={`${btn} border bg-white text-left text-ink ${process === p.process ? "border-safe" : "border-border"}`}
            >
              {p.process}
            </button>
          ))}
          <div className="rounded-lg border border-border bg-white p-3">
            <input className={field} placeholder="직접 입력 (예: 자재 운반)" value={customProcess} onChange={(e) => setCustomProcess(e.target.value)} />
            <button
              disabled={!customProcess.trim()}
              onClick={() => {
                setProcess("__custom__");
                setStep("hazard");
              }}
              className={`${btn} mt-2 bg-safe text-white hover:bg-safe-hover`}
            >
              이 작업으로 시작
            </button>
          </div>
        </div>
      )}

      {step === "hazard" && (
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
          <button disabled={!ack} onClick={() => setStep("items")} className={`${btn} mt-5 bg-safe text-white hover:bg-safe-hover`}>
            다음
          </button>
        </div>
      )}

      {step === "items" && (
        <div className="mt-5">
          <p className="text-sm font-semibold text-ink">점검 항목</p>
          <div className="mt-3 space-y-2">
            {stage.items.map((label) => (
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
          <button onClick={() => setStep("sign")} className={`${btn} mt-5 bg-safe text-white hover:bg-safe-hover`}>
            다음
          </button>
        </div>
      )}

      {step === "sign" && (
        <div className="mt-5">
          <p className="text-sm font-semibold text-ink">서명</p>
          <p className="mt-1 text-sm text-muted">이름을 입력해 {stage.short} 점검을 확정합니다.</p>
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
  const [photo, setPhoto] = useState<string | null>(null);
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [geoBusy, setGeoBusy] = useState(false);
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function onPhoto(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 6 * 1024 * 1024) {
      setError("사진은 6MB 이하만 가능합니다.");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => setPhoto(reader.result as string);
    reader.readAsDataURL(file);
  }

  function attachLocation() {
    if (!navigator.geolocation) return;
    setGeoBusy(true);
    navigator.geolocation.getCurrentPosition(
      (p) => {
        setCoords({ lat: p.coords.latitude, lng: p.coords.longitude });
        setGeoBusy(false);
      },
      () => setGeoBusy(false),
      { enableHighAccuracy: true, timeout: 8000 }
    );
  }

  async function submit() {
    setBusy(true);
    setError(null);
    let photoUrl: string | undefined;
    if (photo) {
      const up = await fetch("/api/worker/upload", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ workspace_id: session.workspace_id, data: photo }),
      });
      const uj = await up.json().catch(() => ({}));
      if (up.ok) photoUrl = uj.url;
    }
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
        photo_url: photoUrl,
        lat: coords?.lat,
        lng: coords?.lng,
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
        <div className="grid grid-cols-2 gap-2">
          <label className="flex cursor-pointer items-center justify-center rounded-lg border border-border bg-white px-3 py-2.5 text-sm text-ink hover:bg-surface">
            {photo ? "사진 변경" : "사진 첨부"}
            <input type="file" accept="image/*" capture="environment" className="hidden" onChange={onPhoto} />
          </label>
          <button
            type="button"
            onClick={attachLocation}
            className={`rounded-lg border px-3 py-2.5 text-sm ${coords ? "border-safe bg-safe/10 text-safe" : "border-border bg-white text-ink hover:bg-surface"}`}
          >
            {geoBusy ? "위치 확인 중…" : coords ? "위치 첨부됨" : "현재 위치 첨부"}
          </button>
        </div>
        {photo && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={photo} alt="첨부 사진 미리보기" className="max-h-40 w-full rounded-lg border border-border object-cover" />
        )}
        {error && <p className="text-sm text-danger">{error}</p>}
        <button disabled={busy || !description.trim()} onClick={submit} className={`${btn} bg-safe text-white hover:bg-safe-hover`}>
          {busy ? "전송 중…" : "신고 보내기"}
        </button>
      </div>
    </div>
  );
}
