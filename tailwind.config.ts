import type { Config } from "tailwindcss";

/**
 * SafeNote 디자인 시스템.
 * 색은 "의무 이행 상태"를 인코딩한다 (장식 아님). 임의 색 추가 금지.
 *   이행완료 = safe(green) / 준비중·공백 = caution(amber) / 미이행·노출 = danger(red)
 */
const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        surface: "#F6F7F5", // cool paper white (크림 아님)
        ink: "#16201C", // near-black 본문
        safe: {
          DEFAULT: "#15643E", // 이행완료·증빙확보·주 CTA (institutional green)
          hover: "#0F4D30",
        },
        caution: "#C2841C", // 준비중·일부 공백 (refined amber)
        danger: "#A82B22", // 미이행·형사 리스크 노출 (절제 사용)
        border: "#DCE0DA", // divider
        muted: "#5C6B62", // 보조 텍스트
      },
      fontFamily: {
        // 표제·본문
        sans: ["var(--font-pretendard)", "Pretendard", "system-ui", "sans-serif"],
        // 공식문서 표제 (위험성평가표·리포트 표지)
        serif: ["var(--font-noto-serif-kr)", "serif"],
        // 데이터: %, 점수, 날짜, ID
        mono: ["var(--font-jetbrains-mono)", "ui-monospace", "monospace"],
      },
      borderColor: {
        DEFAULT: "#DCE0DA",
      },
      borderRadius: {
        sm: "4px",
        DEFAULT: "6px",
        md: "8px",
        lg: "12px",
      },
      keyframes: {
        "gauge-fill": {
          from: { "stroke-dashoffset": "var(--gauge-from, 0)" },
          to: { "stroke-dashoffset": "var(--gauge-to, 0)" },
        },
        "seal-press": {
          "0%": { transform: "scale(1.15) rotate(-6deg)", opacity: "0" },
          "60%": { transform: "scale(0.96) rotate(-6deg)", opacity: "1" },
          "100%": { transform: "scale(1) rotate(-6deg)", opacity: "1" },
        },
      },
      animation: {
        "gauge-fill": "gauge-fill 900ms cubic-bezier(0.22, 1, 0.36, 1) forwards",
        "seal-press": "seal-press 420ms cubic-bezier(0.34, 1.56, 0.64, 1) forwards",
      },
    },
  },
  plugins: [],
};

export default config;
