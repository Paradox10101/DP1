import type { Config } from "tailwindcss";
import plugin from 'tailwindcss/plugin'

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        principal: "#1A37A1",
        negro: "#000",
        blanco: "#fff",
        grisFondo: "#F4F4F4",
        capacidadDisponible: "#2ACF58",
        capacidadSaturada: "#FFA500",
        capacidadLlena: "#EF180A",
        placeholder: "#939393"
      },

    },

  },
  plugins: [
    plugin(function({addUtilities}){
      const newUtilites = {
        '.regular_bold':{
          fontSize: '16px',
          fontWeight: 'bold'
        },
        '.regular':{
          fontSize: '16px',
        },
        '.subEncabezado':{
          fontSize: '22px',
        },
        '.encabezado':{
          fontSize: '18px',
          fontWeight: 'bold'
        },



      }
      addUtilities(newUtilites)
    })


  ],
};
export default config;