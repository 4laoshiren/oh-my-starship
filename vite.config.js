import { resolve } from 'node:path';
import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import ui from '@nuxt/ui/vite';

export default defineConfig(async () => ({
    root: 'src',
    publicDir: '../public',

    plugins: [
        vue(),
        ui({
            ui: {
                primary: 'zinc',
                neutral: 'zinc',
            },
            colorMode: true,
        }),
    ],

    resolve: {
        alias: {
            '@': resolve(import.meta.dirname, './src'),
        },
    },

    clearScreen: false,
    server: {
        port: 1420,
        strictPort: true,
        watch: {
            ignored: ['**/src-tauri/**'],
        },
    },

    build: {
        outDir: '../dist',
        emptyOutDir: true,
    },

    define: {
        OS_PLATFORM: `"${process.platform}"`,
    },
}));
