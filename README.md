# 세이프노트 (SafeNote) — Phase 0

전담 안전관리자 없는 5~49인 사업장이 중대재해처벌법 안전보건관리체계 이행 **증빙을 자동으로 축적**하게 하는 SaaS.

## 스택
Next.js 14 (App Router) · TypeScript · Tailwind · Supabase(Postgres+Auth+Storage+pgvector) · Claude API(해석·초안 전용) · Voyage AI(RAG 임베딩) · @react-pdf/renderer · Vercel

## Phase 0 모듈
- **모듈 A — 면책 자가진단** (`/diagnosis`): rule 기반 9대 의무 갭 도출 → 면책 게이지·리스크 등급 → 상태 대장 → 이메일 리드 캡처.
- **모듈 B — 위험성평가 생성기** (`/risk-assessment/new`): rule(hazard_seeds) → RAG(regulation_chunks) → LLM 초안 → 빈도×강도 매트릭스로 사용자가 위험도 확정 → 직인 → PDF.

## 설계 원칙 (코드 전반에 강제)
- 규정 매핑·위험도 산정 = rule + RAG. LLM은 해석·초안·문장화만, 근거 밖 생성 금지.
- LLM 산출물은 항상 "초안", 사용자 확정 전까지 미완료. 위험도는 LLM이 아닌 사용자 매트릭스로 결정(서버 재계산).
- 모든 산출물 하단 "본 자료는 법률자문을 대체하지 않습니다." / "면책 보장" 류 표현 금지.

## 셋업
1) 의존성:
```
npm install
```
2) `.env.example` → `.env.local` 복사 후 키 입력 (Supabase URL/anon/service_role, ANTHROPIC_API_KEY, VOYAGE_API_KEY).
3) DB 마이그레이션: `supabase/migrations/`의 `0001`→`0002`→`0003` 순서로 Supabase SQL Editor에서 실행 (또는 `supabase db push`).
4) 시드(RULE DATA): `npm run seed`
5) RAG 인덱싱(샘플 코퍼스): `npm run rag:index` (본 KOSHA 코퍼스 확보 시 `data/corpus/`에 추가 후 재실행 = 재인덱싱)
6) 개발 서버: `npm run dev`

## 디렉터리
- `app/` 라우트·API · `components/ds` 디자인 시스템(게이지·직인·상태칩) · `components/diagnosis|risk|shell`
- `lib/rules` rule 엔진 · `lib/rag` 임베딩·검색 · `lib/ai` LLM 초안 · `lib/pdf` PDF
- `supabase/migrations` 스키마 · `data/seed` RULE DATA · `data/corpus` RAG 코퍼스 · `docs/SPEC.md` 구현 스펙

## 검증 상태
`npm run build` ✓ · `npx tsc --noEmit` ✓ · "면책 보장"류 0건 · 이모지 0건 · 모든 산출 화면 고지문 노출.
