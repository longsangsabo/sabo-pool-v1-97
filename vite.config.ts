import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";
import { visualizer } from 'rollup-plugin-visualizer';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  base: '/', // Remove base path to fix routing issues
  server: {
    host: "::",
    port: 8080,
  },
  plugins: [
    react(),
    mode === 'development' &&
    componentTagger(),
    mode === 'analyze' && visualizer({
      filename: 'dist/stats.html',
      open: true,
      gzipSize: true,
      brotliSize: true,
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
        manualChunks: {
          // Core React libraries
          'react-vendor': ['react', 'react-dom'],
          
          // Routing
          'router': ['react-router-dom'],
          
          // UI Components (split by usage frequency)
          'ui-core': [
            '@radix-ui/react-dialog',
            '@radix-ui/react-dropdown-menu',
            '@radix-ui/react-slot'
          ],
          'ui-forms': [
            '@radix-ui/react-select',
            '@radix-ui/react-checkbox',
            'react-hook-form'
          ],
          'ui-advanced': [
            '@radix-ui/react-tabs',
            '@radix-ui/react-accordion',
            '@radix-ui/react-navigation-menu'
          ],
          
          // Data & State Management
          'data': ['@tanstack/react-query', '@supabase/supabase-js'],
          
          // Utilities
          'utils': ['date-fns', 'clsx', 'tailwind-merge'],
          
          // Charts & Visualization (lazy load)
          'charts': ['recharts', 'd3'],
          
          // Performance & Virtualization
          'performance': ['react-window', 'react-window-infinite-loader'],
          
          // Less frequently used libraries
          'misc': ['framer-motion', 'react-helmet-async']
        },
      },
    },
    chunkSizeWarningLimit: 1000,
    // Enable build optimizations
    target: 'esnext',
    minify: 'esbuild',
    // Split CSS
    cssCodeSplit: true,
  },
  optimizeDeps: {
    include: ['react', 'react-dom', 'react-router-dom'],
  },
}));
