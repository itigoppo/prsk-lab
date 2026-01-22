import { FlatCompat } from "@eslint/eslintrc"
import next from "@next/eslint-plugin-next"
import perfectionist from "eslint-plugin-perfectionist"
import { dirname } from "path"
import { fileURLToPath } from "url"
import requireUseClient from "./eslint-rules/require-use-client.js"

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

const compat = new FlatCompat({
  baseDirectory: __dirname,
})

const eslintConfig = [
  ...compat.extends("next", "next/core-web-vitals", "next/typescript", "prettier"),

  {
    ignores: [
      "node_modules/**",
      ".next/**",
      "out/**",
      "build/**",
      "next-env.d.ts",
      "prisma/**",
      "postgres/**",
      "docker-compose.yaml",
      "**/*.yml",
      "**/*.yaml",
      "**/*.json",
      "**/*.mjs",
      "src/lib/api/generated/**", // Orval自動生成ファイル
    ],
  },

  {
    files: ["src/**/*.{js,ts,tsx}"],
    plugins: {
      perfectionist,
      next,
      custom: {
        rules: {
          "require-use-client": requireUseClient,
        },
      },
    },
    rules: {
      ...next.configs["core-web-vitals"].rules,
      "custom/require-use-client": "error",
      "no-console": "warn",
      "@typescript-eslint/no-unused-vars": [
        "warn",
        {
          argsIgnorePattern: "^_",
          varsIgnorePattern: "^_",
        },
      ],

      "perfectionist/sort-objects": [
        "warn",
        {
          type: "natural",
          order: "asc",
          ignoreCase: true,
        },
      ],
      "perfectionist/sort-interfaces": [
        "warn",
        {
          type: "natural",
          order: "asc",
          ignoreCase: true,
        },
      ],
      "perfectionist/sort-object-types": [
        "warn",
        {
          type: "natural",
          order: "asc",
          ignoreCase: true,
        },
      ],
      "perfectionist/sort-enums": [
        "warn",
        {
          type: "natural",
          order: "asc",
          ignoreCase: true,
        },
      ],
    },
  },
]

export default eslintConfig
