/**
 * 모듈 A — 리드 캡처 API.
 * POST {diagnosis_id, email, name?, phone?}: 이메일 검증 후 diagnoses.lead_contact 갱신.
 * 성공 시 클라이언트가 리포트 전문을 잠금 해제한다.
 */
import { NextResponse } from "next/server";
import { z } from "zod";
import { getServiceSupabase } from "@/lib/supabase/server";
import { addStibeeSubscriber } from "@/lib/stibee";

export const runtime = "nodejs";

const Body = z.object({
  diagnosis_id: z.string().uuid("유효한 진단 ID가 아닙니다."),
  email: z.string().email("이메일 형식이 올바르지 않습니다."),
  name: z.string().max(80).optional(),
  phone: z.string().max(40).optional(),
});

export async function POST(req: Request) {
  let json: unknown;
  try {
    json = await req.json();
  } catch {
    return NextResponse.json({ error: "잘못된 요청 본문입니다." }, { status: 400 });
  }

  const parsed = Body.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "입력값이 올바르지 않습니다." },
      { status: 400 }
    );
  }

  const { diagnosis_id, email, name, phone } = parsed.data;

  try {
    const supabase = getServiceSupabase();
    const { error } = await supabase
      .from("diagnoses")
      .update({
        lead_contact: {
          email,
          ...(name ? { name } : {}),
          ...(phone ? { phone } : {}),
          captured_at: new Date().toISOString(),
        },
      })
      .eq("id", diagnosis_id);

    if (error) {
      return NextResponse.json({ error: "저장에 실패했습니다." }, { status: 500 });
    }
    // 너처링 리스트 자동 등록(키 없으면 스킵, 실패해도 무시)
    await addStibeeSubscriber({ email, name, phone, fields: { source: "diagnosis" } });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "저장 중 오류가 발생했습니다." }, { status: 500 });
  }
}
