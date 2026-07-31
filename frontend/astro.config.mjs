import { defineConfig } from 'astro/config';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const __dirname = fileURLToPath(new URL('.', import.meta.url));
const backendPath = path.resolve(__dirname, '../backend');

// https://astro.build/config
export default defineConfig({
  output: 'static',
  site: 'https://oaklinefurniture.example',
  vite: {
    server: {
      fs: {
        allow: [__dirname, backendPath]
      }
    }
  }
});
