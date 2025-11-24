/**
 * Vite Configuration
 *
 * VITE: Next-generation frontend build tool
 * BENEFITS:
 * - Lightning-fast HMR (Hot Module Replacement)
 * - Native ES modules in development
 * - Optimized production builds with Rollup
 * - First-class TypeScript support
 *
 * DENO COMPATIBILITY:
 * - Uses npm: specifier for dependencies
 * - Works with Deno's Node compatibility layer
 */

import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

/**
 * Vite configuration
 *
 * CONFIGURATION SECTIONS:
 * - plugins: Vite plugins (React, etc.)
 * - server: Dev server settings
 * - build: Production build settings
 * - resolve: Module resolution
 */
export default defineConfig({
  /**
   * PLUGINS: Extend Vite functionality
   *
   * React Plugin:
   * - Enables Fast Refresh (HMR for React)
   * - JSX/TSX transformation
   * - Automatic React import injection (React 17+ JSX transform)
   */
  plugins: [react()],

  /**
   * DEV SERVER: Development server configuration
   *
   * PORT: Default 5173 (Vite convention)
   * HOST: 0.0.0.0 allows external access (useful for Docker/VMs)
   * OPEN: Auto-open browser on server start
   *
   * PROXY: Not needed since backend has CORS configured
   * If CORS wasn't available, we could proxy API requests:
   * proxy: {
   *   '/api': 'http://localhost:8000'
   * }
   */
  server: {
    port: 5173,
    host: true, // Listen on all addresses
    strictPort: true, // Fail if port is in use
    open: false, // Set to true to auto-open browser
  },

  /**
   * BUILD: Production build configuration
   *
   * OPTIMIZATION:
   * - Tree-shaking removes unused code
   * - Minification reduces bundle size
   * - Code splitting for optimal loading
   *
   * OUTPUT: Build artifacts go to dist/ directory
   */
  build: {
    outDir: "dist",
    sourcemap: true, // Generate source maps for debugging

    /**
     * CHUNK SIZE WARNING: Alert if chunks are too large
     * PERFORMANCE: Large chunks slow down initial load
     */
    chunkSizeWarningLimit: 1000,

    /**
     * ROLLUP OPTIONS: Advanced build configuration
     *
     * CODE SPLITTING: Separate vendor code from app code
     * BENEFIT: Vendor code changes less frequently, better caching
     */
    rollupOptions: {
      output: {
        manualChunks: {
          // Separate React libraries into vendor chunk
          vendor: ["react", "react-dom"],
        },
      },
    },
  },

  /**
   * PREVIEW: Production preview server settings
   *
   * USAGE: npm run preview after build
   * PURPOSE: Test production build locally
   */
  preview: {
    port: 4173,
    host: true,
    strictPort: true,
  },

  /**
   * RESOLVE: Module resolution configuration
   *
   * ALIAS: Create shortcuts for imports
   * EXAMPLE: '@/components/Button' instead of '../../../components/Button'
   *
   * FUTURE: Add aliases for cleaner imports
   * resolve: {
   *   alias: {
   *     '@': '/src',
   *     '@components': '/src/components',
   *   }
   * }
   */
});
