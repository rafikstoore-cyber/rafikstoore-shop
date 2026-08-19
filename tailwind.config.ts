import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        rafik: {
          navy: "#0B1E3D",
          blue: "#12336B",
          blueLight: "#2A4E8C",
          gold: "#C9A24B",
          goldLight: "#E4C878",
          cream: "#FAF7F0",
          ink: "#1A1A1A",
        },
      },
      fontFamily: {
        display: ["var(--font-display)", "serif"],
        body: ["var(--font-body)", "sans-serif"],
      },
      boxShadow: {
        gold: "0 4px 20px rgba(201,162,75,0.25)",
      },
    },
  },
  plugins: [],
};
export default config;
