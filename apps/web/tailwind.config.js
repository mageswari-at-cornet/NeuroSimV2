/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        // NeuroSim Design System
        neuro: {
          // Background colors
          bg: {
            primary: "#050505",
            secondary: "#0f172a",
            tertiary: "#1e293b",
            elevated: "rgba(30, 41, 59, 0.8)",
          },
          // Text colors
          text: {
            primary: "#f8fafc",
            secondary: "#94a3b8",
            tertiary: "#64748b",
          },
          // Border colors
          border: {
            subtle: "rgba(148, 163, 184, 0.1)",
            default: "rgba(148, 163, 184, 0.2)",
            focus: "#06b6d4",
          },
          // Semantic colors
          salvaged: "#06b6d4",
          core: "#ef4444",
          penumbra: "#f59e0b",
          baseline: "#475569",
          positive: "#10b981",
          negative: "#ef4444",
          // Status colors
          info: "#3b82f6",
          success: "#10b981",
          warning: "#f59e0b",
          error: "#ef4444",
        },
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
        mono: ["JetBrains Mono", "Fira Code", "monospace"],
      },
      fontSize: {
        "2xl": ["28px", { lineHeight: "1.2", fontWeight: "700" }],
        xl: ["22px", { lineHeight: "1.3", fontWeight: "600" }],
        lg: ["18px", { lineHeight: "1.4", fontWeight: "600" }],
        base: ["16px", { lineHeight: "1.5", fontWeight: "500" }],
        sm: ["14px", { lineHeight: "1.5", fontWeight: "400" }],
        xs: ["12px", { lineHeight: "1.4", fontWeight: "400" }],
        metric: ["24px", { lineHeight: "1", fontWeight: "700" }],
      },
      backdropBlur: {
        glass: "10px",
      },
      animation: {
        "slide-up": "slideUp 300ms ease-out",
        "slide-down": "slideDown 200ms ease-in",
        pulse: "pulse 300ms ease-out",
        shimmer: "shimmer 1.5s infinite",
      },
      keyframes: {
        slideUp: {
          from: { transform: "translateY(100%)", opacity: "0" },
          to: { transform: "translateY(0)", opacity: "1" },
        },
        slideDown: {
          from: { transform: "translateY(0)", opacity: "1" },
          to: { transform: "translateY(100%)", opacity: "0" },
        },
        pulse: {
          "0%": { transform: "scale(1)" },
          "50%": { transform: "scale(1.1)" },
          "100%": { transform: "scale(1)" },
        },
        shimmer: {
          "0%": { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" },
        },
      },
    },
  },
  plugins: [],
}
