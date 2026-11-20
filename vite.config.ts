import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// `--mode artifact` builds fixed-name files for publishing as a claude.ai artifact (see artifact/).
export default defineConfig(({ mode }) => ({
  plugins: [react()],
  ...(mode === 'artifact' && {
    base: './',
    build: {
      outDir: 'artifact/dist',
      emptyOutDir: true,
      rollupOptions: { output: { entryFileNames: 'app.js', assetFileNames: 'app.[ext]' } },
    },
  }),
}));
