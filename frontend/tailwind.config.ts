import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // Teal / mint design tokens from the reference mockup.
        brand: {
          50: "#effcf6",
          100: "#d9f7ec",
          200: "#b3efd9",
          300: "#7fe1c0",
          400: "#43cba0",
          500: "#1eb489",
          600: "#12876a", // primary header gradient stop
          700: "#0f6b56",
          800: "#0f5545",
          900: "#0d463a",
        },
        mint: {
          bg: "#d6f5ea", // app canvas background
        },
      },
      backgroundImage: {
        "brand-gradient": "linear-gradient(160deg, #12876a 0%, #1eb489 100%)",
        "networth-gradient": "linear-gradient(180deg, #14876a 0%, #7fe1c0 100%)",
      },
      borderRadius: {
        card: "1.25rem",
      },
      boxShadow: {
        card: "0 8px 24px -12px rgba(15, 85, 69, 0.25)",
      },
    },
  },
  plugins: [],
};

export default config;
