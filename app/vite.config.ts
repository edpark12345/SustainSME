import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    // Bind IPv4 explicitly. On Windows, Vite's default ("localhost") often binds
    // only IPv6 (::1), which fails for browsers that resolve localhost to the
    // IPv4 loopback (127.0.0.1). Forcing 127.0.0.1 makes both work reliably.
    host: '127.0.0.1',
    port: 5173,
    strictPort: true,
  },
})
