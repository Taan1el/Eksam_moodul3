import { defineConfig } from "vite";
import vituum from "vituum";
import nunjucks from "@vituum/vite-plugin-nunjucks";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig(({ command }) => ({
  // Dev serves at "/", production build is hosted at the combined repo's GitHub Pages subpath.
  base: command === "build" ? "/Multimeedia_eksam/" : "/",
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
        "src/pages/kkk.njk",
        "src/pages/tarne.njk",
        "src/pages/tagastus.njk",
        "src/pages/kohvik.njk",
        "src/pages/meie-lugu.njk",
        "src/pages/rostimisprotsess.njk",
        "src/pages/paritolu.njk",
      ],
    },
  },
}));
