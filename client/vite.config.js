import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import fs from 'fs';
import path from 'path';

export default defineConfig({
  plugins: [
    react(),
    {
      name: 'copy-sw',
      writeBundle() {
        const srcSw = path.resolve(__dirname, 'src/sw.js');
        const distSw = path.resolve(__dirname, 'dist/sw.js');
        let sw = fs.readFileSync(srcSw, 'utf-8');
        // Inject build timestamp so the browser sees a new SW file every deploy
        sw = sw.replace('__BUILD_TIME__', Date.now().toString());
        fs.writeFileSync(distSw, sw);
      },
    },
  ],
  server: {
    port: 3000,
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
      },
    },
  },
});
