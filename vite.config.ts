import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// https://vitejs.dev/config/
export default defineConfig({
  base: "./",
  plugins: [react()],
  server: {
    watch: {
      ignored: ["**/dist.rar", "**/dist.zip", "**/*.rar", "**/*.zip", "**/dist/**"],
    },
  },
  build: {
    outDir: "dist",
    emptyOutDir: true,
  },
});
