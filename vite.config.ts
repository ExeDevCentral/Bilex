import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    chunkSizeWarningLimit: 500,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('pdfjs-dist')) {
            return 'vendor-pdfjs';
          }
          if (id.includes('tesseract.js')) {
            return 'vendor-tesseract';
          }
          if (id.includes('html2canvas')) {
            return 'vendor-html2canvas';
          }
          if (id.includes('jspdf')) {
            return 'vendor-jspdf';
          }
          if (id.includes('lucide-react')) {
            return 'vendor-icons';
          }
        },
      },
    },
  },
})
