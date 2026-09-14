const tokens = require("./tokens.js");

/** @type {import('tailwindcss').Config} */
module.exports = {
  theme: {
    extend: {
      colors: tokens.colors,
      fontFamily: tokens.fontFamily,
      borderRadius: tokens.borderRadius,
      boxShadow: tokens.boxShadow,
    },
  },
  plugins: [],
};