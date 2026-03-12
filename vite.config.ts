import path from 'path';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  server: {
    host: '0.0.0.0',
    port: 5000,
    allowedHosts: true,
    proxy: {
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true,
      },
    },
  },
  plugins: [react()],
  resolve: {
    alias: {
      '@/common': path.resolve(__dirname, 'src/components/common'),
      '@/effects': path.resolve(__dirname, 'src/components/effects'),
      '@/extras': path.resolve(__dirname, 'src/components/extras'),
      '@/food-merge': path.resolve(__dirname, 'src/components/food-merge'),
      '@/layout': path.resolve(__dirname, 'src/components/layout'),
      '@/matchmaker': path.resolve(__dirname, 'src/components/matchmaker'),
      '@/memories': path.resolve(__dirname, 'src/components/memories'),
      '@/message-board': path.resolve(__dirname, 'src/components/message-board'),
      '@/quiz': path.resolve(__dirname, 'src/components/quiz'),
      '@/snake': path.resolve(__dirname, 'src/components/snake'),
      '@/ui': path.resolve(__dirname, 'src/components/ui'),
      '@/hooks': path.resolve(__dirname, 'src/hooks'),
      '@/context': path.resolve(__dirname, 'src/context'),
      '@/services': path.resolve(__dirname, 'src/services'),
      '@/utils': path.resolve(__dirname, 'src/utils'),
      '@/integrations': path.resolve(__dirname, 'src/integrations'),
      '@': path.resolve(__dirname, 'src'),
    },
  },
});
