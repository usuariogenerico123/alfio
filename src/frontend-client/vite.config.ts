import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  envPrefix: ['VITE_', 'POLLLAR_', 'POLLAR_'],
  server:{
    allowedHosts:[
      "nmsby-135-237-130-224.run.pinggy-free.link"
    ]
  }
})
