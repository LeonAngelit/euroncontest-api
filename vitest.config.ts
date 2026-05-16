import { defineConfig } from "vitest/config"; // <--- Ad// vitest.config.ts

export default defineConfig({
  test: {
    environment: "node", // Ensure this is set to node
  },
});
