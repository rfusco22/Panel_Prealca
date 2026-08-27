import { loadEnvConfig } from '@next/env';

// server.ts arranca antes de que Next prepare la app, así que en ese momento el
// .env todavía no está cargado. Este módulo se importa PRIMERO en server.ts:
// los módulos ES se evalúan en orden, así que cualquier import posterior que
// lea process.env (por ejemplo lib/session.ts) ya lo encuentra poblado.
loadEnvConfig(process.cwd(), process.env.NODE_ENV !== 'production');
