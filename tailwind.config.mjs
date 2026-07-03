export default {
  content: ["./src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}"],
  theme: {
    extend: {
      colors: {
        ink: "#f3efe6",
        smoke: "#99938a",
        void: "#060605",
        acid: "#ecff29",
        ember: "#ff4f2f",
        pool: "#00d5ff",
        violet: "#8d5cff",
      },
      fontFamily: {
        display: ["Arial Black", "Impact", "Haettenschweiler", "Arial Narrow Bold", "sans-serif"],
        sans: ["Inter", "ui-sans-serif", "system-ui", "sans-serif"],
        mono: ["ui-monospace", "SFMono-Regular", "Menlo", "monospace"],
      },
      transitionTimingFunction: {
        expo: "cubic-bezier(0.16, 1, 0.3, 1)",
      },
    },
  },
  plugins: [],
};
