/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        monday: {
          bg: '#f5f6f8',
          surface: '#ffffff',
          primary: '#0073ea',
          border: '#d0d4e4',
          text: '#323338',
          textMuted: '#676879',
          hover: '#e6e9ef',
        },
        dark: {
          bg: '#121212',
          card: '#1e1e1e',
          border: '#2d2d2d',
          hover: '#252525',
        },
        accent: '#0073ea',
        accentHover: '#0062c7',
      },
      fontFamily: {
        sans: ['Roboto', 'Inter', 'system-ui', 'sans-serif'],
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
