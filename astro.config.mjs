import { defineConfig } from "astro/config";
import tailwind from "@astrojs/tailwind";

export default defineConfig({
  site: "https://fefhog.github.io/Music-Portrait",
  integrations: [
    tailwind({
      applyBaseStyles: false,
    }),
  ],
  server: {
    host: "127.0.0.1",
    port: 4173,
  },
  vite: {
    build: {
      assetsInlineLimit: 0,
    },
  },
});
