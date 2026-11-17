import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        ink: {
          950: "#08100f",
          900: "#0b1716",
          850: "#0f1f1d",
          800: "#132725",
          700: "#1b3532",
          600: "#264742",
          500: "#375f59",
        },
        sand: {
          50: "#fbf8f2",
          100: "#f4eee1",
          200: "#e8dcc4",
          300: "#d9c6a2",
          400: "#c7ab79",
          500: "#b8945b",
        },
        ember: {
          300: "#ffcf8a",
          400: "#ffb457",
          500: "#f99232",
          600: "#e0761c",
        },
        sea: {
          300: "#7fd8c9",
          400: "#4bc0ae",
          500: "#2ba393",
          600: "#1d8175",
        },
      },
      fontFamily: {
        sans: ["var(--font-sans)", "ui-sans-serif", "system-ui", "sans-serif"],
        display: ["var(--font-display)", "Georgia", "serif"],
      },
      boxShadow: {
        card: "0 1px 2px rgba(8,16,15,.06), 0 12px 32px -12px rgba(8,16,15,.28)",
        lift: "0 2px 4px rgba(8,16,15,.08), 0 24px 48px -20px rgba(8,16,15,.45)",
      },
      keyframes: {
        "fade-up": {
          "0%": { opacity: "0", transform: "translateY(8px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        shimmer: {
          "100%": { transform: "translateX(100%)" },
        },
        "pulse-ring": {
          "0%": { transform: "scale(.9)", opacity: ".7" },
          "70%": { transform: "scale(1.3)", opacity: "0" },
          "100%": { opacity: "0" },
        },
      },
      animation: {
        "fade-up": "fade-up .45s cubic-bezier(.22,1,.36,1) both",
        shimmer: "shimmer 1.6s infinite",
        "pulse-ring": "pulse-ring 2s ease-out infinite",
      },
    },
  },
  plugins: [],
};

export default config;
