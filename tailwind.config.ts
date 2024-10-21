// tailwind.config.js

module.exports = {
  content: [
    "./app/**/*.{js,jsx}",
    "./src/**/*.{js,jsx}",
    "./pages/**/*.{js,jsx}",
    "./components/**/*.{js,jsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          light: '#a78bfa',
          DEFAULT: '#8b5cf6',
          dark: '#6d28d9',
        },
        secondary: {
          light: '#c084fc',
          DEFAULT: '#a855f7',
          dark: '#9333ea',
        },
        accent: {
          light: '#c4b5fd',
          DEFAULT: '#a78bfa',
          dark: '#8b5cf6',
        },
      },
      fontFamily: {
        metropolis: ['"Metropolis"', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
