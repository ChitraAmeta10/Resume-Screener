/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** Backend API base URL for split deploys (e.g. https://your-api.onrender.com). */
  readonly VITE_API_BASE?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
