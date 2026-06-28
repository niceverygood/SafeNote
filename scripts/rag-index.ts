/**
 * RAG 인덱싱: 코퍼스 → 청킹 → Voyage 임베딩 → regulation_chunks.
 * 샘플 코퍼스로 파이프라인 검증, 본 코퍼스 주입 시 재실행(재인덱싱).
 * 실행: npm run rag:index
 */
import { config } from "dotenv";
import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "node:fs";
import { join } from "node:path";

config({ path: ".env.local" });

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
const voyageKey = process.env.VOYAGE_API_KEY;
if (!url || !key || !voyageKey) {
  console.error("Supabase + VOYAGE_API_KEY 필요");
  process.exit(1);
}
const db = createClient(url, key, { auth: { persistSession: false } });

async function embed(texts: string[]): Promise<number[][]> {
  const res = await fetch("https://api.voyageai.com/v1/embeddings", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${voyageKey}`,
    },
    body: JSON.stringify({
      input: texts,
      model: process.env.VOYAGE_MODEL || "voyage-3",
      input_type: "document",
    }),
  });
  if (!res.ok) throw new Error(`Voyage 실패: ${await res.text()}`);
  const json = (await res.json()) as { data: { embedding: number[] }[] };
  return json.data.map((d) => d.embedding);
}

/** 길이 기반 단순 청킹 (문단 우선, 최대 ~700자) */
function chunk(content: string, max = 700): string[] {
  const paras = content.split(/\n\s*\n/).map((p) => p.trim()).filter(Boolean);
  const out: string[] = [];
  let cur = "";
  for (const p of paras) {
    if ((cur + "\n\n" + p).length > max && cur) {
      out.push(cur);
      cur = p;
    } else {
      cur = cur ? cur + "\n\n" + p : p;
    }
  }
  if (cur) out.push(cur);
  return out.length ? out : [content];
}

async function main() {
  const corpus = JSON.parse(
    readFileSync(join(process.cwd(), "data/corpus/sample_corpus.json"), "utf8")
  ) as { source: string; title: string; industry_code: string | null; content: string }[];

  // 재인덱싱: 기존 청크 비우기
  await db.from("regulation_chunks").delete().neq("id", "00000000-0000-0000-0000-000000000000");

  const rows: {
    source: string;
    title: string;
    industry_code: string | null;
    content: string;
  }[] = [];
  for (const doc of corpus) {
    for (const c of chunk(doc.content)) {
      rows.push({
        source: doc.source,
        title: doc.title,
        industry_code: doc.industry_code,
        content: c,
      });
    }
  }

  console.log(`→ ${rows.length}개 청크 임베딩 중...`);
  const BATCH = 32;
  for (let i = 0; i < rows.length; i += BATCH) {
    const batch = rows.slice(i, i + BATCH);
    const vecs = await embed(batch.map((r) => `${r.title}\n${r.content}`));
    const insert = batch.map((r, j) => ({ ...r, embedding: vecs[j] as unknown as string }));
    const res = await db.from("regulation_chunks").insert(insert);
    if (res.error) throw res.error;
    console.log(`  ${Math.min(i + BATCH, rows.length)}/${rows.length}`);
  }
  console.log("✓ 인덱싱 완료");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
