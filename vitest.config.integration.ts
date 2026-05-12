import path from "path"
import { defineConfig } from "vitest/config"

export default defineConfig({
  test: {
    environment: "node",
    globals: true,
    setupFiles: ["./src/__tests__/setup.integration.ts"],
    include: ["src/__tests__/integration/**/*.integration.test.ts"],
    fileParallelism: false,
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
})
