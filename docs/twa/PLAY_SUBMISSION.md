# 세이프노트 — 구글 플레이 등록 (TWA) 런북

PWA를 **TWA(Trusted Web Activity)** 로 감싸 Play 스토어에 등록하는 절차입니다.
이미 준비된 것: PWA(매니페스트·서비스워커), `twa/twa-manifest.json`, 업로드 키스토어,
`public/.well-known/assetlinks.json`(지문만 채우면 됨).

- 패키지명: `kr.bottlecorp.safenote`
- 앱 이름: 세이프노트 · 시작 URL: `/w`
- 도메인: `safe-note-roan.vercel.app`

---

## 0. 준비물 (직접 필요)
- **Google Play Console 개발자 계정** (1회 $25 결제) — 계정/결제는 직접.
- 로컬: JDK 17 + Android SDK (이미 설치됨), Bubblewrap(`npx @bubblewrap/cli`).
- **개인정보 처리방침 URL** (Play 필수). 없으면 간단 페이지라도 필요(요청 시 만들어 드림).

## 1. .aab 빌드  ← **이 한 단계만 터미널에서 직접 실행하면 됩니다**
```bash
cd /Users/seungsoohan/Projects/SafeNote/twa
npx @bubblewrap/cli build
```
- 키스토어 이미 생성됨: `twa/android-upload.keystore` (alias: `safenote`)
- 업로드 키 비밀번호: **`safenote-upload-2026`** ← 빌드 중 비번 물으면 입력. **안전 보관·백업 필수**(분실 시 업로드 키 재설정).
- 산출물: `twa/app-release-bundle.aab` ← Play에 업로드할 파일

> **빌드가 “The provided JDK/androidSdk isn't correct” 로 멈추면** (헤드리스 자동빌드에서 발생):
> Bubblewrap이 자체 JDK/Android SDK를 설치하도록 두는 게 가장 확실합니다. 대화형으로 다시 실행하고
> 설치 여부를 묻는 질문에 모두 **Yes(엔터)** 로 답하세요:
> ```bash
> cd /Users/seungsoohan/Projects/SafeNote/twa
> npx @bubblewrap/cli updateConfig --jdkPath "" --androidSdkPath ""   # 자체 설치 유도(선택)
> npx @bubblewrap/cli build   # JDK/SDK 설치 묻는 질문에 Yes
> ```
> (현재 시스템 JDK 17·Android SDK 경로는 `~/.bubblewrap/config.json` 에 설정돼 있으나, 이 버전의
> bubblewrap이 시스템 SDK를 거부할 수 있어 자체 설치를 권장합니다.)

## 2. Play Console에 앱 생성
1. https://play.google.com/console → 앱 만들기 (이름: 세이프노트, 무료, 앱 유형)
2. **Play 앱 서명(Play App Signing)** 활성화(기본).

## 3. 내부 테스트로 업로드
1. 테스트 → 내부 테스트 → 새 버전 만들기 → `app-release-bundle.aab` 업로드
2. 업로드하면 Play가 **앱 서명 인증서**를 생성/표시합니다.

## 4. Digital Asset Links 연결 (URL 바 제거의 핵심)
1. Play Console → 설정 → **앱 무결성/앱 서명** → **앱 서명 키 인증서**의 **SHA-256 지문** 복사
2. `public/.well-known/assetlinks.json` 의 `REPLACE_WITH_PLAY_APP_SIGNING_SHA256` 를 그 지문으로 교체
   (선택: 업로드 키 지문도 함께 배열에 추가 — 업로드 키 SHA-256: `57:54:FC:90:68:1D:ED:F2:D0:A3:3C:61:E0:6B:7B:1A:A9:66:AC:54:8F:DB:4E:AB:28:0D:21:34:6E:D7:B1:75`)
3. 커밋 → 재배포:
   ```bash
   cd /Users/seungsoohan/Projects/SafeNote
   git add public/.well-known/assetlinks.json && git commit -m "chore: assetlinks 지문 등록" && git push
   npx vercel --prod --scope bottle-7db975af
   ```
4. 확인: https://safe-note-roan.vercel.app/.well-known/assetlinks.json 가 올바른 지문 노출 → TWA가 주소창 없이 전체화면으로 열립니다.

## 5. 스토어 등록정보 + 심사 제출
- 스토어 등록정보: 아이콘(512), 피처 그래픽(1024×500), 스크린샷, 설명
- 정책: **개인정보 처리방침 URL**, 데이터 안전(수집 항목: 이메일·사진·위치 등 신고서 반영), 콘텐츠 등급 설문
- 프로덕션 트랙으로 출시 → **심사 제출** (검수 보통 며칠)

---

## 제가 할 수 없는 것 (직접 하셔야 함)
- 개발자 계정 생성·$25 결제·약관 동의
- 키스토어 비밀번호 보관/백업
- 데이터 안전·콘텐츠 등급 선언, 최종 **심사 제출**

## 자동화로 끝난 것
- PWA(매니페스트·SW·아이콘), `twa-manifest.json`, 업로드 키스토어 생성, assetlinks 골격, 빌드 설정(JDK/SDK 연결)
