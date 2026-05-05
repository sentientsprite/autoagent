import type { Config } from "tailwindcss";

export default {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        void: "#070A0D",
        panel: "#0E141B",
        line: "#1E2A36",
        mist: "#9AA7B2",
        signal: "#5EEAD4",
        amber: "#FBBF24",
        danger: "#FB7185",
      },
      fontFamily: {
        sans: ["var(--font-geist-sans)", "ui-sans-serif", "system-ui"],
        mono: ["var(--font-geist-mono)", "ui-monospace"],
      },
      boxShadow: {
        glow: "0 0 0 1px rgba(94,234,212,0.25), 0 10px 40px rgba(0,0,0,0.45)",
      },
    },
  },
  plugins: [],
} satisfies Config;
