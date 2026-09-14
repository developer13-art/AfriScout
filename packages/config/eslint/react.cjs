module.exports = {
  root: false,
  extends: [
    "./base.cjs",
    "plugin:react/recommended",
    "plugin:react-hooks/recommended",
    "plugin:jsx-a11y/recommended",
  ],
  plugins: ["react", "react-hooks", "jsx-a11y"],
  settings: {
    react: { version: "detect" },
  },
  rules: {
    "react/react-in-jsx-scope": "off",
    "react/prop-types": "off",
    "react/jsx-uses-react": "off",
  },
  ignorePatterns: ["dist", "node_modules", "*.cjs", "*.config.*"],
};