import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// The built app is served by FastAPI (see backend/app/main.py). In dev, `npm run
// dev` runs Vite with HMR and proxies API calls to the FastAPI server on 8001.
export default defineConfig({
  plugins: [react()],
  build: { outDir: "dist", emptyOutDir: true },
  server: {
    port: 5173,
    proxy: {
      "/v1": "http://localhost:8000",
    },
  },
});
