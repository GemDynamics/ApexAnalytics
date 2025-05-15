import type { Config } from "tailwindcss"
const { fontFamily } = require("tailwindcss/defaultTheme")

const config = {
  darkMode: ["class"],
  content: [
    "./pages/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./app/**/*.{ts,tsx}",
    "./src/**/*.{ts,tsx}",
    "*.{js,ts,jsx,tsx,mdx}",
  ],
  prefix: "",
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      fontFamily: {
        sans: ["var(--font-sans)", ...fontFamily.sans],
      },
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        // Baulytics Epic Theme Palette
        baulytics: {
          gradient_start: "#3A5BF0",
          gradient_mid: "#5C41E6",
          gradient_end: "#6A27D8",
          text_silver: "#AEB8D0",
          text_dark: "#1A202C",
          bg_light_static: "#F8F9FC",
        },
        // Dark Theme Background Rolling Gradient Palette
        sky_dark: {
          900: "#0c4a6e", // existing sky-900
          925: "#0a3a5a", // custom darker
          950: "#082f49", // existing sky-950
          975: "#062438", // custom darker
        },
        slate_dark: {
          900: "#0f172a", // existing slate-900
          925: "#0d1321", // custom darker
          950: "#0b101a", // existing slate-950
          975: "#080c14", // custom darker
        },
        indigo_dark: {
          900: "#312e81", // existing indigo-900
          925: "#29266F", // custom darker
          950: "#252265", // existing indigo-950 (example, adjust as needed)
          975: "#1D1A50", // custom darker
        },
        emerald_dark: {
          900: "#065f46", // existing emerald-900
          950: "#044330", // existing emerald-950 (example)
          975: "#022B20", // custom darker
        },
        teal_dark: {
          900: "#134e4a", // existing teal-900
          925: "#10423F", // custom darker
          950: "#0e3936", // existing teal-950 (example)
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      keyframes: {
        "accordion-down": {
          from: { height: "0px" }, // Ensure 0px for newer Tailwind/browsers
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0px" }, // Ensure 0px for newer Tailwind/browsers
        },
        "rolling-gradient-dark": {
          "0%": { backgroundPosition: "0% 0%" },
          "50%": { backgroundPosition: "100% 100%" },
          "100%": { backgroundPosition: "0% 0%" },
        },
        "rolling-gradient-light": {
          "0%": { backgroundPosition: "0% 0%" },
          "50%": { backgroundPosition: "100% 100%" },
          "100%": { backgroundPosition: "0% 0%" },
        },
        "subtle-glow": {
          "0%, 100%": { filter: "drop-shadow(0 0 2px hsl(var(--glow-color-start))) var(--tw-blur, ) var(--tw-brightness, ) var(--tw-contrast, ) var(--tw-grayscale, ) var(--tw-hue-rotate, ) var(--tw-invert, ) var(--tw-saturate, ) var(--tw-sepia, )", opacity: "0.7" },
          "50%": { filter: "drop-shadow(0 0 8px hsl(var(--glow-color-end))) var(--tw-blur, ) var(--tw-brightness, ) var(--tw-contrast, ) var(--tw-grayscale, ) var(--tw-hue-rotate, ) var(--tw-invert, ) var(--tw-saturate, ) var(--tw-sepia, )", opacity: "1" },
        },
         "button-hover-glow": {
          "0%": { boxShadow: "0 0 5px hsl(var(--primary) / 0.3), 0 0 10px hsl(var(--primary) / 0.2)" },
          "100%": { boxShadow: "0 0 10px hsl(var(--primary) / 0.5), 0 0 20px hsl(var(--primary) / 0.3)" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        "rolling-gradient-dark": "rolling-gradient-dark 25s ease infinite",
        "rolling-gradient-light": "rolling-gradient-light 30s ease infinite",
        "subtle-glow": "subtle-glow 2.5s infinite alternate ease-in-out",
        "button-hover-glow": "button-hover-glow 0.3s ease-out forwards", 
      },
      backgroundImage: {
        'brand-gradient': "linear-gradient(to right, var(--baulytics-gradient-start), var(--baulytics-gradient-mid), var(--baulytics-gradient-end))",
        // For rolling gradients, the actual multi-color gradient will be defined in globals.css for better control over stops and complexity
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
} satisfies Config

export default config
