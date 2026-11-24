/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_SUPABASE_URL?: string;
  readonly VITE_SUPABASE_PUBLISHABLE_KEY?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

/** Fingerprint of the desktop shell this build belongs to (see vite.config.ts). */
declare const __SHELL_FINGERPRINT__: string;
