import js from "@eslint/js";
import { defineConfig } from "eslint/config";
import prettier from "eslint-config-prettier";
import vue from "eslint-plugin-vue";
import globals from "globals";
import tseslint from "typescript-eslint";

export default defineConfig(
  { ignores: ["**/dist/", "**/coverage/", ".netlify/", "evals/results/"] },

  js.configs.recommended,
  // Not the type-checked preset: tsc/vue-tsc already catch type errors, and type-aware lint doubles lint time.
  ...tseslint.configs.recommended,
  ...vue.configs["flat/recommended"],

  {
    files: ["**/*.vue"],
    languageOptions: {
      parserOptions: { parser: tseslint.parser },
      globals: globals.browser,
    },
  },
  {
    files: ["netlify/**", "evals/**", "packages/**", "*.config.{js,ts}"],
    languageOptions: { globals: globals.node },
  },

  {
    linterOptions: { reportUnusedDisableDirectives: "error" },
    rules: {
      "@typescript-eslint/no-explicit-any": "error",
      "@typescript-eslint/naming-convention": [
        "error",
        { selector: "default", format: ["camelCase"], leadingUnderscore: "allow" },
        // PascalCase: Zod schemas (`const ElectricityBill = z.object(...)`) and imported Vue components
        { selector: "variable", format: ["camelCase", "UPPER_CASE", "PascalCase"] },
        { selector: "import", format: null },
        { selector: "typeLike", format: ["PascalCase"] },
        { selector: "enumMember", format: ["PascalCase"] },
        // Keys come from external formats: tariff JSON, API wire format (max_tokens), p1/p2/p3, HTTP headers
        { selector: ["objectLiteralProperty", "typeProperty"], format: null },
      ],
      "vue/component-definition-name-casing": ["error", "PascalCase"],
      "vue/multi-word-component-names": "error",
    },
  },

  // Last: turns off every stylistic rule that would fight Prettier
  prettier,
);
