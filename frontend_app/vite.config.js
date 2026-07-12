import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");

  return {
    plugins: [react()],

    server: {
      host: true,
      port: 5173,

      proxy: {
        "/api": {
          target: env.BACKEND_TARGET || "http://localhost:8080",
          changeOrigin: true,

          // /api/clientes se transforma en /resources/clientes
          rewrite: (path) => path.replace(/^\/api/, "/resources"),
        },
      },
    },
  };
});