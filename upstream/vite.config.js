import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  base: "/open/",
  plugins: [react()],
  define: {
    __ERD_COMMIT__: JSON.stringify(process.env.ERD_COMMIT || "dev"),
  },
})
