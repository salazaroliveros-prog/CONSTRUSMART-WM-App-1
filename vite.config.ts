import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";
import path from "path";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
  },
  plugins: [
    react(),
    VitePWA({
      registerType: "autoUpdate",
      workbox: {
        globPatterns: ["**/*.{js,css,html,ico,png,svg}"],
        cleanupOutdatedCaches: true,
        clientsClaim: true,
      },
      devOptions: {
        enabled: true,
      },
      includeAssets: ["favicon.ico", "logo.png", "icons/icon-192.png", "icons/icon-512.png", "icons/apple-touch-icon.png"],
      manifest: {
        short_name: "CONSTRUSMART",
        name: "CONSTRUSMART WM App",
        icons: [
          {
            src: "/icons/icon-192.png",
            sizes: "192x192",
            type: "image/png",
            purpose: "any maskable"
          },
          {
            src: "/icons/icon-512.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "any maskable"
          },
          {
            src: "/logo.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "any"
          }
        ],
        start_url: "/",
        scope: "/",
        display: "standalone",
        background_color: "#ffffff",
        theme_color: "#1E3A8A",
        orientation: "portrait"
      },
    }),
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules')) {
            if (id.includes('react')) return 'vendor-react';
            if (id.includes('recharts')) return 'vendor-charts';
            if (id.includes('lucide')) return 'vendor-icons';
            if (id.includes('zod') || id.includes('hook-form')) return 'vendor-forms';
            return 'vendor-other';
          }
        },
      },
    },
  },
}));
