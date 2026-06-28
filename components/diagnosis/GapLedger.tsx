"use client";

/**
 * 상태 대장 (검사 시트의 디지털판). 카드 그리드 아님 — TABLE/LEDGER.
 * 각 행: [상태 칩 · 무엇이 비었나(missing) · 다음 액션].
 * 잠금 상태(locked)에서는 공백 행의 상세(무엇이 비었나/다음 액션)를 가린다 — 리드 캡처 후 해제.
 */
import { StatusChip } from "@/components/ds/StatusChip";
import type { ComplianceStatus } from "@/lib/status";

export interface LedgerRow {
  code: string;
  title: string;
  status: ComplianceStatus;
  applicable: boolean;
  missing: string;
  required_evidence: string;
  why: string | null;
  next: string | null;
}

function MissingCell({ row }: { row: LedgerRow }) {
  if (row.status === "fulfilled") {
    return <span className="text-sm text-muted">핵심 증빙이 확인되었습니다.</span>;
  }
  // LLM 설명(why)이 있으면 우선, 없으면 rule 기본 문구(missing)
  return <span className="text-sm text-ink">{row.why ?? row.missing}</span>;
}

function NextActionCell({ row }: { row: LedgerRow }) {
  if (row.status === "fulfilled") {
    return <span className="text-sm text-muted">유지·갱신만 관리하세요.</span>;
  }
  if (row.next) return <span className="text-sm text-ink">{row.next}</span>;
  return (
    <span className="text-sm text-ink">
      필요 증빙을 갖추세요: {row.required_evidence}
    </span>
  );
}

export function GapLedger({
  rows,
  locked,
}: {
  rows: LedgerRow[];
  locked: boolean;
}) {
  // 적용되는 의무만 대장에 표기 (비적용은 갭이 아니므로 제외)
  const applicable = rows.filter((r) => r.applicable);

  return (
    <div className="overflow-hidden rounded-md border border-border bg-white">
      {/* 데스크톱: 테이블 */}
      <table className="hidden w-full border-collapse text-left sm:table">
        <thead>
          <tr className="border-b border-border bg-surface">
            <th
              scope="col"
              className="px-4 py-2.5 text-xs font-semibold text-muted"
            >
              상태
            </th>
            <th
              scope="col"
              className="px-4 py-2.5 text-xs font-semibold text-muted"
            >
              의무 / 무엇이 비었나
            </th>
            <th
              scope="col"
              className="px-4 py-2.5 text-xs font-semibold text-muted"
            >
              다음 액션
            </th>
          </tr>
        </thead>
        <tbody>
          {applicable.map((row) => {
            const hideDetail = locked && row.status !== "fulfilled";
            return (
              <tr
                key={row.code}
                className="border-b border-border last:border-b-0 align-top"
              >
                <td className="whitespace-nowrap px-4 py-3">
                  <StatusChip status={row.status} />
                  <span className="num mt-1.5 block text-[11px] text-muted">
                    {row.code}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <span className="block text-sm font-medium text-ink">
                    {row.title}
                  </span>
                  <span className="mt-1 block">
                    {hideDetail ? (
                      <LockedHint />
                    ) : (
                      <MissingCell row={row} />
                    )}
                  </span>
                </td>
                <td className="px-4 py-3">
                  {hideDetail ? <LockedHint /> : <NextActionCell row={row} />}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>

      {/* 모바일: 스택형 행 (여전히 대장 구조) */}
      <ul className="divide-y divide-border sm:hidden">
        {applicable.map((row) => {
          const hideDetail = locked && row.status !== "fulfilled";
          return (
            <li key={row.code} className="px-4 py-3.5">
              <div className="flex items-center justify-between gap-2">
                <StatusChip status={row.status} />
                <span className="num text-[11px] text-muted">{row.code}</span>
              </div>
              <p className="mt-2 text-sm font-medium text-ink">{row.title}</p>
              <dl className="mt-2 space-y-1.5">
                <div>
                  <dt className="text-[11px] font-semibold text-muted">
                    무엇이 비었나
                  </dt>
                  <dd className="mt-0.5">
                    {hideDetail ? <LockedHint /> : <MissingCell row={row} />}
                  </dd>
                </div>
                <div>
                  <dt className="text-[11px] font-semibold text-muted">
                    다음 액션
                  </dt>
                  <dd className="mt-0.5">
                    {hideDetail ? <LockedHint /> : <NextActionCell row={row} />}
                  </dd>
                </div>
              </dl>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

function LockedHint() {
  return (
    <span className="inline-flex items-center gap-1.5 text-sm text-muted">
      <svg viewBox="0 0 16 16" className="h-3.5 w-3.5" fill="none" aria-hidden>
        <rect
          x="3"
          y="7"
          width="10"
          height="6.5"
          rx="1.2"
          stroke="currentColor"
          strokeWidth="1.4"
        />
        <path
          d="M5.5 7V5.2a2.5 2.5 0 0 1 5 0V7"
          stroke="currentColor"
          strokeWidth="1.4"
        />
      </svg>
      이메일 입력 후 공개
    </span>
  );
}
