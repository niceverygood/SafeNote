/**
 * 작업 전·중·후 점검 단계. 작업자 앱·관리자 대시보드 공통.
 * 항목은 중대재해처벌법/산업안전보건법상 작업 절차를 일반화한 표준 체크리스트(법률자문 아님).
 */
export type StageKey = "pre" | "during" | "post";

export interface Stage {
  key: StageKey;
  label: string;
  short: string;
  desc: string;
  items: string[];
}

export const STAGES: Stage[] = [
  {
    key: "pre",
    label: "작업 전 점검",
    short: "작업 전",
    desc: "작업 시작 전 위험을 확인하고 대비합니다.",
    items: [
      "오늘 작업 내용과 유해·위험요인을 확인했다 (TBM)",
      "보호구(안전모·안전화 등)를 착용했다",
      "작업 구역·설비 상태를 점검했다",
      "작업 절차·작업허가를 확인했다",
    ],
  },
  {
    key: "during",
    label: "작업 중 점검",
    short: "작업 중",
    desc: "작업 진행 중 안전 상태를 점검합니다.",
    items: [
      "정해진 작업 절차와 안전수칙을 지키고 있다",
      "보호구를 계속 착용하고 있다",
      "이상·위험 발견 시 작업을 멈추고 보고한다",
      "주변 작업자와 위험 정보를 공유했다",
    ],
  },
  {
    key: "post",
    label: "작업 후 점검",
    short: "작업 후",
    desc: "작업 종료 시 마무리와 이상 유무를 확인합니다.",
    items: [
      "작업 구역을 정리정돈했다",
      "설비 전원 차단·잠금(해당 시)을 했다",
      "이상 유무를 확인하고 기록했다",
      "작업 종료 상태를 보고했다",
    ],
  },
];

export const STAGE_KEYS: StageKey[] = ["pre", "during", "post"];

export function stageOf(key: string): Stage | undefined {
  return STAGES.find((s) => s.key === key);
}

/** KST(Asia/Seoul) 오늘 0시의 UTC ISO 문자열 */
export function kstTodayStartISO(now: Date = new Date()): string {
  const kst = new Date(now.getTime() + 9 * 3600 * 1000);
  const midnightUtcMs =
    Date.UTC(kst.getUTCFullYear(), kst.getUTCMonth(), kst.getUTCDate()) - 9 * 3600 * 1000;
  return new Date(midnightUtcMs).toISOString();
}

/** ISO → KST "HH:MM" */
export function kstTime(iso: string): string {
  return new Date(iso).toLocaleTimeString("ko-KR", {
    timeZone: "Asia/Seoul",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
}
