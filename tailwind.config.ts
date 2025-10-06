import type { Config } from "tailwindcss";
export default {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      minHeight: { dvh: "100dvh" },
      fontFamily: { sans: ["ui-sans-serif","system-ui","Apple Color Emoji","Segoe UI Emoji"] }
    }
  },
  plugins: []
} satisfies Config;
