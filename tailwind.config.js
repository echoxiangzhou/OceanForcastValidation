/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        ocean: {
          deep: '#0c2d48',
          primary: '#145da0', 
          secondary: '#2e8bc0',
          light: '#b1d4e0',
          pale: '#e8f4f8',
        },
        success: {
          ocean: '#059669'
        },
        warning: {
          ocean: '#d97706'
        },
        error: {
          ocean: '#dc2626'
        }
      },
      fontFamily: {
        sans: ['-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'Helvetica Neue', 'Arial', 'sans-serif']
      }
    },
  },
  plugins: [],
}