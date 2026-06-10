import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { viteSingleFile } from 'vite-plugin-singlefile'

// viteSingleFile: ビルド時にJS/CSSをすべてindex.htmlへインライン化し、
// file://(ダブルクリック)でそのまま開ける単一HTMLを出力する
export default defineConfig({
  plugins: [react(), tailwindcss(), viteSingleFile()],
})
