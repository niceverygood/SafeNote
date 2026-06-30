import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "kr.bottlecorp.safenote",
  appName: "세이프노트",
  webDir: "capwww",
  // 운영 PWA를 감싸는 래퍼 (원격 콘텐츠 로드)
  server: {
    url: "https://safe-note-roan.vercel.app",
    cleartext: false,
  },
  ios: {
    contentInset: "always",
  },
};

export default config;
