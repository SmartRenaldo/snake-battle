import { defineConfig } from "vite";

export default defineConfig({
  test: {
    setupFiles: "./vitest.setup.ts",
    environment: "jsdom",
  },
});
