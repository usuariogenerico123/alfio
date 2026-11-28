import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'



export default defineConfig({
  
  plugins: [react(), tailwindcss()],
  envPrefix: ['VITE_', 'POLLLAR_', 'POLLAR_'],
  server:{
    allowedHosts:[
      
      "lwhqw-135-237-130-226.run.pinggy-free.link"
    ]
  },
  
})
