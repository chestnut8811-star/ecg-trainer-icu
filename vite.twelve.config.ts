import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { viteSingleFile } from 'vite-plugin-singlefile'

// 12誘導版を単一HTML(dist-twelve/twelve.html)としてビルドする独立設定
export default defineConfig({
  plugins: [react(), tailwindcss(), viteSingleFile()],
  build: {
    outDir: 'dist-twelve',
    rollupOptions: { input: 'twelve.html' },
  },
})
