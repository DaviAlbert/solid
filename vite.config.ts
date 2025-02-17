import { defineConfig } from 'vitest/config'
import tsconfigPaths from 'vite-tsconfig-paths'

export default defineConfig({
  plugins: [tsconfigPaths()],
  test: {
    environmentMatchGlobs: [['src/http/controllers/**', 'node']],
    environment: 'node',
    exclude: ['node_modules', 'dist', 'build', 'prisma'],
  },
  server: {
    fs: {
      allow: ['.'],
    },
  },
})