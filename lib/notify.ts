import { createHmac, randomBytes } from "node:crypto";

/**
 * SMS 알림 (Solapi). 위험 신고(특히 높음) 발생 시 관리자에게 실시간 고지.
 * SOLAPI_API_KEY / SOLAPI_API_SECRET / SOLAPI_SENDER 미설정 시 조용히 스킵.
 * 어떤 경우에도 throw하지 않는다.
 */
export async function sendSms(to: string | null | undefined, text: string): Promise<boolean> {
  const key = process.env.SOLAPI_API_KEY;
  const secret = process.env.SOLAPI_API_SECRET;
  const from = process.env.SOLAPI_SENDER;
  if (!key || !secret || !from || !to) return false;

  try {
    const date = new Date().toISOString();
    const salt = randomBytes(16).toString("hex");
    const signature = createHmac("sha256", secret).update(date + salt).digest("hex");
    const auth = `HMAC-SHA256 apiKey=${key}, date=${date}, salt=${salt}, signature=${signature}`;

    const controller = new AbortController();
    const t = setTimeout(() => controller.abort(), 5000);
    const res = await fetch("https://api.solapi.com/messages/v4/send", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: auth },
      body: JSON.stringify({
        message: { to: to.replace(/[^0-9]/g, ""), from: from.replace(/[^0-9]/g, ""), text },
      }),
      signal: controller.signal,
    });
    clearTimeout(t);
    return res.ok;
  } catch {
    return false;
  }
}
