import { FlatCompat } from "@eslint/eslintrc";
import path from "node:path";
import { fileURLToPath } from "node:url";

const baseDirectory = path.dirname(fileURLToPath(import.meta.url));
const compat = new FlatCompat({ baseDirectory });

const config = [
  {
    ignores: [
      ".next/**",
      ".next-dev/**",
      ".netlify/**",
      ".vercel/**",
      ".agents/**",
      ".autopilot/**",
      "skills/**",
      "automation/**",
      "node_modules/**",
      "prisma/dev.db*",
      "next-env.d.ts",
      "*.js",
      "scripts/**",
    ],
  },
  ...compat.extends("next/core-web-vitals", "next/typescript"),
];

export default config;
