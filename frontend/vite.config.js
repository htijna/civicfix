import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  build: {
    target: 'esnext',
    cssCodeSplit: true,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules')) {
            if (id.includes('jspdf') || id.includes('html2canvas') || id.includes('purify')) {
              return 'pdf-exporter';
            }
            if (id.includes('leaflet') || id.includes('react-leaflet')) {
              return 'map-vendor';
            }
            if (id.includes('recharts')) {
              return 'charts-vendor';
            }
            if (id.includes('react-easy-crop')) {
              return 'cropper-vendor';
            }
            if (id.includes('lucide-react')) {
              return 'icons-vendor';
            }
            return 'vendor';
          }
        }
      }
    }
  }
});

