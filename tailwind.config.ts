import type { Config } from "tailwindcss";

export default {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./lib/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        // Remap blue scale so existing text-blue-600/hover:text-blue-700 in pages adopt brand colors
        blue: {
          50:  "#EAF5FB",
          100: "#D4ECF7",
          200: "#A8D4ED",
          300: "#7BBFDF",
          400: "#5AABDB",
          500: "#5AABDB",
          600: "#5AABDB",
          700: "#4494C8",
          800: "#357DAB",
          900: "#24587A",
        },
        // Dedicated brand scale used in globals.css utility classes
        brand: {
          50:  "#EAF5FB",
          200: "#A8D4ED",
          500: "#5AABDB",
          600: "#4494C8",
        },
      },
      fontFamily: {
        sans: ["var(--font-nunito)", "ui-sans-serif", "system-ui", "sans-serif"],
      },
    },
  },
  plugins: [],
} satisfies Config;
