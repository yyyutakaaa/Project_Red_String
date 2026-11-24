/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_SUPABASE_URL?: string;
  readonly VITE_SUPABASE_PUBLISHABLE_KEY?: string;
  /** "1" sends play statistics from a development build too (src/lib/telemetry.ts). */
  readonly VITE_TELEMETRY?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

/** Fingerprint of the desktop shell this build belongs to (see vite.config.ts). */
declare const __SHELL_FINGERPRINT__: string;

/** The commit this build comes from, first 12 characters (see vite.config.ts). */
declare const __APP_COMMIT__: string;
