import type { Config } from "tailwindcss";
import preset from "../../packages/config/tailwind/preset.js";

const config: Config = {
  presets: [preset as Config],
  content: [
    "./index.html",
    "./src/**/*.{ts,tsx,html}",
  ],
  darkMode: "class",
  theme: {
    extend: {},
  },
  plugins: [],
};

export default config;