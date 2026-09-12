import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    // host:true lets other POS computers on the local network open the dev UI.
    host: true,
    port: 5173,
    proxy: {
      '/api': { target: process.env.VITE_API_TARGET || 'http://localhost:4000', changeOrigin: true },
      '/uploads': { target: process.env.VITE_API_TARGET || 'http://localhost:4000', changeOrigin: true },
    },
  },
});
