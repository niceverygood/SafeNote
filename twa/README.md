# TWA (Trusted Web Activity) — 구글 플레이용 안드로이드 래퍼

세이프노트 PWA를 Play 스토어에 올리기 위한 TWA 설정입니다.

- 설정: `twa-manifest.json` (패키지 `com.timart.safenote`, 시작 `/w`)
- 빌드: `npx @bubblewrap/cli build` → `app-release-bundle.aab` 생성
- 업로드 키스토어: `android-upload.keystore` (alias `safenote`) — **gitignore됨, 별도 백업 필수**
- 전체 절차: [`../docs/twa/PLAY_SUBMISSION.md`](../docs/twa/PLAY_SUBMISSION.md)

생성 산출물(`app/`, `*.aab`, 키스토어 등)은 커밋되지 않습니다(이 README와 twa-manifest.json만 버전관리).
