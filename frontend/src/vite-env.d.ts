/// <reference types="vite/client" />

interface ImportMetaEnv {
    /** HTTP API base, e.g. "http://localhost:8000/api" or "/api" behind a proxy */
    readonly VITE_API_URL?: string;
    /** Backend origin for media/static absolute URLs, e.g. "http://localhost:8000" */
    readonly VITE_BACKEND_URL?: string;
    /** WebSocket base, e.g. "ws://localhost:8000" or "wss://example.com" */
    readonly VITE_WS_URL?: string;
}

interface ImportMeta {
    readonly env: ImportMetaEnv;
}
