import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

import { nodePolyfills } from 'vite-plugin-node-polyfills';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, '.', '');
  return {
    server: {
      port: 3000,
      host: '0.0.0.0',
      proxy: {
        '/api/dexscreener': {
          target: 'https://api.dexscreener.com/latest/dex',
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/api\/dexscreener/, ''),
        },
        '/api/geckoterminal': {
          target: 'https://api.geckoterminal.com/api/v2',
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/api\/geckoterminal/, ''),
        },
        '/api/coingecko': {
          target: 'https://api.coingecko.com/api/v3',
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/api\/coingecko/, ''),
        },
      },
    },
    plugins: [
      react(),
      nodePolyfills({
        globals: {
          Buffer: true,
          global: true,
          process: true,
        },
      }),
    ],
    define: {
      'process.env.API_KEY': JSON.stringify(env.GEMINI_API_KEY),
      'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY)
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
        // Fix for @uniswap/widgets using ~ prefix for imports
        '~@fontsource': path.resolve(__dirname, 'node_modules/@fontsource'),
      }
    }
  };
});
