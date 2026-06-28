/**
 * LLM 프롬프트. 역할 = 해석·초안·문장화뿐. 근거(RAG chunk) 밖 생성 금지.
 * 위험도 임의 산정 금지. 법적 효력·면책 단정 금지. 불확실 시 needs_expert_review:true.
 */

export const RISK_GEN_SYSTEM = `당신은 산업안전 문서 작성 보조다. 제공된 근거(KOSHA 가이드/시행령)의 범위 내에서만 유해·위험요인과 감소대책 초안을 작성한다.

엄격한 규칙:
- 근거 밖 창작 금지. 제공된 근거에 없는 위험요인·대책은 만들지 않는다.
- 위험도(빈도·강도·등급) 임의 산정 금지. 위험도는 사용자가 매트릭스로 결정하므로 출력에 포함하지 않는다.
- 법적 효력·면책 단정 금지.
- 각 항목은 반드시 근거가 된 source_chunk_id를 인용한다.
- 근거가 빈약하거나 불확실하면 needs_expert_review를 true로 둔다.
- 한국어로 간결하게 작성한다.

출력은 반드시 지정된 JSON 형식만 반환한다.`;

export interface GenInput {
  industry_name: string;
  process: string;
  seedHazards: { hazard: string; default_measures: string[] }[];
  chunks: { id: string; title: string; source: string; content: string }[];
}

export function buildRiskGenUserPrompt(input: GenInput): string {
  const seeds = input.seedHazards
    .map(
      (s, i) =>
        `${i + 1}. ${s.hazard} (표준 대책 후보: ${s.default_measures.join(", ")})`
    )
    .join("\n");

  const chunks = input.chunks
    .map(
      (c) =>
        `[chunk_id: ${c.id}] (${c.source} — ${c.title})\n${c.content}`
    )
    .join("\n\n");

  return `업종: ${input.industry_name}
공정/작업: ${input.process}

[rule 후보 유해위험요인 (hazard_seeds)]
${seeds || "(해당 업종/공정 표준 후보 없음)"}

[근거 코퍼스 (이 범위 안에서만 작성)]
${chunks || "(검색된 근거 없음)"}

위 근거 범위 내에서 이 공정의 유해·위험요인과 감소대책 초안을 작성하라.
각 항목에 근거 chunk_id를 인용하고, 근거가 불확실하면 needs_expert_review를 true로 설정하라.
근거가 전혀 없으면 빈 items 배열을 반환하라.

다음 JSON 스키마로만 응답하라:
{
  "items": [
    {
      "hazard": "유해위험요인 (한 줄)",
      "measure": "감소대책 (한 줄)",
      "source_chunk_id": "인용한 chunk_id 또는 null",
      "needs_expert_review": false
    }
  ]
}`;
}
