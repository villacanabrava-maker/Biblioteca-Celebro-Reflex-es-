import type { Config } from "tailwindcss";
import tailwindcssAnimate from "tailwindcss-animate";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/componentes/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        primaria: {
          50: "#EFF6FF",
          100: "#DBEAFE",
          200: "#BFDBFE",
          500: "#2563EB",
          600: "#1D4ED8",
          700: "#1A56DB",
          800: "#1E40AF",
          900: "#1E3A8A",
        },
        editorial: {
          fundo: "#F8FAFC",
          card: "#FFFFFF",
          borda: "#E2E8F0",
          texto: "#0F172A",
          mutado: "#64748B",
        },
      },
      fontFamily: {
        sans: ["var(--font-inter)", "system-ui", "sans-serif"],
        editorial: ["var(--font-merriweather)", "Georgia", "serif"],
      },
      borderRadius: {
        suave: "0.875rem",
      },
    },
  },
  plugins: [tailwindcssAnimate],
};

export default config;
