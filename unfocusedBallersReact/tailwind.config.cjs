/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ["Space Grotesk", "ui-sans-serif", "system-ui"]
      },
      colors: {
        pitch: {
          50: "#f2f7f4",
          100: "#dbe9e1",
          200: "#b8d3c4",
          300: "#8eb79f",
          400: "#6a9d7d",
          500: "#4d7f61",
          600: "#3d654e",
          700: "#2f4d3c",
          800: "#23382c",
          900: "#17241c"
        }
      },
      boxShadow: {
        soft: "0 20px 50px -30px rgba(0,0,0,0.35)",
        card: "0 14px 40px -28px rgba(0,0,0,0.4)"
      },
      keyframes: {
        float: {
          "0%, 100%": { transform: "translateY(0px)" },
          "50%": { transform: "translateY(-10px)" }
        },
        shimmer: {
          "0%": { backgroundPosition: "0% 50%" },
          "100%": { backgroundPosition: "100% 50%" }
        }
      },
      animation: {
        float: "float 6s ease-in-out infinite",
        shimmer: "shimmer 12s linear infinite"
      }
    }
  },
  plugins: []
};
