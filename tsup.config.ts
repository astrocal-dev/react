import { defineConfig } from "tsup";

export default defineConfig({
  entry: { index: "src/index.ts" },
  format: ["esm"],
  outDir: "dist",
  dts: true,
  sourcemap: true,
  target: "es2020",
  external: ["react", "react-dom", "@astrocal/widget"],
  esbuildOptions(options) {
    options.jsx = "automatic";
    options.jsxImportSource = "react";
  },
});
