import { defineConfig } from "vite";

const isDev = process.env.NODE_ENV !== 'production';

export default defineConfig({
    base: isDev ? '/' : '/roomie-match/',
    server: {
        proxy: {
            '/api': {
                target: 'http://localhost:3000',
                changeOrigin: true
            }
        }
    }
});
