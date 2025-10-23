// @ts-check
import { defineConfig } from 'astro/config';

import vercel from '@astrojs/vercel';

// https://astro.build/config
export default defineConfig({
  // SSR para deployment en Vercel
  output: 'server',

  vite: {
    envPrefix: 'PUBLIC_'
  },

  adapter: vercel()
});