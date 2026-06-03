import { defineConfig } from "vite";
import vituum from "vituum";
import nunjucks from "@vituum/vite-plugin-nunjucks";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  plugins: [
    vituum(),
    nunjucks({
      root: "./src",
    }),
    tailwindcss(),
  ],
  build: {
    rollupOptions: {
      input: [
        "src/pages/index.njk",
        "src/pages/kohvisordid.njk",
        "src/pages/detail.njk",
        "src/pages/kontakt.njk",
        "src/pages/tellimus.njk",
      ],
    },
  },
});
