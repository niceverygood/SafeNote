/**
 * RULE DATA + 업종 마스터 시드. service_role 키 사용.
 * 실행: npm run seed  (.env.local 필요)
 */
import { config } from "dotenv";
import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "node:fs";
import { join } from "node:path";

config({ path: ".env.local" });

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) {
  console.error("NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY 필요");
  process.exit(1);
}
const db = createClient(url, key, { auth: { persistSession: false } });

function load(name: string) {
  return JSON.parse(readFileSync(join(process.cwd(), "data/seed", name), "utf8"));
}

async function main() {
  const industries = load("industries.json");
  const obligations = load("obligations.json");
  const hazards = load("hazard_seeds.json");

  console.log("→ industries", industries.length);
  let r = await db.from("industries").upsert(industries, { onConflict: "code" });
  if (r.error) throw r.error;

  console.log("→ obligations", obligations.length);
  r = await db.from("obligations").upsert(obligations, { onConflict: "code" });
  if (r.error) throw r.error;

  // hazard_seeds: 단순 재삽입 (고유키 없음) — 비우고 다시 채움
  console.log("→ hazard_seeds", hazards.length);
  await db.from("hazard_seeds").delete().neq("id", "00000000-0000-0000-0000-000000000000");
  r = await db.from("hazard_seeds").insert(hazards);
  if (r.error) throw r.error;

  console.log("✓ 시드 완료");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
