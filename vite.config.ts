import path from 'path';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(() => ({
  server: {
    host: '0.0.0.0',
    port: 5000,
    allowedHosts: ['85113a97-8fd7-4ce3-bc9f-0ca7e2ce9d86-00-vnrhd25othwb.spock.replit.dev'],
  },
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, '.'),
    },
  },
}));
