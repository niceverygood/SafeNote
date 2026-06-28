/**
 * Voyage AI 임베딩 (Anthropic 권장). REST 직접 호출.
 * 문서 인덱싱 시 input_type="document", 질의 시 "query".
 */
const VOYAGE_URL = "https://api.voyageai.com/v1/embeddings";

export async function embed(
  texts: string[],
  inputType: "document" | "query" = "document"
): Promise<number[][]> {
  const apiKey = process.env.VOYAGE_API_KEY;
  if (!apiKey) throw new Error("VOYAGE_API_KEY가 설정되지 않았습니다.");

  const res = await fetch(VOYAGE_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      input: texts,
      model: process.env.VOYAGE_MODEL || "voyage-3",
      input_type: inputType,
    }),
  });

  if (!res.ok) {
    throw new Error(`Voyage 임베딩 실패 (${res.status}): ${await res.text()}`);
  }

  const json = (await res.json()) as { data: { embedding: number[] }[] };
  return json.data.map((d) => d.embedding);
}

export async function embedOne(
  text: string,
  inputType: "document" | "query" = "query"
): Promise<number[]> {
  const [vec] = await embed([text], inputType);
  return vec;
}
