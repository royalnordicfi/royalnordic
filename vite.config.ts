import { defineConfig, type Plugin } from 'vite';
import react from '@vitejs/plugin-react';
import fs from 'node:fs';
import path from 'node:path';

/**
 * Emit /northern-lights-tour.html from the built index.html inside Vite's own
 * write cycle so Vercel framework packaging cannot drop a post-build-only file.
 */
function prerenderNorthernLightsTour(): Plugin {
  return {
    name: 'prerender-northern-lights-tour',
    apply: 'build',
    async writeBundle(outputOptions) {
      const outDir = outputOptions.dir || path.resolve('dist');
      const indexPath = path.join(outDir, 'index.html');
      if (!fs.existsSync(indexPath)) return;

      const { renderMoneyPageHtml, writeMoneyPageFiles } = await import(
        './scripts/prerender-routes.mjs'
      );
      const html = renderMoneyPageHtml(fs.readFileSync(indexPath, 'utf8'));
      writeMoneyPageFiles(html);
    },
  };
}

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react(), prerenderNorthernLightsTour()],
  optimizeDeps: {
    exclude: ['lucide-react'],
  },
  build: {
    cssCodeSplit: true,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules/lucide-react')) return 'icons'
          if (id.includes('node_modules/@supabase')) return 'supabase'
          if (id.includes('node_modules/@stripe')) return 'stripe'
        },
      },
    },
  },
});
