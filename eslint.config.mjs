import { FlatCompat } from "@eslint/eslintrc";

// eslint-config-next@14 only ships legacy eslintrc-style configs (`extends: [...]`),
// not flat-config arrays — FlatCompat converts them. This also avoids the `eslint/config`
// helper module (defineConfig/globalIgnores), which only exists on ESLint v9+
// (this project pins ESLint 8.57.1).
const compat = new FlatCompat({ baseDirectory: import.meta.dirname });

const eslintConfig = [
  ...compat.extends("next/core-web-vitals", "next/typescript"),
  {
    ignores: [".next/**", "out/**", "build/**", "next-env.d.ts"],
  },
];

export default eslintConfig;
