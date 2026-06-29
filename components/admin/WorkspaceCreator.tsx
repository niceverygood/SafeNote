"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

// 업종 옵션 (data/seed/industries.json 기준 하드코딩)
const INDUSTRIES: { code: string; name: string }[] = [
  { code: "manufacturing", name: "제조업" },
  { code: "construction", name: "건설업" },
  { code: "logistics", name: "운수·창고·물류업" },
  { code: "wholesale_retail", name: "도·소매업" },
  { code: "food_service", name: "음식·숙박업" },
  { code: "waste", name: "폐기물 수집·처리·재활용업" },
  { code: "facility_mgmt", name: "시설관리·청소·경비업" },
  { code: "auto_repair", name: "자동차 정비·수리업" },
  { code: "etc", name: "기타" },
];

const inputCls =
  "w-full rounded-md border border-border bg-white px-3 py-2 text-sm text-ink outline-none focus:ring-2 focus:ring-safe focus:border-safe";

export function WorkspaceCreator() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [industryCode, setIndustryCode] = useState(INDUSTRIES[0].code);
  const [sizeBand, setSizeBand] = useState<"1-9" | "10-49">("1-9");
  const [workerCount, setWorkerCount] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [okCode, setOkCode] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setOkCode(null);

    const count = Number(workerCount);
    if (!name.trim()) {
      setError("사업장 이름을 입력해 주세요.");
      return;
    }
    if (!Number.isFinite(count) || count < 0) {
      setError("상시근로자 수를 올바르게 입력해 주세요.");
      return;
    }

    setBusy(true);
    try {
      const res = await fetch("/api/admin/workspaces", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          industry_code: industryCode,
          size_band: sizeBand,
          worker_count: count,
        }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(json?.error ?? "생성에 실패했습니다.");
        return;
      }
      setOkCode(json?.join_code ?? null);
      setName("");
      setWorkerCount("");
      router.refresh();
    } catch {
      setError("네트워크 오류가 발생했습니다.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form
      onSubmit={submit}
      className="rounded-lg border border-border bg-white p-4 sm:p-5"
    >
      <h2 className="text-sm font-semibold text-ink">사업장 추가</h2>
      <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <label className="block">
          <span className="mb-1 block text-xs text-muted">사업장 이름</span>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="예) OO건설 1현장"
            className={inputCls}
            required
          />
        </label>

        <label className="block">
          <span className="mb-1 block text-xs text-muted">업종</span>
          <select
            value={industryCode}
            onChange={(e) => setIndustryCode(e.target.value)}
            className={inputCls}
          >
            {INDUSTRIES.map((i) => (
              <option key={i.code} value={i.code}>
                {i.name}
              </option>
            ))}
          </select>
        </label>

        <label className="block">
          <span className="mb-1 block text-xs text-muted">규모</span>
          <select
            value={sizeBand}
            onChange={(e) => setSizeBand(e.target.value as "1-9" | "10-49")}
            className={inputCls}
          >
            <option value="1-9">상시근로자 5~9명</option>
            <option value="10-49">상시근로자 10~49명</option>
          </select>
        </label>

        <label className="block">
          <span className="mb-1 block text-xs text-muted">상시근로자 수</span>
          <input
            type="number"
            min={0}
            inputMode="numeric"
            value={workerCount}
            onChange={(e) => setWorkerCount(e.target.value)}
            placeholder="예) 8"
            className={inputCls}
            required
          />
        </label>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-3">
        <button
          type="submit"
          disabled={busy}
          className="rounded-md bg-safe px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-safe-hover focus:outline-none focus:ring-2 focus:ring-safe focus:ring-offset-2 disabled:opacity-60"
        >
          {busy ? "생성 중…" : "사업장 생성"}
        </button>
        {error && <span className="text-sm text-danger">{error}</span>}
        {okCode && (
          <span className="text-sm text-ink">
            생성 완료 · 참여코드{" "}
            <span className="num font-bold tracking-wider text-safe">{okCode}</span>
          </span>
        )}
      </div>
    </form>
  );
}
