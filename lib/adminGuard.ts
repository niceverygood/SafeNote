import { redirect } from "next/navigation";
import { getAdmin, type AdminInfo } from "@/lib/admin";

/** admin 홈으로 보낼 경로 (배정 사업장 or 개요) */
function homeFor(a: AdminInfo): string {
  return a.role === "super" ? "/admin" : a.workspaceId ? `/admin/workspaces/${a.workspaceId}` : "/admin/no-workspace";
}

/** 총괄관리자(super) 전용 페이지 가드 */
export async function requireSuper(): Promise<AdminInfo> {
  const a = await getAdmin();
  if (!a) redirect("/admin/login");
  if (a.role !== "super") redirect(homeFor(a));
  return a;
}

/** 해당 사업장에 접근 가능한지 (super는 전체, admin은 자기 사업장만) */
export async function requireWorkspaceAccess(id: string): Promise<AdminInfo> {
  const a = await getAdmin();
  if (!a) redirect("/admin/login");
  if (a.role !== "super" && a.workspaceId !== id) redirect(homeFor(a));
  return a;
}
