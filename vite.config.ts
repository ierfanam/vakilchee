import path from 'path';
import { defineConfig, loadEnv } from 'vite';

export default defineConfig(({ mode }) => {
  // Keep the Gemini credential on the server. The browser receives only a
  // short-lived Live API token through /api/live-token.
  loadEnv(mode, '.', '');

  return {
    server: {
      port: 3000,
      host: '0.0.0.0',
    },
    plugins: [],
    define: {
      // index.tsx already reads process.env.GEMINI_API_KEY when creating the
      // Live client. Redirect that read to a runtime token instead of embedding
      // a long-lived API key into the Vite bundle.
      'process.env.API_KEY': 'globalThis.__VAKILCHEE_LIVE_TOKEN__ || ""',
      'process.env.GEMINI_API_KEY': 'globalThis.__VAKILCHEE_LIVE_TOKEN__ || ""',
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
  };
});
