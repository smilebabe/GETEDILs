import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  root: './',
  resolve: {
    alias: {
      '@hooks': path.resolve(__dirname, 'src/hooks'),
      '@core': path.resolve(__dirname, 'src/core'),
      '@lib': path.resolve(__dirname, 'src/lib'),
      '@components': path.resolve(__dirname, 'src/components'),
      '@store': path.resolve(__dirname, 'src/store'),
      '@styles': path.resolve(__dirname, 'src/styles'),
    },
    // Ensure Rollup/Vite resolves these extensions automatically
    extensions: ['.js', '.jsx', '.ts', '.tsx', '.json']
  },
  build: {
    outDir: 'dist',
    sourcemap: true,
    rollupOptions: {
      external: []
    }
  },
  server: {
    port: 3000,
    open: true
  }
})
