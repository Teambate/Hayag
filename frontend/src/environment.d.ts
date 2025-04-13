/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_URL: string;
  readonly VITE_BACKEND_URL: string;
  readonly VITE_SOCKET_URL: string;
  // add more env variables as needed
}

// Extend the existing ImportMeta interface
interface ImportMeta {
  readonly env: ImportMetaEnv;
} 