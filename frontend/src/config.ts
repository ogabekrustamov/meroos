/**
 * Centralized runtime configuration.
 *
 * In development the frontend (Vite on :5173) talks to the backend on :8000.
 * In production the app is served behind a reverse proxy (nginx) on the same
 * origin, so the defaults become relative paths. Override any of these at build
 * time with VITE_API_URL / VITE_BACKEND_URL / VITE_WS_URL.
 */

const isDev = import.meta.env.DEV;

/** HTTP API base, e.g. http://localhost:8000/api (dev) or /api (prod proxy). */
export const API_BASE_URL: string =
    import.meta.env.VITE_API_URL ?? (isDev ? 'http://localhost:8000/api' : '/api');

/** Backend origin used to build absolute media/static URLs. Empty = same origin. */
export const BACKEND_URL: string =
    import.meta.env.VITE_BACKEND_URL ?? (isDev ? 'http://localhost:8000' : '');

/**
 * Build a WebSocket URL for a backend path such as "/ws/kahoot/ABC123/".
 * Falls back to the current page's host (with ws/wss based on http/https) in
 * production so it works behind the nginx proxy without extra configuration.
 */
export const wsUrl = (path: string): string => {
    const explicit = import.meta.env.VITE_WS_URL;
    if (explicit) return `${explicit}${path}`;
    if (isDev) return `ws://localhost:8000${path}`;
    const proto = window.location.protocol === 'https:' ? 'wss' : 'ws';
    return `${proto}://${window.location.host}${path}`;
};
