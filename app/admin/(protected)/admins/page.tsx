import { getAdmin } from "@/lib/admin";
import { getServiceSupabase } from "@/lib/supabase/server";
import { AdminManager } from "@/components/admin/AdminManager";

export const dynamic = "force-dynamic";

export default async function AdminsPage() {
  const admin = await getAdmin();
  if (admin?.role !== "super") {
    return (
      <div>
        <h1 className="text-xl font-bold text-ink">관리자 관리</h1>
        <p className="mt-2 text-sm text-muted">이 페이지는 총괄관리자만 접근할 수 있습니다.</p>
      </div>
    );
  }

  const db = getServiceSupabase();
  const { data } = await db
    .from("admins")
    .select("email, role, note, created_at")
    .order("created_at", { ascending: true });

  return (
    <div>
      <h1 className="text-xl font-bold text-ink">관리자 관리</h1>
      <p className="mt-1 text-sm text-muted">
        관리자 이메일을 허용목록에 추가/제거합니다. 추가된 이메일은 매직링크 첫 로그인 시
        계정이 생성됩니다.
      </p>
      <div className="mt-6">
        <AdminManager rows={data ?? []} selfEmail={admin.email} />
      </div>
    </div>
  );
}
