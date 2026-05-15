import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: "#002666",
        "on-primary": "#ffffff",
        "primary-container": "#1d3d81",
        "on-primary-container": "#8fabf6",
        secondary: "#3c6a00",
        "on-secondary": "#ffffff",
        "secondary-container": "#b1f669",
        "on-secondary-container": "#407100",
        tertiary: "#481f00",
        "on-tertiary": "#ffffff",
        "tertiary-container": "#6a3000",
        "on-tertiary-container": "#ed9861",
        error: "#ba1a1a",
        "on-error": "#ffffff",
        "error-container": "#ffdad6",
        "on-error-container": "#93000a",
        background: "#f8f9ff",
        "on-background": "#0b1c30",
        surface: "#f8f9ff",
        "on-surface": "#0b1c30",
        "surface-variant": "#d3e4fe",
        "on-surface-variant": "#444650",
        outline: "#747782",
        "outline-variant": "#c4c6d2",
        "inverse-surface": "#213145",
        "inverse-on-surface": "#eaf1ff",
        "inverse-primary": "#b2c5ff",
        "surface-bright": "#f8f9ff",
        "surface-dim": "#cbdbf5",
        "surface-container-lowest": "#ffffff",
        "surface-container-low": "#eff4ff",
        "surface-container": "#e5eeff",
        "surface-container-high": "#dce9ff",
        "surface-container-highest": "#d3e4fe",
        "surface-border": "#E2E8F0",
        brand: {
          ep: {
            light: "#67B230",
            dark: "#0D8541",
            blue: "#0768B3",
          },
          pedfor: {
            purple: "#AB58B3",
            blue: "#0C6BAF",
            green: "#65B42E",
          }
        }
      },
      spacing: {
        "stack-sm": "8px",
        "stack-md": "16px",
        "stack-lg": "24px",
        "unit": "4px",
        "margin-mobile": "16px",
        "margin-desktop": "32px",
        "gutter": "24px",
        "container-max": "1280px",
      },
      fontFamily: {
        sans: ["Inter", "sans-serif"],
        display: ["Inter", "sans-serif"],
      },
      borderRadius: {
        DEFAULT: "0.125rem",
        lg: "0.25rem",
        xl: "0.5rem",
        full: "0.75rem"
      },
    },
  },
  plugins: [],
};
export default config;
