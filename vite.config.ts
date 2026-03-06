import path from 'path';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(() => ({
  server: {
    host: '0.0.0.0',
    port: 5000,
    allowedHosts: [
      '85113a97-8fd7-4ce3-bc9f-0ca7e2ce9d86-00-vnrhd25othwb.spock.replit.dev',
    ],
  },
  plugins: [react()],
  resolve: {
    alias: {
      '@/common': path.resolve(__dirname, 'src/components/common'),
      '@/effects': path.resolve(__dirname, 'src/components/effects'),
      '@/extras': path.resolve(__dirname, 'src/components/extras'),
      '@/food-drop': path.resolve(__dirname, 'src/components/food-drop'),
      '@/layout': path.resolve(__dirname, 'src/components/layout'),
      '@/matchmaker': path.resolve(__dirname, 'src/components/matchmaker'),
      '@/memories': path.resolve(__dirname, 'src/components/memories'),
      '@/message-board': path.resolve(__dirname, 'src/components/message-board'),
      '@/quiz': path.resolve(__dirname, 'src/components/quiz'),
      '@/snake': path.resolve(__dirname, 'src/components/snake'),
      '@/ui': path.resolve(__dirname, 'src/components/ui'),
      '@': path.resolve(__dirname, 'src'),
    },
  },
}));
