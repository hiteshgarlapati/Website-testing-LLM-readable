import { defineConfig } from 'astro/config';
import vercel from '@astrojs/vercel';

// https://astro.build/config
export default defineConfig({
  // Server-rendered so admin edits reflect on the live site instantly
  output: 'server',
  adapter: vercel(),
  site: 'https://oaklinefurniture.example',
});
