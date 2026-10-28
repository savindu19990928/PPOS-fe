/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly GITHUB_TOKEN?: string;
  readonly VITE_GITHUB_TOKEN?: string;
  readonly [key: string]: string | boolean | undefined;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
