module.exports = {
  root: true,
  ignorePatterns: ["dist", "node_modules", ".svelte-kit", ".vercel"],
  overrides: [
    {
      files: ["**/*.ts", "**/*.js", "**/*.svelte"],
      parser: "@typescript-eslint/parser",
      plugins: ["@typescript-eslint"],
      env: {
        browser: true,
        node: true,
        es2021: true
      },
      extends: ["eslint:recommended", "plugin:@typescript-eslint/recommended", "prettier"],
      rules: {
        "@typescript-eslint/no-unused-vars": ["warn", { "argsIgnorePattern": "^_" }],
        "no-restricted-imports": [
          "error",
          {
            "patterns": [
              { "group": ["apps/*"], "message": "Apps cannot be imported by services/shared" },
              { "group": ["services/*"], "message": "Cross-service imports not allowed; use shared/libs or contracts" }
            ]
          }
        ]
      }
    }
  ]
};
