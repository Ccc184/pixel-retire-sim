import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  base: './',
  plugins: [vue(), tailwindcss()],
  build: {
    emptyOutDir: true,
    rollupOptions: {
      output: {
        manualChunks(id: string) {
          // Vue 运行时 + Pinia 状态管理 → 独立 vendor chunk
          if (id.includes('node_modules/vue') || id.includes('node_modules/pinia') || id.includes('node_modules/@vue')) {
            return 'vendor'
          }
          // 字体文件
          if (id.includes('@fontsource/dotgothic16')) {
            return 'font'
          }
        },
      },
    },
  },
})