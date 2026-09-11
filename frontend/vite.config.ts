import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

declare const process: { env: Record<string, string | undefined> };

export default defineConfig({
    plugins: [react()],
    server: {
        host: true,
        proxy: {
            "/api": {
                target: process.env.VITE_BACKEND_URL || process.env.VITE_DEV_BACKEND_URL || "http://127.0.0.1:8000",
                changeOrigin: true,
            },
        },
    },
});