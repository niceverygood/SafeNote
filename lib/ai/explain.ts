/**
 * LLM 공백 설명 레이어 (모듈 A).
 * 역할 = rule이 도출한 공백을 사용자에게 1~2줄로 설명 + 다음 액션 제시뿐.
 * 점수/판정/리스크 산정 금지 (전부 rule이 계산). 법적 단정·"면책 보장" 류 금지.
 * API 키가 없거나 오류 시 {} 반환 — caller로 throw하지 않는다 (rule-only로 graceful fallback).
 */
import Anthropic from "@anthropic-ai/sdk";

export interface GapRow {
  code: string;
  title: string;
  /** rule이 도출한 상태 (partial | missing) */
  status: "partial" | "missing";
  required_evidence: string;
}

export interface GapExplanation {
  why: string;
  next: string;
}

const EXPLAIN_SYSTEM = `당신은 중대재해처벌법 안전보건관리체계 점검 결과를 사업주에게 설명하는 보조다.
규칙(rule) 엔진이 이미 각 의무의 이행 상태(공백/일부)를 판정했다. 당신의 역할은 그 공백을 사용자가 이해하도록 1~2줄로 설명하고 다음 액션 한 가지를 제시하는 것뿐이다.

엄격한 규칙:
- 점수·이행률·리스크 등급·이행 여부를 새로 계산하거나 판정하지 않는다 (이미 rule이 결정함).
- 법적 효력·처벌 여부·면책을 단정하지 않는다.
- "면책 보장", "처벌 면제 확정" 같은 표현을 절대 쓰지 않는다.
- 공포를 조장하지 않고, 정직하되 비관하지 않는 차분한 톤을 쓴다.
- 이모지를 쓰지 않는다.
- 각 항목 why는 1~2줄, next는 한 문장의 실행 가능한 다음 액션으로 한국어로 간결하게 작성한다.

출력은 반드시 지정된 JSON 형식만 반환한다.`;

function buildUserPrompt(rows: GapRow[]): string {
  const list = rows
    .map(
      (r) =>
        `- code: ${r.code}\n  의무: ${r.title}\n  상태: ${
          r.status === "partial" ? "일부 공백" : "공백(미확인)"
        }\n  필요 증빙: ${r.required_evidence}`
    )
    .join("\n");

  return `다음은 rule 엔진이 공백으로 판정한 의무 목록이다. 각 code에 대해 why(왜 비었는지 1~2줄)와 next(다음 액션 한 문장)를 작성하라.

${list}

다음 JSON 스키마로만 응답하라:
{
  "items": [
    { "code": "위 code 그대로", "why": "공백 설명 1~2줄", "next": "다음 액션 한 문장" }
  ]
}`;
}

function extractJson(text: string): unknown {
  const fence = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  const raw = fence ? fence[1] : text;
  const start = raw.indexOf("{");
  const end = raw.lastIndexOf("}");
  if (start === -1 || end === -1) return null;
  try {
    return JSON.parse(raw.slice(start, end + 1));
  } catch {
    return null;
  }
}

/**
 * rule이 도출한 공백 행들에 대해 LLM 설명/다음액션을 부여한다.
 * 반환: code → {why, next}. 키 없으면 caller가 rule 기본 문구로 대체.
 * 절대 throw하지 않는다.
 */
export async function explainGaps(
  rows: GapRow[]
): Promise<Record<string, GapExplanation>> {
  try {
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) return {};
    if (rows.length === 0) return {};

    const client = new Anthropic({ apiKey });
    const msg = await client.messages.create({
      model: process.env.ANTHROPIC_MODEL || "claude-opus-4-8",
      max_tokens: 1500,
      system: EXPLAIN_SYSTEM,
      messages: [{ role: "user", content: buildUserPrompt(rows) }],
    });

    const text = msg.content
      .filter((b): b is Anthropic.TextBlock => b.type === "text")
      .map((b) => b.text)
      .join("");

    const json = extractJson(text);
    if (!json || typeof json !== "object") return {};

    const items = (json as { items?: unknown }).items;
    if (!Array.isArray(items)) return {};

    const validCodes = new Set(rows.map((r) => r.code));
    const out: Record<string, GapExplanation> = {};
    for (const it of items) {
      if (!it || typeof it !== "object") continue;
      const code = (it as { code?: unknown }).code;
      const why = (it as { why?: unknown }).why;
      const next = (it as { next?: unknown }).next;
      if (
        typeof code === "string" &&
        validCodes.has(code) &&
        typeof why === "string" &&
        typeof next === "string"
      ) {
        out[code] = { why: why.trim(), next: next.trim() };
      }
    }
    return out;
  } catch {
    return {};
  }
}
