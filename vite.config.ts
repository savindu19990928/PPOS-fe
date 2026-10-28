import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');

  return {
    plugins: [react()],
    base: "./",
    define: {
      'import.meta.env.GITHUB_TOKEN': JSON.stringify(env.GITHUB_TOKEN || '')
    },
    build: {
      outDir: "dist",
      target: "chrome108"
    }
  };
});
