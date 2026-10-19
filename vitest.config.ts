import { defineConfig } from "vitest/config";
import path from "node:path";

export default defineConfig({
  test: { include: ["test/**/*.test.ts"], testTimeout: 30000 },
  resolve: {
    alias: {
      // `server-only` 는 react-server 조건 밖에서 의도적으로 throw 한다(gambitry 동일 스텁).
      "server-only": path.resolve(__dirname, "test/stubs/server-only.ts"),
      "@": path.resolve(__dirname),
    },
  },
});
