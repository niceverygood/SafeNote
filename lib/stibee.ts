/**
 * 스티비(stibee) 자동 구독 등록.
 * 리드/구독 문의 캡처 시 너처링 리스트에 자동 추가.
 * STIBEE_API_KEY / STIBEE_LIST_ID 미설정 시 조용히 건너뜀(서비스 흐름 차단 금지).
 * 어떤 경우에도 throw하지 않는다 — 메인 응답에 영향 없게.
 */
export interface StibeeSubscriber {
  email: string;
  name?: string;
  phone?: string;
  /** 커스텀 필드(스티비 주소록 필드명과 일치해야 반영됨) */
  fields?: Record<string, string | number | null>;
}

export async function addStibeeSubscriber(sub: StibeeSubscriber): Promise<boolean> {
  const apiKey = process.env.STIBEE_API_KEY;
  const listId = process.env.STIBEE_LIST_ID;
  if (!apiKey || !listId) return false; // 미설정 → 스킵

  try {
    const controller = new AbortController();
    const t = setTimeout(() => controller.abort(), 4000);
    const res = await fetch(`https://api.stibee.com/v1/lists/${listId}/subscribers`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        AccessToken: apiKey,
      },
      body: JSON.stringify({
        eventOccuredBy: "MANUAL",
        confirmEmailYN: "N",
        subscribers: [
          {
            email: sub.email,
            ...(sub.name ? { name: sub.name } : {}),
            ...(sub.phone ? { phone: sub.phone } : {}),
            ...(sub.fields ?? {}),
          },
        ],
      }),
      signal: controller.signal,
    });
    clearTimeout(t);
    return res.ok;
  } catch {
    return false; // 네트워크/타임아웃 등 무시
  }
}
