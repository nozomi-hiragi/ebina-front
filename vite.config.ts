import { defineConfig } from "vite";
import solid from "vite-plugin-solid";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  base: "/ebina-station/",
  plugins: [solid(), tailwindcss()],
  build: {
    outDir: "build",
  },
});
