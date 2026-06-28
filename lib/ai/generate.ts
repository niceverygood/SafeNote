/**
 * LLM 호출 — 위험성평가 초안 생성. 구조화 JSON 강제, 근거 밖 산출 방어.
 * 반환 항목은 전부 is_draft=true. 위험도는 포함하지 않는다(사용자 매트릭스로 결정).
 */
import Anthropic from "@anthropic-ai/sdk";
import { z } from "zod";
import { RISK_GEN_SYSTEM, buildRiskGenUserPrompt, type GenInput } from "./prompts";

const DraftItem = z.object({
  hazard: z.string().min(1),
  measure: z.string().min(1),
  source_chunk_id: z.string().nullable(),
  needs_expert_review: z.boolean(),
});
const DraftResponse = z.object({ items: z.array(DraftItem) });

export interface GeneratedDraftItem {
  hazard: string;
  measure: string;
  source_chunk_id: string | null;
  source_label: string | null;
  needs_expert_review: boolean;
}

export async function generateRiskDraft(
  input: GenInput
): Promise<GeneratedDraftItem[]> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) throw new Error("ANTHROPIC_API_KEY가 설정되지 않았습니다.");

  // 근거가 전혀 없으면 LLM 호출 자체를 막는다 (환각 방지)
  if (input.chunks.length === 0) return [];

  const client = new Anthropic({ apiKey });
  const msg = await client.messages.create({
    model: process.env.ANTHROPIC_MODEL || "claude-opus-4-8",
    max_tokens: 2000,
    system: RISK_GEN_SYSTEM,
    messages: [{ role: "user", content: buildRiskGenUserPrompt(input) }],
  });

  const text = msg.content
    .filter((b): b is Anthropic.TextBlock => b.type === "text")
    .map((b) => b.text)
    .join("");

  const json = extractJson(text);
  const parsed = DraftResponse.safeParse(json);
  if (!parsed.success) return [];

  const validIds = new Set(input.chunks.map((c) => c.id));
  const labelById = new Map(input.chunks.map((c) => [c.id, `${c.source} — ${c.title}`]));

  // 근거 밖 인용 방어: 유효한 chunk_id가 아니면 출처 제거 + 전문가 검토 플래그
  return parsed.data.items.map((it) => {
    const validCite = it.source_chunk_id && validIds.has(it.source_chunk_id);
    return {
      hazard: it.hazard,
      measure: it.measure,
      source_chunk_id: validCite ? it.source_chunk_id : null,
      source_label: validCite ? labelById.get(it.source_chunk_id!) ?? null : null,
      needs_expert_review: it.needs_expert_review || !validCite,
    };
  });
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
