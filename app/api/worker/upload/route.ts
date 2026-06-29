import { NextResponse } from "next/server";
import { z } from "zod";
import { getServiceSupabase } from "@/lib/supabase/server";

export const runtime = "nodejs";

const Schema = z.object({
  workspace_id: z.string().uuid(),
  data: z.string().min(10), // data URL (data:image/...;base64,....)
});

/** 위험 신고 사진 업로드 → 공개 URL 반환 (서버 service_role) */
export async function POST(req: Request) {
  const parsed = Schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "잘못된 요청" }, { status: 400 });

  const m = parsed.data.data.match(/^data:(image\/(png|jpe?g|webp));base64,(.+)$/);
  if (!m) return NextResponse.json({ error: "이미지 형식(JPG/PNG/WEBP)만 허용됩니다." }, { status: 400 });
  const contentType = m[1];
  const ext = contentType.split("/")[1].replace("jpeg", "jpg");
  const buffer = Buffer.from(m[3], "base64");
  if (buffer.length > 6 * 1024 * 1024)
    return NextResponse.json({ error: "사진은 6MB 이하만 가능합니다." }, { status: 400 });

  const db = getServiceSupabase();
  const path = `${parsed.data.workspace_id}/${Date.now()}-${buffer.length}.${ext}`;
  const { error } = await db.storage.from("hazard-photos").upload(path, buffer, {
    contentType,
    upsert: false,
  });
  if (error) return NextResponse.json({ error: "업로드 실패" }, { status: 500 });

  const { data: pub } = db.storage.from("hazard-photos").getPublicUrl(path);
  return NextResponse.json({ ok: true, url: pub.publicUrl });
}
