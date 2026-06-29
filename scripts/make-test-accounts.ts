/**
 * 테스트 계정 생성: 사업장 관리자(Supabase Auth, 이메일+비번) + 근로자(아이디+비번).
 * 실행: npx tsx scripts/make-test-accounts.ts
 */
import { config } from "dotenv";
import { createClient } from "@supabase/supabase-js";
import { scryptSync, randomBytes } from "node:crypto";

config({ path: ".env.local" });

const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const db = createClient(url, key, { auth: { persistSession: false } });

const MANAGER = { email: "manager@safenote.test", password: "safenote-manager-2026" };
const WORKER = { username: "worker1", password: "safenote-worker-2026", name: "테스트작업자" };

function hashPassword(pw: string) {
  const salt = randomBytes(16).toString("hex");
  return `${salt}:${scryptSync(pw, salt, 64).toString("hex")}`;
}

async function main() {
  // 1) 관리자 Supabase Auth 계정
  const created = await db.auth.admin.createUser({
    email: MANAGER.email,
    password: MANAGER.password,
    email_confirm: true,
  });
  if (created.error && /already|exists|registered/i.test(created.error.message)) {
    const list = await db.auth.admin.listUsers();
    const u = list.data.users.find((x) => x.email === MANAGER.email);
    if (u) await db.auth.admin.updateUserById(u.id, { password: MANAGER.password });
    console.log("→ 관리자 계정 비밀번호 갱신");
  } else if (created.error) {
    throw created.error;
  } else {
    console.log("→ 관리자 계정 생성");
  }
  await db.from("admins").upsert(
    { email: MANAGER.email, role: "admin", note: "테스트 사업장 관리자" },
    { onConflict: "email" }
  );

  // 2) 근로자 자격증명 (TEST01 사업장)
  const { data: ws } = await db.from("workspaces").select("id").eq("join_code", "TEST01").maybeSingle();
  if (!ws) throw new Error("TEST01 사업장이 없습니다.");
  const ph = hashPassword(WORKER.password);
  const { data: existing } = await db
    .from("workers")
    .select("id")
    .eq("username", WORKER.username)
    .maybeSingle();
  if (existing) {
    await db.from("workers").update({ password_hash: ph, name: WORKER.name }).eq("id", existing.id);
    console.log("→ 근로자 계정 비밀번호 갱신");
  } else {
    await db.from("workers").insert({
      workspace_id: ws.id,
      name: WORKER.name,
      username: WORKER.username,
      password_hash: ph,
    });
    console.log("→ 근로자 계정 생성");
  }

  console.log("\n=== 발급된 테스트 계정 ===");
  console.log("[사업장 관리자] 아이디:", MANAGER.email, "/ 비번:", MANAGER.password);
  console.log("[근로자]       아이디:", WORKER.username, "/ 비번:", WORKER.password);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
