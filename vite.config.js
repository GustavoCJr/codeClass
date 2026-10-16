import vue from '@vitejs/plugin-vue'
import { defineConfig } from 'vite'
import { readdirSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

// https://vite.dev/config/
export default defineConfig({
  plugins: [vue()],
  build: {
    rollupOptions: {
      input: readdirSync(fileURLToPath(new URL('.', import.meta.url)))
        .filter(file => file.endsWith('.html'))
        .map(file => fileURLToPath(new URL(file, import.meta.url)))
    }
  },
})
