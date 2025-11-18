/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,jsx,ts,tsx}",
    "./components/**/*.{js,jsx,ts,tsx}"
  ],

  presets: [require("nativewind/preset")],

  theme: {
    extend: {
      fontFamily: {
        roboto: "Roboto",
        "roboto-medium": "Roboto-Medium",
        "roboto-bold": "Roboto-Bold",
      },

      colors: {
        primary: {
          100: '#FBF0E9',
          200: '#F9E8DF',
          300: '#F4D0BC',
          400: '#DA6727',
          500: '#C45D23',
          600: '#AE521F',
          700: '#A44D1D',
          800: '#833E17',
          900: '#622E12',
          1000: '#4C240E'
        },

        neutral: {
          100: '#FFFFFF',
          200: '#F6F6F6',
          300: '#F2F1F1',
          400: '#E4E3E2',
          500: '#A9A4A2',
          600: '#989492',
          700: '#878382',
          800: '#7F7B7A',
          900: '#656261',
          1000: '#4C4A49',
          1100: '#3B3939',
          1200: '#000000'
        }
      }
    },
  },

  plugins: [],
};
