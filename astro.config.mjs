// @ts-check
import { defineConfig } from 'astro/config';

// https://astro.build/config
export default defineConfig({
  output: 'server', // SSR para deployment en Vercel
  vite: {
    envPrefix: 'PUBLIC_'
  }
});