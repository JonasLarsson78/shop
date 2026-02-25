import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

// https://vite.dev/config/
export default defineConfig({
  plugins: [vue()],
  server: {
    proxy: {
      '/api': 'http://localhost:3000',
    },
  },
  css: {
    preprocessorOptions: {
      scss: {
        additionalData: '@use "/src/styles/variables" as *;\n@use "/src/styles/mixins" as *;\n',
      },
    },
  },
})
