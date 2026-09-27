import { defineConfig, type Options } from "tsup";
import { existsSync, mkdirSync, copyFileSync } from "node:fs";

const isProd = process.env.NODE_ENV === "production" || process.argv.includes("--prod");
const config: Options = {
  minify: isProd,
  sourcemap: !isProd,
};

export default defineConfig([
  {
    entry: ["src/ts/index.ts", "src/ts/utils.ts", "src/ts/modules.ts", "src/ts/adapters/vanilla.ts", "src/ts/adapters/react.ts"],
    format: ["cjs", "esm"],
    dts: true,
    clean: true,
    ...config,
    async onSuccess() {
      const keys = ["time-travel-console"];
      keys.forEach((key) => {
        const source = `src/css/${key}.css`;
        if (existsSync(source)) mkdirSync("dist/styles", { recursive: true }), copyFileSync(source, `dist/styles/${key}.css`), console.log(`✅ ${key} CSS stylesheet copied!`);
      });
    },
  },
  {
    entry: ["src/ts/super.ts"],
    format: ["iife"], // browser courtesy: use esm.sh if u want this for modules
    globalName: "sia",
    external: ["react"],
    dts: true,
    env: { NODE_ENV: isProd ? "production" : "development" },
    ...config,
  },
]);
