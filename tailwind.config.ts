import type { Config } from "tailwindcss";

export default {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./lib/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          bg: "#f4fbff",
          surface: "#ffffff",
          border: "#cfe5eb",
          primary: "#2f9cc9",
          "primary-strong": "#1f7ea8",
          secondary: "#d6f3f0",
          "secondary-strong": "#b7e8e2",
          foreground: "#12303d",
          muted: "#5e7b87"
        },
        state: {
          success: "#1f8f5f",
          "success-soft": "#e9f8f1",
          alert: "#b97400",
          "alert-soft": "#fff4df",
          error: "#c6384f",
          "error-soft": "#ffecef",
          "error-strong": "#9f2136"
        }
      }
    }
  },
  plugins: []
} satisfies Config;
