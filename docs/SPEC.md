# SafeNote Phase 0 — 구현 스펙 (워커 공통 참조)

## 제품 한 줄
전담 안전관리자 없는 5~49인 사업장이 중대재해처벌법 "안전보건관리체계 구축·이행"을 **증빙까지 자동으로** 갖추게 하는 SaaS. North star = **증빙의 자동 축적**.

## 절대 원칙 (타협 불가)
1. 규정 매핑·법적 판단·위험도 산정 = rule-based engine + RAG. **LLM 단독 판단/계산 금지.**
2. LLM = 해석·초안·문장화뿐. 근거(RAG chunk) 밖 생성 금지. 불확실 시 `needs_expert_review`.
3. LLM 산출물은 항상 "초안" 표시 + 사용자 확정 강제. 미확정 = 미완료.
4. 모든 산출물 하단 고지: "본 자료는 법률자문을 대체하지 않습니다." → `<Disclaimer/>`
5. **"면책 보장 / 처벌 면제 확정" 류 표현 금지** (허위광고).

## 디자인 시스템 (tailwind.config.ts에 등록됨)
- 색 토큰(임의 색 추가 금지): `surface #F6F7F5` / `ink #16201C` / `safe #15643E`(hover `safe-hover`) / `caution #C2841C` / `danger #A82B22` / `border #DCE0DA` / `muted #5C6B62`.
- **색은 의무 이행 상태를 인코딩**: 이행완료=safe / 준비중·공백=caution / 미이행·노출=danger. (`lib/status.ts`)
- 폰트: `font-sans`(Pretendard, 표제 700/800·본문 400/500) / `font-serif`(Noto Serif KR, 공식문서 표제) / `font-mono`(JetBrains Mono, %·점수·날짜·ID). 숫자는 `.num` 유틸.
- 포지셔닝: "안전 관제실의 차분한 권위 + 공문서/인증서의 신뢰." 상태 중심·구조적·침착.
- **금지**: 그라데이션 hero · shadcn 보라 · 네온/애시드 그린 · 크림+세리프+테라코타 · 신문 헤어라인 · 카드 그리드 남발 · 장식용 01·02·03 · 공장 노랑-검정 클립아트 · 이모지 · 과한 애니메이션.
- **필수**: 모바일까지 완전 반응형 · 키보드 포커스 가시화(globals.css에 :focus-visible 처리됨) · `prefers-reduced-motion` 존중 · 상태색+텍스트 동시.

## 공유 컴포넌트 (components/ds — 이미 존재)
- `<Disclaimer/>` 필수 고지
- `<StatusChip status=fulfilled|partial|missing/>`, `<RiskChip level=low|medium|high/>`
- `<LiabilityGauge score size=sm|md|lg label/>` 면책 게이지(시그니처)
- `<SealStamp date/>` 직인(확정), `<DraftBadge/>`, `<ExpertReviewFlag/>`

## 공유 lib (이미 존재)
- `lib/status.ts` — ComplianceStatus, RiskLevel, exposureFromScore
- `lib/rules/types.ts` — Obligation, DiagnosisInput/Result, RiskItem 등
- `lib/rules/obligations.ts` — `runDiagnosis(obligations, input)` (rule)
- `lib/rules/riskMatrix.ts` — FREQUENCY/SEVERITY_OPTIONS, `riskLevel(f,s)` (rule)
- `lib/rag/retrieve.ts` — `retrieveChunks({industry_code, process})`
- `lib/ai/generate.ts` — `generateRiskDraft(input)` → 초안 항목(위험도 미포함)
- `lib/supabase/server.ts` — `getServerSupabase()`(RLS), `getServiceSupabase()`(서버 전용)

## 데이터 모델
workspaces / obligations(RULE) / hazard_seeds(RULE) / industries / diagnoses / risk_assessments(status draft|confirmed, items jsonb) / regulation_chunks(vector 1024). 마이그레이션 supabase/migrations/.

## 모듈 A — 면책 자가진단 (리드마그넷)
업종→규모→보유서류 체크(한 번에 한 질문/짧은 스텝, 5분). rule로 `runDiagnosis` → 9대 의무 상태/이행률/리스크. LLM은 각 공백 설명 1~2줄 + 다음 액션 문구만(있으면). 결과 화면 = **점검표/상태 대장**(카드 그리드 금지, 검사 시트의 디지털판): 각 행 [상태 칩 · 무엇이 비었나 · 다음 액션]. 상단 면책 게이지 + 리스크 등급. 리포트 전문/PDF는 **이메일 입력 후**(리드 캡처). 톤: 정직하되 비관 금지.

## 모듈 B — 위험성평가 생성기 (코어)
파이프라인 순서 고정: ① rule(hazard_seeds 후보) → ② RAG(regulation_chunks) → ③ LLM(근거 내 초안). 위험도: LLM 금지, **빈도×강도 매트릭스 UI로 사용자 선택 → 색 자동**. 결과 = 문서/표 grade(Noto Serif KR 표제 + 출처 인용). 컬럼 [유해위험요인 / 위험도 / 감소대책 / 담당·기한]. 생성 직후 draft + "초안" 배지, needs_expert_review = amber 플래그. 확정 시 직인 → confirmed. PDF = 인쇄해 감독관 제출 가능한 공문서 품질.

## 랜딩 카피 (모듈 A 진입)
- 헤드라인: "지금 사고가 나면, 대표님의 증빙은 충분합니까?"
- 서브헤드: "중대재해처벌법은 의무를 이행했다는 '증빙'이 곧 면책입니다. 전담 안전관리자 없이도, 세이프노트가 그 증빙을 상시 쌓아 대표님을 지킵니다."
- Stakes(절제): "2024년부터 5인 이상 전 사업장 적용 · 대표 1년 이상 징역 또는 10억 이하 벌금"
- 주 CTA: "내 사업장 면책 상태 진단" · 마이크로카피 "가입 없이 5분, 우리 사업장 증빙 갭을 바로 확인"
- 가치 3개(짧게): ① 일회성 서류가 아니라 상시 쌓이는 증빙 ② 전담자 없이 비전문가도 5분 ③ 사고 시 면책 입증에 쓰는 객관적 자료
- 금지 카피: 결과 단정("면책 보장/처벌 면제 확정"), "위험성평가 자동화"를 메인 후킹으로, 과장·공포 조장, 이모지. 하단 고지문 필수.
