module.exports = {
  root: false,
  extends: ["../../packages/config/eslint/node.cjs"],
  parserOptions: {
    project: ["./tsconfig.json"],
    tsconfigRootDir: __dirname,
  },
  ignorePatterns: ["dist", "node_modules", "*.cjs", "*.config.*"],
};