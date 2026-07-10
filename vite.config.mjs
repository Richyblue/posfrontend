import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import legacy from '@vitejs/plugin-legacy'
import path from 'node:path'
import autoprefixer from 'autoprefixer'

export default defineConfig(() => {
  return {
    base: './',

    build: {
      outDir: 'build',

      // Support older browsers
      target: 'es2015',
    },

    css: {
      postcss: {
        plugins: [autoprefixer({})],
      },
    },

    plugins: [
      react(),

      legacy({
        targets: ['defaults', 'Android >= 5', 'Chrome >= 49', 'Safari >= 10', 'Edge >= 15'],

        modernPolyfills: true,

        renderLegacyChunks: true,
      }),
    ],

    resolve: {
      alias: [
        {
          find: 'src/',
          replacement: `${path.resolve(__dirname, 'src')}/`,
        },
      ],

      extensions: ['.mjs', '.js', '.ts', '.jsx', '.tsx', '.json', '.scss'],
    },

    server: {
      host: true,

      port: 3000,

      proxy: {
        // https://vitejs.dev/config/server-options.html
      },
    },
  }
})
