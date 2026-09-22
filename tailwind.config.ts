import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        rafik: {
          navy: "#14151C",
          blue: "#2F3EFF",
          blueLight: "#5865FF",
          gold: "#E8A33D",
          goldLight: "#F0BE73",
          cream: "#F6F5F1",
          ink: "#14151C",
        },
      },
      fontFamily: {
        display: ["var(--font-display)", "serif"],
        body: ["var(--font-body)", "sans-serif"],
      },
      boxShadow: {
        gold: "0 4px 20px rgba(232,163,61,0.25)",
      },
    },
  },
  plugins: [],
};
export default config;