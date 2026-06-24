import type { Config } from "tailwindcss";
const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        navy: "#0B1F3A",
        brand: "#FF8A00",
        teal: "#19D3AE",
        ink: "#0B1F3A",
      },
      fontFamily: {
        sans: ["Inter", "ui-sans-serif", "system-ui", "-apple-system", "Segoe UI", "sans-serif"],
      },
      borderRadius: { "2xl": "1rem", "3xl": "1.5rem" },
      boxShadow: { card: "0 1px 2px 0 rgba(11,31,58,0.04)" },
    },
  },
  plugins: [],
};
export default config;
