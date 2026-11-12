import type { Config } from "tailwindcss";
export default {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: { DEFAULT: "#16151a", soft: "#2a2830" },
        brass: { DEFAULT: "#b8862f", light: "#f4e9d4", dark: "#8a6320" },
      },
      fontFamily: { sans: ["var(--font-sans)", "system-ui", "sans-serif"], display: ["var(--font-display)", "Georgia", "serif"] },
    },
  },
  plugins: [],
} satisfies Config;
