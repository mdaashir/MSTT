import type { Plugin } from 'vite';

/**
 * SEO assets plugin.
 *
 * The app has no fixed public URL: it runs on localhost in development and
 * behind whatever host it is deployed to. Absolute URLs are mandatory for
 * canonical links, Open Graph tags and sitemaps, so rather than commit a
 * placeholder domain we resolve one URL from `VITE_SITE_URL` and inject it
 * everywhere at build time.
 *
 * `robots.txt` and `sitemap.xml` are generated from the same value, which keeps
 * them consistent with the HTML instead of drifting as three hand-edited files.
 */

export type SeoOptions = {
  /** Absolute origin, no trailing slash, e.g. https://tickets.example.com */
  siteUrl: string;
};

/** Placeholder tokens in index.html, replaced during transformIndexHtml. */
const SITE_URL_TOKEN = '__SITE_URL__';

export function seoAssets({ siteUrl }: SeoOptions): Plugin {
  const origin = siteUrl.replace(/\/+$/, '');

  // The API is excluded: JSON responses have no search value, and crawling it
  // only wastes budget that should go to the single real page.
  const robots = [
    'User-agent: *',
    'Allow: /',
    'Disallow: /api/',
    '',
    `Sitemap: ${origin}/sitemap.xml`,
    '',
  ].join('\n');

  // One route today, so one entry. If client-side routing is added, list the
  // real paths here; a sitemap full of URLs that 404 does more harm than good.
  const lastmod = new Date().toISOString().slice(0, 10);
  const sitemap = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    '  <url>',
    `    <loc>${origin}/</loc>`,
    `    <lastmod>${lastmod}</lastmod>`,
    '    <changefreq>weekly</changefreq>',
    '    <priority>1.0</priority>',
    '  </url>',
    '</urlset>',
    '',
  ].join('\n');

  const serve = (body: string, contentType: string) => ({
    body,
    contentType,
  });

  return {
    name: 'seo-assets',

    transformIndexHtml(html) {
      // A literal leftover token would ship a broken canonical URL, so replace
      // every occurrence and leave nothing to chance.
      return html.replaceAll(SITE_URL_TOKEN, origin);
    },

    // In dev there is no build step, so serve the same bytes from middleware.
    // This means robots.txt can be checked locally before it ever goes live.
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        // `url` is a Node IncomingMessage property and the frontend tsconfig has
        // no Node types by design, so narrow it here instead of adding them.
        const url = (req as { url?: string }).url ?? '';
        const path = url.split('?')[0];
        const asset =
          path === '/robots.txt'
            ? serve(robots, 'text/plain; charset=utf-8')
            : path === '/sitemap.xml'
              ? serve(sitemap, 'application/xml; charset=utf-8')
              : undefined;

        if (!asset) {
          next();
          return;
        }

        res.setHeader('Content-Type', asset.contentType);
        res.end(asset.body);
      });
    },

    generateBundle() {
      this.emitFile({ type: 'asset', fileName: 'robots.txt', source: robots });
      this.emitFile({ type: 'asset', fileName: 'sitemap.xml', source: sitemap });
    },
  };
}
