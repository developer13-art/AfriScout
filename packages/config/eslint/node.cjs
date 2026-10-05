module.exports = {
  root: false,
  extends: ["./base.cjs"],
  env: { node: true, es2022: true },
  ignorePatterns: ["dist", "node_modules", "*.cjs", "*.config.*"],
};