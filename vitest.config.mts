import { fileURLToPath } from "node:url"
import { defineConfig } from "vitest/config"

export default defineConfig({
  test: {
    // These tests exercise plain modules, not React components — no DOM needed.
    environment: "node",
    include: ["src/**/*.test.ts"],
  },
  resolve: {
    // Mirror the "@/*" path alias from tsconfig.json.
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
})
