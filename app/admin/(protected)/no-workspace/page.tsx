export const dynamic = "force-dynamic";

export default function NoWorkspacePage() {
  return (
    <div className="mx-auto max-w-md py-16 text-center">
      <h1 className="text-lg font-bold text-ink">배정된 사업장이 없습니다</h1>
      <p className="mt-2 text-sm text-muted">
        아직 관리할 사업장이 배정되지 않았습니다. 총괄관리자에게 사업장 배정을 요청해 주세요.
      </p>
    </div>
  );
}
