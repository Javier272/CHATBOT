import { defineConfig } from 'vite'
import react, { reactCompilerPreset } from '@vitejs/plugin-react'
import babel from '@rolldown/plugin-babel'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    babel({ presets: [reactCompilerPreset()] })
  ],
  server: {
    host: true, // Esto es equivalente a '0.0.0.0' (Acepta conexiones externas)
    port: 5173, // Nos aseguramos de que siempre corra en este puerto
    strictPort: true
  }
})
