# 세이프노트 — 애플 앱스토어 등록 (Capacitor iOS) 런북

운영 PWA(safe-note-roan.vercel.app)를 Capacitor로 감싼 iOS 래퍼입니다.

- 번들 ID: `kr.bottlecorp.safenote`
- 앱 이름: 세이프노트 · 로드 URL: 운영 사이트(원격)
- 프로젝트: `ios/App/App.xcodeproj` (Capacitor 8 · Swift Package Manager)
- 아이콘: 1024 불투명 적용됨 (App Store 규격)

## 이미 자동화로 끝난 것
- Capacitor 설치·`capacitor.config.ts`·iOS 프로젝트 생성(`npx cap add ios`)
- App Store용 1024 불투명 아이콘 적용

## 직접 하셔야 하는 것 (Apple 계정·Xcode 필요 — 제 환경에서 불가)
### 1. Xcode 열기
```bash
cd /Users/seungsoohan/Projects/SafeNote
npx cap open ios      # 또는: open ios/App/App.xcodeproj
```

### 2. 서명(Signing)
- 좌측 App 타깃 → **Signing & Capabilities**
- **Team**: 티마트(회사) Apple Developer 팀 선택
- **Automatically manage signing** 체크
- **Bundle Identifier**: `kr.bottlecorp.safenote` (Apple Developer에 App ID 자동 생성됨)

### 3. 아카이브 & 업로드
- 상단 타깃을 **Any iOS Device (arm64)** 로
- **Product → Archive**
- Organizer → **Distribute App → App Store Connect → Upload**

### 4. App Store Connect (appstoreconnect.apple.com)
1. **앱 추가**: 플랫폼 iOS / 이름 세이프노트 / 기본 언어 한국어 / 번들ID `kr.bottlecorp.safenote` / SKU 임의
2. 업로드한 **빌드 선택**(처리 10~30분 대기)
3. **앱 정보·스토어 등록정보**: 설명·키워드·카테고리(비즈니스) · 개인정보처리방침 URL `https://safe-note-roan.vercel.app/privacy`
4. **스크린샷**: iPhone 6.7"(1290×2796) 등 필수 — 앱 화면 캡처 필요(현재 `docs/store` 목업은 1080×1920이라 규격 리사이즈/재생성 필요)
5. **앱 개인정보(App Privacy)**: 수집 항목 = 이메일·이름·전화번호·**사진**·**위치**·앱 활동 / 추적 안 함 / 전송 중 암호화
6. **앱 심사 정보 → 로그인 필요(Sign-in required)**: 데모 계정 제공
   - 관리자: `test@test.com` / `test1234` (로그인 후 화면 상단 메뉴)
   - 근로자: `test` / `test1234` (근로자 로그인)
7. **심사 제출**

## 주의 — 애플 심사 지침 4.2 (최소 기능)
단순 웹 래퍼는 반려될 수 있습니다. 완화책:
- 심사 노트에 “현장 안전점검·카메라(사진)·위치 기반 위험신고 등 네이티브 기능 활용” 명시
- 데모 계정으로 실제 기능(작업 전·중·후 점검, 위험 신고) 시연 가능하게 안내
- 반려 시 네이티브 기능(푸시 알림·카메라 권한 등) 강화 후 재제출

## 설정 변경 시
`capacitor.config.ts` 또는 웹 변경 후:
```bash
npx cap sync ios
```
