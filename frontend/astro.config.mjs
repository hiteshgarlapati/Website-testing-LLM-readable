import { defineConfig } from 'astro/config';
import vercel from '@astrojs/vercel';
import { fileURLToPath } from 'node:url';

const __dirname = fileURLToPath(new URL('.', import.meta.url));

// https://astro.build/config
export default defineConfig({
  // Server-rendered so admin edits reflect on the live site instantly
  output: 'server',
  adapter: vercel(),
  site: 'https://oaklinefurniture.example',
  vite: {
    server: {
      fs: {
        allow: [__dirname]
      }
    }
  }
});
