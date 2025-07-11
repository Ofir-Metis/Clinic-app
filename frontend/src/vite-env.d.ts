/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_URL: string;
  readonly VITE_GOOGLE_CLIENT_ID: string;
  // Add other env vars as needed
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
} 