/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        dark: {
          bg: '#121212',
          card: '#1e1e1e',
          border: '#2d2d2d',
          hover: '#252525',
        },
        accent: '#0073EA',
        accentHover: '#0062c7',
      },
      fontFamily: {
        sans: ['Segoe UI', 'Roboto', 'system-ui', 'sans-serif'],
      },
      borderRadius: {
        monday: '8px',
      },
      spacing: {
        sidebar: '260px',
      },
    },
  },
  plugins: [],
};
