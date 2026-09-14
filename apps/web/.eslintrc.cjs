module.exports = {
  root: false,
  extends: ["../../packages/config/eslint/react.cjs"],
  parserOptions: {
    project: ["./tsconfig.json"],
    tsconfigRootDir: __dirname,
  },
  ignorePatterns: ["dist", "node_modules", "*.config.*", "*.cjs"],
};