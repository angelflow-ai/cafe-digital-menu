/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ["Inter", "ui-sans-serif", "system-ui"],
        display: ["Playfair Display", "Georgia", "serif"]
      },
      boxShadow: {
        glass: "0 24px 70px rgba(67, 45, 28, 0.18)"
      }
    }
  },
  plugins: []
};

