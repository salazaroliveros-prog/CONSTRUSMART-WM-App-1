import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import { VitePWA } from "vite-plugin-pwa";
import path from "path";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
    hmr: {
      protocol: "ws",
      host: "localhost",
      port: 8080,
    },
    allowedHosts: "all",
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
    chunkSizeWarningLimit: 1200,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules')) {
            if (id.includes('react')) return 'vendor-react';
            if (id.includes('recharts')) return 'vendor-charts';
            if (id.includes('lucide')) return 'vendor-icons';
            if (id.includes('zod') || id.includes('hook-form')) return 'vendor-forms';
            if (id.includes('framer-motion')) return 'vendor-motion';
            if (id.includes('supabase')) return 'vendor-supabase';
            if (id.includes('tanstack')) return 'vendor-query';
            if (id.includes('tesseract')) return 'vendor-tesseract';
            if (id.includes('xlsx')) return 'vendor-xlsx';
            if (id.includes('html2pdf')) return 'vendor-pdf';
            if (id.includes('highlight')) return 'vendor-highlight';
            if (id.includes('react-router')) return 'vendor-router';
            if (id.includes('date-fns')) return 'vendor-dates';
            if (id.includes('@radix-ui')) return 'vendor-radix';
            if (id.includes('embla-carousel')) return 'vendor-ui';
            if (id.includes('sonner') || id.includes('vaul') || id.includes('cmdk')) return 'vendor-ui';
            if (id.includes('day-picker')) return 'vendor-ui';
            if (id.includes('resizable-panels')) return 'vendor-ui';
            return 'vendor-other';
          }
        },
      },
    },
  },
}));
