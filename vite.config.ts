import { defineConfig } from 'vitest/config'
import tsconfigPaths from 'vite-tsconfig-paths'

export default defineConfig({
  plugins: [tsconfigPaths()],
  test: {
    globals: true, // Se você estiver usando globais no Vitest
    environment: 'node', // Se estiver executando testes no ambiente Node.js
  },
})
